import { Product } from '@/entities/product.entity';
import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { capitalizeStr } from '@/common/utils/capitalize-str.util';
import slugify from 'slugify';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { logHelper } from '@/common/utils/logger-helper.util';
import { ProductPhisycal } from '@/entities/product-phisycal.entity';
import { ProductShipping } from '@/entities/product-shipping.entity';
import { ProductPhoto } from '@/entities/product-photo.entity';
import { ProductDescription } from '@/entities/product-description.entity';
import { ProductVariant } from '@/entities/product-variants.entity';
import { ProductGroup } from '@/entities/product-group.entity';
import { ProductGroupItem } from '@/entities/product-group-item.entity';
import { AttributeValue } from '@/entities/attribute-value.entity';
import { EditProductDescriptionsDto } from './dto/edit-product-description.dto';
import { CreateProductDescriptiomDto } from './dto/create-product-description.dto';
import { UploadImagesProductProductDto } from './dto/upload-images-product.dto';
import { SetCoverProductDto } from './dto/set-cover-product.dto';
import { CreateVariationProductDto } from './dto/create-variation-product.dt';
import { UpdateNameVariationDto } from './dto/update-name-variation.dto';
import { AttributeGroup } from '@/entities/attribute-group.entity';
import { deleteToS3 } from '@/common/utils/delete-to-s3.util';
import { SetMiniatureProductDto } from './dto/set-miniature-product.dto';
import { UpdateGroupInProductDto } from './dto/update-group-in-product.dto';
import { Attribute } from '@/entities/attribute.entity';
import { log } from 'console';
import { AnyMxRecord } from 'dns';
import { calculateQuality, getQualityLabel } from './utils/calculate-total.util';
import { getPagination } from '@/common/utils/get-pagination.util';
import { KibanaService } from '@/common/services/kibana/kibana.service';

@Injectable()
export class ProductService {
	private readonly logger = new Logger('AuthService');

	constructor(
		@InjectRepository(Product) private productRepository: Repository<Product>,
		@InjectRepository(ProductPhisycal) private productPhisycalRepository: Repository<ProductPhisycal>,
		@InjectRepository(ProductShipping) private productShippingRepository: Repository<ProductShipping>,
		@InjectRepository(ProductPhoto) private productPhotoRepository: Repository<ProductPhoto>,
		@InjectRepository(ProductDescription) private productDescriptionRepository: Repository<ProductDescription>,
		@InjectRepository(ProductVariant) private productVariantRepository: Repository<ProductVariant>,
		@InjectRepository(ProductGroup) private productGroupRepository: Repository<ProductGroup>,
		@InjectRepository(ProductGroupItem) private productGroupItemRepository: Repository<ProductGroupItem>,
		@InjectRepository(AttributeGroup) private attributeGroupRepository: Repository<AttributeGroup>,
		private readonly dataSource: DataSource,
		private readonly kibanaService: KibanaService
	) {}

	async create_product(createProductDto: CreateProductDto) {
		try {
			const savedProduct = await this.dataSource.transaction(async (manager) => {
				const data = { ...createProductDto };
				const randomNumber = Math.floor(10000 + Math.random() * 99999);
				data.name = capitalizeStr(data.name.toUpperCase());
				data.slug = `${slugify(data.name, {
					lower: true,
					strict: true,
					trim: true,
				})}-${randomNumber}`;
				data.type = 'Fisico';

				const product = manager.getRepository(Product).create({
					...data,
					name: data.name,
					slug: data.slug,
					type: 'Fisico',
				});

				const savedProduct = await manager.getRepository(Product).save(product);
				const productId = savedProduct.id;

				await manager.getRepository(ProductPhisycal).save({
					...data,
					productId,
				});

				await manager.getRepository(ProductShipping).save({
					...data,
					productId,
				});

				if (Array.isArray(data.gallery) && data.gallery.length > 0) {
					const photos = data.gallery.map((url) => ({
						url,
						productId,
					}));

					await manager.getRepository(ProductPhoto).save(photos);
				}

				if (Array.isArray(data.attributes) && data.attributes.length > 0) {
					const attributeRepository = manager.getRepository(Attribute);
					const attributeValueRepository = manager.getRepository(AttributeValue);

					const attributeIds = [...new Set(data.attributes.map((x) => x.attributeId))];
					const attributeValueIds = [...new Set(data.attributes.map((x) => x.attributeValueId))];

					let attributes = await attributeRepository.find({
						where: {
							id: In(attributeIds),
						},
						select: ['id'],
					});

					const attributeValues = await attributeValueRepository.find({
						where: {
							id: In(attributeValueIds),
						},
						select: ['id'],
					});

					const validAttributeIds = new Set(attributes.map((x) => x.id));
					const validAttributeValueIds = new Set(attributeValues.map((x) => x.id));

					data.attributes = data.attributes.filter((item) => validAttributeIds.has(item.attributeId) && validAttributeValueIds.has(item.attributeValueId));

					attributes = data.attributes.map((attr) => ({
						...attr,
						productId,
					}));
					await manager.getRepository(ProductDescription).save(attributes);
				}

				// === 6) Guardar variaciones ===
				if (Array.isArray(data.variations) && data.variations.length > 0) {
					for (const item of data.variations) {
						await manager.getRepository(ProductVariant).save({
							name: item.name,
							productId,
						});
					}
				}

				if (!createProductDto.productGroupId) {
					const group = await manager.getRepository(ProductGroup).save({
						categoryId: product.categoryId,
					});
					await manager.getRepository(ProductGroupItem).save({
						productGroupId: group.id,
						productId,
					});
				} else {
					await manager.getRepository(ProductGroupItem).save({
						productGroupId: createProductDto.productGroupId,
						productId,
					});
				}

				return savedProduct;
			});
			await this.update_quality(savedProduct.id);
			return savedProduct;
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_quality(id: string): Promise<void> {
		try {
			const product = await this.productRepository
			.createQueryBuilder('product')
			.leftJoinAndSelect('product.productPhotos', 'photo')
			.leftJoinAndSelect('product.productDescriptions', 'description')
			.select([
				'product.id',
				'product.name',
				'product.description',
				'product.extract',
				'product.tags',
				'photo.id',
				'description.id',
			])
			.where('product.id = :id', { id })
			.getOne();

			console.log('update_quality',product);
				

			if (!product)
				return;

			const quality = calculateQuality(product);

			await this.productRepository.update(id, {
				quality: quality.score
			});
		} catch (err:any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_products(query: {
		filter: string;
		page: number;
		limit: number;
		status: string;
		visibility: string;
		categories: string;
		brands: string;
		countries: string;
		minPrice: number | string;
		maxPrice: number | string;
		quality: string
	}) {
		try {
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			const pagination = getPagination(query.page, query.limit);
			const queryBuilder = this.productRepository
				.createQueryBuilder('product')
				.leftJoin('product.category', 'category')
				.leftJoin('product.subcategory', 'subcategory')
				.leftJoin('product.brand', 'brand')
				.addSelect(['category.id', 'category.name', 'subcategory.id', 'subcategory.name', 'brand.id', 'brand.name', 'brand.logoUrl']);

			if (query.minPrice && query.maxPrice) {
				queryBuilder.andWhere(
					`CASE 
						WHEN product.priceDiscount > 0 THEN product.priceDiscount 
						ELSE product.priceRegular 
					END BETWEEN :minPrice AND :maxPrice`,
					{ minPrice: query.minPrice, maxPrice: query.maxPrice }
				);
			}

			if (query.filter?.trim()) {
				const searchTerms = query.filter
					.trim()
					.split(/\s+/)
					.slice(0, 5) // Limitar términos si quieres
					.map((t) => t.toLowerCase());

				const columns = ['product.name'];

				searchTerms.forEach((term, idx) => {
					const conditions = columns.map((c) => `${c} ILIKE :term${idx}`).join(' OR ');
					const params = { [`term${idx}`]: `%${term}%` };
					idx === 0 ? queryBuilder.where(`(${conditions})`, params) : queryBuilder.andWhere(`(${conditions})`, params);
				});
			}

			if (query.status && query.status !== 'Todos') {
				queryBuilder.andWhere('product.status = :status', {
					status: query.status,
				});
			}

			if (query.visibility && query.visibility !== 'Todos') {
				queryBuilder.andWhere('product.visibility = :visibility', {
					visibility: query.visibility,
				});
			}

			if (query.categories && query.categories !== 'Todos') {
				const categoryIds = query.categories.split(',');
				const validCategoryIds = categoryIds.filter((id) => uuidRegex.test(id));
				console.log('validCategoryIds', validCategoryIds);

				if (validCategoryIds.length > 0) {
					queryBuilder.andWhere('product.category.id IN (:...validCategoryIds)', {
						validCategoryIds,
					});
				}
			}

			if (query.brands && query.brands !== 'Todos') {
				const brandIds = query.brands.split(',');
				const validBrandIds = brandIds.filter((id) => uuidRegex.test(id));

				if (validBrandIds.length > 0) {
					queryBuilder.andWhere('product.brand.id IN (:...validBrandIds)', {
						validBrandIds,
					});
				}
			}

			if (query.countries && query.countries !== 'Todos') {
				const countriesCode = query.countries.split(',');

				if (countriesCode.length > 0) {
					queryBuilder.andWhere("product.countryOfOrigin ->> 'code' IN (:...countries)", { countries: countriesCode });
				}
			}

			if (query.quality && query.quality !== 'Todos') {
				if (query.quality === 'low') {
					queryBuilder.andWhere('product.quality <= :score', { score: 39 });
				} else if (query.quality === 'medium') {
					queryBuilder.andWhere('product.quality > 39 AND product.quality <= 64');
				} else if (query.quality === 'high') {
					queryBuilder.andWhere('product.quality > 64');
				}
			}

			let [products, totalProducts]: any = await queryBuilder.orderBy('product.createdAt', 'DESC').skip(pagination.skip).take(query.limit).getManyAndCount();

			products = products.map((attr) => {
				return {
					id: attr.id,
					name: attr.name,
					category: attr.category,
					subcategory: attr.subcategory,
					brand: attr.brand,
					averageRaiting: attr.averageRaiting,
					salesCount: attr.salesCount,
					unitOfMeasure: attr.unitOfMeasure,
					priceRegular: attr.priceRegular,
					priceDiscount: attr.priceDiscount,
					cover: attr.cover,
					extract: attr.extract,
					miniature: attr.miniature,
					status: attr.status,
					createdAt: attr.createdAt,
					updatedAt: attr.updatedAt,
					quality_label: getQualityLabel(attr.quality),
				};
			});

			return {
				products,
				totalProducts,
				totalPages: Math.ceil(totalProducts / query.limit),
				currentPage: query.page,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_feature_attribute(id: string, isFeatured: boolean, request: any) {
		try {
			const exists = await this.productDescriptionRepository.exists({ where: { id } });
			if (!exists) {
				throw new NotFoundException('No se encontró el registro.');
			}
			const result = await this.productDescriptionRepository
				.createQueryBuilder()
				.update(ProductDescription)
				.set({
					isFeatured: !isFeatured
				})
				.where('id = :id', { id })
				.returning(['id', 'isFeatured'])
				.execute();

			if (!result.affected) {
				throw new InternalServerErrorException('No se pudo actualizar el registro.');
			}

			if (!result.raw?.length) {
				throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			}

			const updatedBrand = result.raw[0];

			this.kibanaService.audit({
				action: 'update_feature_attribute',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify({ isFeatured }),
				response: JSON.stringify(result.raw[0]),
				requestId: request.requestId,
			});
			return {
				message: 'Registro actualizado correctamente.',
				data: updatedBrand,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_product(id: string) {
		try { 
			const product :any= await this.productRepository
				.createQueryBuilder('product')
				.leftJoinAndSelect('product.category', 'category')
				.leftJoinAndSelect('product.subcategory', 'subcategory')
				.select('product')
				.addSelect(['category.id', 'category.name', 'subcategory.id', 'subcategory.name'])
				.where('product.id = :id', { id })
				.getOne();

			if (!product) {
				throw new NotFoundException('No se encontró el registro.');
			}

			let physical: any = await this.productPhisycalRepository.createQueryBuilder('productPhysical').where('productPhysical.productId = :id', { id }).getOne();

			let shipping: any = await this.productShippingRepository.createQueryBuilder('productShipping').where('productShipping.productId = :id', { id }).getOne();
			
			product.quality_label = getQualityLabel(product.quality);

			return { product, physical, shipping };
		} catch (err:any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_product(id: string, data: any) {
		const queryRunner = this.dataSource.createQueryRunner();

		await queryRunner.connect();
		await queryRunner.startTransaction();

		try {
			await queryRunner.manager.update(
				Product,
				{ id },
				{
					visibility: data.visibility,
					status: data.status,
					name: data.name,
					unitOfMeasure: data.unitOfMeasure,
					countryOfOrigin: data.countryOfOrigin,
					warranty: data.warranty,
					condition: data.condition,
					description: data.description,
					extract: data.extract,
					tags: data.tags,
					priceRegular: data.priceRegular,
					priceDiscount: data.priceDiscount,
					allowBackorder: data.allowBackorder,
					maxOrderLimit: data.maxOrderLimit,
					maxStock: data.maxStock,
					minStock: data.minStock,
					brandId: data.brandId,
					categoryId: data.categoryId,
					subcategoryId: data.subcategoryId,
					isBestSeller: data.isBestSeller,
					isNewArrival: data.isNewArrival,
					isFeatured: data.isFeatured,
					isLimitedEdition: data.isLimitedEdition,
					isPreOrder: data.isPreOrder,
					isExportable: data.isExportable,
				},
			);

			await queryRunner.manager.update(
				ProductPhisycal,
				{ productId: id },
				{
					dimensionUnit: data.dimensionUnit,
					weightUnit: data.weightUnit,
					height: data.height,
					width: data.width,
					weight: data.weight,
					length: data.length,
					storageTempUnit: data.storageTempUnit,
					maxStorageTemp: data.maxStorageTemp,
					minStorageTemp: data.minStorageTemp,
					isFragile: data.isFragile,
					isPerishable: data.isPerishable,
					isEcoFriendly: data.isEcoFriendly,
					isBiodegradable: data.isBiodegradable,
					isRequiresRefrigeration: data.isRequiresRefrigeration,
					isRequiresAssembly: data.isRequiresAssembly,
					isHazardous: data.isHazardous,
					isFlammable: data.isFlammable,
				},
			);

			await queryRunner.manager.update(
				ProductShipping,
				{ productId: id },
				{
					packageType: data.packageType,
					pickupInStore: data.pickupInStore,
					freeShipping: data.freeShipping,
					handlingDays: data.handlingDays,
					specialInstructions: data.specialInstructions,
				},
			);

			await queryRunner.commitTransaction();

			try {
				await this.update_quality(id);
			} catch (err) {
				if (err) throw err;
				throw new InternalServerErrorException('Ocurrió un problema en servidor.');
			}

			return {
				message: 'Información actualizada correctamente.',
			};
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async update_product_description(editProductDescriptionsDto: EditProductDescriptionsDto) {
		const queryRunner = this.dataSource.createQueryRunner();

		await queryRunner.connect();
		await queryRunner.startTransaction();

		try {
			await queryRunner.manager.delete(ProductDescription, {
				productId: editProductDescriptionsDto.productId,
				attributeId: editProductDescriptionsDto.attributeId,
			});

			const descriptions = editProductDescriptionsDto.descriptions.map((item) =>
				queryRunner.manager.create(ProductDescription, {
					productId: editProductDescriptionsDto.productId,
					attributeId: item.attributeId,
					attributeValueId: item.attributeValueId,
					value: item.value,
				})
			);

			const savedDescriptions = await queryRunner.manager.save(descriptions);

			await queryRunner.commitTransaction();

			return {
				message: 'Registro actualizado correctamente.',
				data: {
					groupId: editProductDescriptionsDto.groupId,
					attributeId: editProductDescriptionsDto.attributeId,
					attributeValueId: [...new Set(descriptions.map((item) => item.attributeValueId))],
					attributeValues: savedDescriptions.map((item:any) => ({
						id: item.id,
						value: item.value
					})),
				},
			};
		} catch (err) {
			await queryRunner.rollbackTransaction();
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		} finally {
			await queryRunner.release();
		}
	}

	

	async upload_images_product(uploadImagesProductProductDto: UploadImagesProductProductDto) {
		const { productId, gallery } = uploadImagesProductProductDto;
		try {
			const records = gallery!.map((url) =>
				this.productPhotoRepository.create({
					productId,
					url,
				})
			);
			const result = await this.productPhotoRepository.save(records);
			return {
				data: result,
				message: 'Imagen cargada correctamente',
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async set_cover_product(id: string, setCoverProductDto: SetCoverProductDto) {
		let result;
		try {
			result = await this.productRepository.createQueryBuilder().update(Product).set(setCoverProductDto).where('id = :id', { id: id }).returning(['cover']).execute();
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
		return {
			message: 'Registro actualizado correctamente.',
			data: result.raw[0],
		};
	}

	async set_miniature_product(id: string, setMiniatureProductDto: SetMiniatureProductDto) {
		let result;
		try {
			result = await this.productRepository.createQueryBuilder().update(Product).set(setMiniatureProductDto).where('id = :id', { id: id }).returning(['miniature']).execute();
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}

		return {
			message: 'Registro actualizado correctamente.',
			data: result.raw[0],
		};
	}

	async delete_image_product(id: string) {
		let result;
		try {
			const photo = await this.productPhotoRepository.findOne({
				where: { id },
				select: {
					id: true,
					url: true,
				},
			});

			if (!photo) {
				throw new NotFoundException('La imagen no existe.');
			}

			await Promise.all([deleteToS3(`products/small/${photo.url}`), deleteToS3(`products/medium/${photo.url}`), deleteToS3(`products/large/${photo.url}`)]);

			result = await this.productPhotoRepository.createQueryBuilder().delete().from(ProductPhoto).where('id = :id', { id }).returning('id').execute();
		} catch (err) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}

		return {
			message: 'Registro eliminado correctamente.',
			data: result.raw[0],
		};
	}

	async create_variation_product(createVariationProductDto: CreateVariationProductDto) {
		try {
			createVariationProductDto.sku = 'TEST';
			const variationProduct = this.productVariantRepository.create(createVariationProductDto);
			const saver = await this.productVariantRepository.save(variationProduct);
			return {
				message: 'Registro creado correctamente.',
				data: saver,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_characteristics_product(id: string) {
		try {
			const product: any = await this.productRepository.createQueryBuilder('product').select(['product.categoryId', 'product.id']).where('product.id = :id', { id }).getOne();

			const descriptions: any = await this.productDescriptionRepository
				.createQueryBuilder('productDescription')
				.where('productDescription.productId = :id', { id })
				.getMany();

			console.log('descriptions', descriptions[0]);

			const groups = await this.attributeGroupRepository
				.createQueryBuilder('attributeGroup')
				.innerJoin('attributeGroup.attributeCategories', 'attributeCategory', 'attributeCategory.categoryId = :categoryId', { categoryId: product.categoryId })
				.leftJoinAndSelect('attributeGroup.attributes', 'attribute')
				.leftJoinAndSelect('attribute.attributeValues', 'attributeValue')
				.select(['attributeGroup.id', 'attributeGroup.name', 'attributeGroup.status', 'attribute.id', 'attribute.name', 'attributeValue.id', 'attributeValue.value'])
				.where('attributeGroup.status = :status', { status: true })
				.andWhere('(attribute.id IS NULL OR attribute.status = :attributeStatus)', {
					attributeStatus: true,
				})
				.getMany();

			let result = groups
				.map((group) => ({
					...group,
					attributes: group.attributes
						.filter((attr) => attr.attributeValues?.length > 0)
						.map((attr) => ({
							...attr,
							attributeValueId: null,
						})),
				}))
				.filter((group) => group.attributes.length > 0);

			result = result
			.map((group) => {
				const attributes = group.attributes.map((attr) => {
					const description = descriptions.find(
						(d) => d.attributeId === attr.id,
					);

					return {
						...attr,
						isFeatured: description?.isFeatured ?? false,
						productDescriptionId: description?.id,
						attributeValueId: descriptions
							.filter((d) => d.attributeId === attr.id)
							.map((d) => d.attributeValueId),
					};
				});

				const groupAttributeValueIds = attributes.flatMap(
					(attr) => attr.attributeValueId,
				);

				return {
					...group,
					attributes,
					groupAttributeValueIds,
					totalAttributeValueIds: groupAttributeValueIds.length,
				};
			})
			.sort((a, b) => b.totalAttributeValueIds - a.totalAttributeValueIds);

			console.log('groups', result[0].attributes[0]);
			return result;
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_photos_product(id: string) {
		try {
			let photos = await this.productPhotoRepository.createQueryBuilder('productPhoto').where('productPhoto.productId = :id', { id }).getMany();
			return photos;
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_variations_product(id: string) {
		try {
			let variations = await this.productVariantRepository.createQueryBuilder('productVariation').where('productVariation.productId = :id', { id }).getMany();
			return variations;
		} catch (err:any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_status_variation(id: string, status: boolean) {
		try {
			const result = await this.productVariantRepository
				.createQueryBuilder()
				.update(ProductVariant)
				.set({
					status: !status,
				})
				.where('id = :id', { id })
				.returning('*')
				.execute();

			return {
				message: 'Registro actualizado correctamente.',
				data: result.raw[0],
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_name_variation(id: string, updateNameVariationDto: UpdateNameVariationDto) {
		let result;
		try {
			result = await this.productVariantRepository.createQueryBuilder().update(ProductVariant).set(updateNameVariationDto).where('id = :id', { id }).returning('*').execute();
		} catch (err) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}

		return {
			message: 'Registro actualizado correctamente.',
			data: result.raw[0],
		};
	}

	async update_group_product(id: string, updateNameVariationDto: UpdateNameVariationDto) {
		let result;
		try {
			result = await this.productVariantRepository.createQueryBuilder().update(ProductVariant).set(updateNameVariationDto).where('id = :id', { id }).returning('*').execute();
		} catch (err) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}

		return {
			message: 'Registro actualizado correctamente.',
			data: result.raw[0],
		};
	}

	async get_groups_for_create_product(categoryId: string, query: { filter?: string; productId?: string }) {
		try {
			const qb = this.productGroupRepository
				.createQueryBuilder('group')
				.leftJoinAndSelect('group.productGroupItems', 'item')
				.leftJoinAndSelect('item.product', 'product')
				.where('group.categoryId = :categoryId', { categoryId });

			if (query.productId) {
				qb.leftJoin(ProductGroupItem, 'currentItem', 'currentItem.productGroupId = group.id AND currentItem.productId = :productId', {
					productId: query.productId,
				}).andWhere('currentItem.id IS NULL');
			}

			if (query.filter?.trim()) {
				qb.andWhere('CAST(group.code AS TEXT) ILIKE :filter', {
					filter: `%${query.filter.trim()}%`,
				});
			}

			return await qb.getMany();
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async import_product_for_group(productGroupId: string) {
		try {
			let groupItem = await this.productGroupItemRepository.createQueryBuilder('groupItem').where('groupItem.productGroupId = :productGroupId', { productGroupId }).getOne();

			let product = await this.productRepository
				.createQueryBuilder('product')
				.select([
					'product.id',
					'product.name',
					'product.description',
					'product.extract',
					'product.mainAttribute',
					'product.mainAttributeValue',
					'product.unitOfMeasure',
					'product.condition',
					'product.warranty',
					'product.countryOfOrigin',
					'product.tags',
					'product.brandId',
					'product.categoryId',
					'product.subcategoryId',
					'product.priceRegular',
					'product.priceDiscount',
				])
				.where('product.id = :id', { id: groupItem!.productId })
				.getOne();

			let physical = await this.productPhisycalRepository
				.createQueryBuilder('physical')
				.select([
					'physical.id',
					'physical.weight',
					'physical.weightUnit',
					'physical.height',
					'physical.width',
					'physical.length',
					'physical.dimensionUnit',
					'physical.material',
					'physical.storageTempUnit',
					'physical.maxStorageTemp',
					'physical.minStorageTemp',
					'physical.isRequiresAssembly',
					'physical.isFlammable',
					'physical.isRequiresRefrigeration',
					'physical.isHazardous',
					'physical.isBiodegradable',
					'physical.isEcoFriendly',
					'physical.isPerishable',
					'physical.isFragile',
				])
				.where('physical.productId = :productId', { productId: groupItem!.productId })
				.getOne();

			return {
				product,
				physical,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async validate_name_product(name: string) {
		const product = await this.productRepository.findOneBy({ name });
		return product;
	}

	async update_group_in_product(productId: string, updateGroupInProductDto: UpdateGroupInProductDto) {
		try {
			console.log('updateGroupInProductDto', updateGroupInProductDto);

			await this.dataSource.transaction(async (manager) => {
				const destinationGroup = await manager.getRepository(ProductGroup).findOne({
					where: {
						id: updateGroupInProductDto.productGroupId,
					},
				});

				if (!destinationGroup) {
					throw new NotFoundException('No existe el grupo de destino.');
				}

				const currentItem = await manager.getRepository(ProductGroupItem).findOne({
					where: { productId },
				});

				const alreadyExists = await manager.getRepository(ProductGroupItem).findOne({
					where: {
						productId,
						productGroupId: updateGroupInProductDto.productGroupId,
					},
				});

				if (alreadyExists) {
					throw new ConflictException('El producto ya pertenece al grupo destino.');
				}

				if (!currentItem) {
					const createdItem = await manager.getRepository(ProductGroupItem).save({
						productId,
						productGroupId: updateGroupInProductDto.productGroupId,
					});

					if (!createdItem) {
						throw new InternalServerErrorException('No se pudo asignar al nuevo grupo.');
					}

					return createdItem;
				}

				const count = await manager
					.getRepository(ProductGroupItem)
					.createQueryBuilder('item')
					.where((qb) => {
						const subQuery = qb.subQuery().select('pgi.productGroupId').from(ProductGroupItem, 'pgi').where('pgi.productId = :productId').getQuery();

						return `item.productGroupId = ${subQuery}`;
					})
					.andWhere('item.productId != :productId')
					.setParameter('productId', productId)
					.getCount();

				if (count === 0) {
					const deletedGroup = await manager.getRepository(ProductGroup).delete(currentItem.productGroupId);

					if (!deletedGroup.affected) {
						throw new InternalServerErrorException('No se pudo eliminar el grupo actual.');
					}
				} else {
					const deletedItem = await manager.getRepository(ProductGroupItem).delete(currentItem.id);

					if (!deletedItem.affected) {
						throw new InternalServerErrorException('No se pudo eliminar el item actual.');
					}
				}

				const createdItem = await manager.getRepository(ProductGroupItem).save({
					productId,
					productGroupId: updateGroupInProductDto.productGroupId,
				});

				if (!createdItem) {
					throw new InternalServerErrorException('No se pudo asignar al nuevo grupo.');
				}

				return createdItem;
			});
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async find_products_to_copy(categoryId: string, name?: string) {
		try {
			const query = this.productRepository
				.createQueryBuilder('product')
				.leftJoinAndSelect('product.subcategory', 'subcategory')
				.select([
					'product.id',
					'product.name',
					'product.miniature',
					'product.createdAt',
					'subcategory.id',
					'subcategory.name',
				])
				.where('product.categoryId = :categoryId', { categoryId });

			if (name?.trim()) {
				query
					.andWhere('LOWER(product.name) LIKE LOWER(:name)', {
						name: `%${name.trim()}%`,
					})
					.orderBy('product.name', 'ASC');
			} else {
				query
					.orderBy('product.createdAt', 'DESC')
					.take(10);
			}

			const products = await query.getMany();

			return {
				data: products,
				message: 'Productos encontrados correctamente.',
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	
}
