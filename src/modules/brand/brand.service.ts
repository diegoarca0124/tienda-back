import { Brand } from '@/entities/brand.entity';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBrandDto } from './dto/create-brand.dto';
import { capitalizeStr } from '@/common/utils/capitalize-str.util';
import slugify from 'slugify';
import { EditBrandDto } from './dto/edit-brand-dto';
import { UpdateStatusBrandsDto } from './dto/update-status-brands.dto';
import { Product } from '@/entities/product.entity';
import { KibanaService } from '@/common/services/kibana/kibana.service';
import { getPagination } from '@/common/utils/get-pagination.util';
import { getQualityLabel } from './utils/calculate-total.util';

@Injectable()
export class BrandService {
	private readonly logger = new Logger('AuthService');

	constructor(
		@InjectRepository(Brand) private brandRepository: Repository<Brand>,
		@InjectRepository(Product) private productRepository: Repository<Product>,
		private kibanaService: KibanaService
	) {}

	async create_brand(createBrandDto: CreateBrandDto, request: any) {
		try {
			const result = await this.brandRepository
				.createQueryBuilder()
				.insert()
				.into(Brand)
				.values({
					...createBrandDto,
					slug: slugify(createBrandDto.name, {
						lower: true,
						strict: true,
						trim: true,
					}),
				})
				.returning(['id'])
				.execute();

			const id = result.raw[0]?.id;

			if (!id) {
				throw new InternalServerErrorException('No se pudo registrar la marca.');
			}

			this.kibanaService.audit({
				action: 'create_brand',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify(createBrandDto),
				response: JSON.stringify({ id }),
				requestId: request.requestId,
			});

			return {
				message: 'Registro creado correctamente.',
				data: id,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_brands(query: { filter: string; page: number; limit: number; status: string; countries: string; sort: any }) {
		try {
			const pagination = getPagination(query.page, query.limit);

			const queryBuilder = this.brandRepository
				.createQueryBuilder('brand')
				.select(['brand.id', 'brand.name', 'brand.description', 'brand.createdAt', 'brand.status', 'brand.logoUrl', 'brand.prefix', 'brand.code','brand.websiteUrl'])
				.loadRelationCountAndMap('brand.totalProducts', 'brand.products');

			if (query.filter?.trim()) {
				const searchTerms = query.filter
					.trim()
					.split(/\s+/)
					.slice(0, 5)
					.map((t) => t.toLowerCase());

				const columns = ['brand.name', 'brand.description'];

				searchTerms.forEach((term, idx) => {
					const conditions = columns.map((c) => `${c} ILIKE :term${idx}`).join(' OR ');
					const params = { [`term${idx}`]: `%${term}%` };

					idx === 0 ? queryBuilder.where(`(${conditions})`, params) : queryBuilder.andWhere(`(${conditions})`, params);
				});
			}

			if (query.status && query.status !== 'Todos') {
				const statusBool = query.status === 'Activos';

				queryBuilder.andWhere('brand.status = :status', {
					status: statusBool,
				});
			}

			if (query.countries && query.countries !== 'Todos') {
				const countries = query.countries
					.split(',')
					.map(country => country.trim())
					.filter(Boolean);
				if (countries.length > 0) {
					queryBuilder.andWhere(
						`brand.country->>'code' IN (:...countries)`,
						{ countries }
					);
				}
			}

			if (query.sort?.trim()) {
				const [field, direction] = query.sort.split(':');

				if (!field || !direction) {
					queryBuilder.orderBy('brand.createdAt', 'DESC');
				} else {
					const allowedFields = ['name', 'description'];
					const allowedDirections = ['asc', 'desc'];

					if (allowedFields.includes(field) && allowedDirections.includes(direction?.toLowerCase())) {
						const fieldMap = {
							name: 'brand.name',
							description: 'brand.description',
						};

						queryBuilder.orderBy(fieldMap[field], direction.toUpperCase() as 'ASC' | 'DESC');
					} else {
						queryBuilder.orderBy('brand.createdAt', 'DESC');
					}
				}
			} else {
				queryBuilder.orderBy('brand.createdAt', 'DESC');
			}

			let [brands, totalBrands] = await queryBuilder
			.skip(pagination.skip)
			.take(pagination.limit)
			.getManyAndCount();

			const brandIds = brands.map((c) => c.id);
			const rawProducts = await this.productRepository
				.createQueryBuilder('product')
				.select(['product.id', 'product.name', 'product.cover', 'product.brandId'])
				.addSelect(`ROW_NUMBER() OVER(PARTITION BY product.brandId ORDER BY product.createdAt DESC) as rn`)
				.where('product.brandId IN (:...ids)', { ids: brandIds })
				.getRawMany(); 

			const brandsWithProducts = brands.map((brand: any) => {
				const products = rawProducts
					.filter(p => p.product_brandId === brand.id && parseInt(p.rn) <= 3)
					.map(p => ({
						id: p.product_id,
						name: p.product_name,
						cover: p.product_cover
					}));
				return {
					...brand,
					productsPreview: products,
					moreProducts: Math.max(0, brand.totalProducts - products.length),
				};
			});

			return {
				brands: brandsWithProducts,
				meta: {
					total: totalBrands,
					currentPage: pagination.page,
					limit: pagination.limit,
					totalPages: Math.ceil(totalBrands / pagination.limit),
				},
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_status_brand(id: string, status: boolean, request: any) {
		try {
			const exists = await this.brandRepository.exists({ where: { id } });

			if (!exists) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const result = await this.brandRepository
				.createQueryBuilder()
				.update(Brand)
				.set({
					status: !status,
					statusAt: () => 'CURRENT_TIMESTAMP',
				})
				.where('id = :id', { id })
				.returning(['id', 'status', 'name'])
				.execute();

			if (!result.affected) {
				throw new InternalServerErrorException('No se pudo actualizar el registro.');
			}

			if (!result.raw?.length) {
				throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			}

			const updatedBrand = result.raw[0];

			this.kibanaService.audit({
				action: 'update_status_brand',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify({ status }),
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

	async get_brand(id: string) {
		try {
			let brand: any = await this.brandRepository
				.createQueryBuilder('brand')
				.select([
					'brand.id',
					'brand.name',
					'brand.logoUrl',
					'brand.bannerUrl',
					'brand.prefix',
					'brand.country',
					'brand.websiteUrl',
					'brand.description',
					'brand.createdAt',
					'brand.updatedAt',
					'brand.statusAt',
				])
				.where('brand.id = :id', { id })
				.getOne();

			if (!brand) {
				throw new NotFoundException('No se encontró el registro.');
			}

			return {
				data: brand,
				message: 'Registro obtenido correctamente.',
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_brand(id: string, editBrandDto: EditBrandDto, request: any) {
		try {
			const exists = await this.brandRepository.exists({
				where: { id },
			});

			if (!exists) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const updateData = {
				...editBrandDto,
				updatedAt: () => 'CURRENT_TIMESTAMP',
			};

			let result;

			result = await this.brandRepository
				.createQueryBuilder()
				.update(Brand)
				.set(updateData)
				.where('id = :id', { id })
				.returning(['id', 'status', 'name', 'prefix', 'description', 'country', 'websiteUrl', 'logoUrl', 'bannerUrl', 'createdAt', 'updatedAt', 'statusAt'])
				.execute();

			if (!result.affected) {
				throw new InternalServerErrorException('No se pudo actualizar el registro.');
			}

			if (!result.raw?.length) {
				throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			}

			this.kibanaService.audit({
				action: 'update_brand',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify(editBrandDto),
				response: JSON.stringify(result.raw[0]),
				requestId: request.requestId,
			});

			return {
				message: 'Registro actualizado correctamente.',
				data: result.raw[0],
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_status_brands(updateStatusBrandsDto: UpdateStatusBrandsDto, request: any) {
		try {
			const ids = [...new Set(updateStatusBrandsDto.ids)];

			if (!ids.length) {
				throw new BadRequestException('Debe seleccionar al menos un registro.');
			}

			const result = await this.brandRepository
				.createQueryBuilder()
				.update(Brand)
				.set({
					status: updateStatusBrandsDto.status,
					statusAt: () => 'CURRENT_TIMESTAMP',
				})
				.where('id IN (:...ids)', { ids })
				.returning(['id'])
				.execute();

			if (!result.affected) {
				throw new NotFoundException('No se encontraron registros para actualizar.');
			}

			if (!result.raw?.length) {
				throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			}

			const updatedIds: string[] = result.raw.map((item: { id: string }) => item.id);

			this.kibanaService.audit({
				action: 'update_status_brands',
				performedBy: request.user.id,
				targetId: updatedIds,
				requestBody: JSON.stringify({
					status: updateStatusBrandsDto.status,
				}),
				response: JSON.stringify({
					updatedIds,
					total: updatedIds.length,
				}),
				requestId: request.requestId,
			});

			return {
				message: 'Registros actualizados correctamente.',
				data: updatedIds,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_product_by_brand(
		brandId: string, 
		query: { filter: string; page: number; limit: number; status: string; sort: string; subcategoryIds?: string  }
	) {
		try {
			
			const pagination = getPagination(query.page, query.limit);

			const exists = await this.brandRepository.exists({ where: { id: brandId } });
			if (!exists) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const queryBuilder = this.productRepository
				.createQueryBuilder('product')
				.leftJoinAndSelect('product.category', 'category')
				.leftJoinAndSelect('product.subcategory', 'subcategory')
				.leftJoinAndSelect('product.brand', 'brand');

			queryBuilder.where('product.brandId = :brandId', {
				brandId,
			});

			if (query.subcategoryIds != 'Todos') {
				const subcategoryIds = query.subcategoryIds?.split(',').map(id => id.trim()).filter(Boolean);

				if (subcategoryIds?.length) {
					queryBuilder.andWhere(
						'product.subcategoryId IN (:...subcategoryIds)',
						{ subcategoryIds },
					);
				}
			}

			if (query.filter?.trim()) {
				const searchTerms = query.filter
					.trim()
					.split(/\s+/)
					.slice(0, 5)
					.map((t) => t.toLowerCase());

				const columns = ['product.name', 'product.description', 'product.extract', 'category.name', 'subcategory.name'];

				searchTerms.forEach((term, idx) => {
					const conditions = columns.map((c) => `${c} ILIKE :term${idx}`).join(' OR ');

					const params = {
						[`term${idx}`]: `%${term}%`,
					};

					idx === 0 ? queryBuilder.andWhere(`(${conditions})`, params) : queryBuilder.andWhere(`(${conditions})`, params);
				});
			}

			if ( query.status && query.status !== 'todos' && ['draft', 'published'].includes(query.status)) {
				queryBuilder.andWhere('product.status = :status', {
					status: query.status,
				});
			}

			console.log('query.sort',query.sort);

			if (query.sort?.trim() && query.sort !== 'Predeterminado') {
				const [field, direction] = query.sort.split(':');

				if (!field || !direction) {
					queryBuilder.orderBy('product.createdAt', 'DESC');
				} else {
					const allowedFields = ['name', 'description', 'priceRegular', 'priceDiscount', 'quality', 'stockQuantity', 'subcategoryId'];
					const allowedDirections = ['asc', 'desc'];

					if (allowedFields.includes(field) && allowedDirections.includes(direction.toLowerCase())) {
						const order = direction.toUpperCase() as 'ASC' | 'DESC';

						if (field === 'priceRegular') {
							// No hagas nada aquí
						} else {
							const fieldMap = {
								name: 'product.name',
								description: 'product.description',
								priceDiscount: 'product.priceDiscount',
								quality: 'product.quality',
								stockQuantity: 'product.stockQuantity',
								categoryId: 'category.name',
							};

							queryBuilder.orderBy(fieldMap[field], order);
						}
					} else {
						queryBuilder.orderBy('product.createdAt', 'DESC');
					}
				}
			} else {
				queryBuilder.orderBy('product.createdAt', 'DESC');
			}

			let [products, totalProducts] = await queryBuilder
				.select([
					'product.id',
					'product.name',
					'product.cover',
					'product.status',
					'product.createdAt',
					'product.priceRegular',
					'product.quality',
					'product.stockQuantity',
					'product.priceDiscount',
					'category.id',
					'category.name',
					'category.prefix',
					'category.code',
					'subcategory.id',
					'subcategory.name',
					'subcategory.prefix',
					'subcategory.code',
					'brand.name',
					'brand.logoUrl',
				])
				.skip(pagination.skip)
				.take(pagination.limit)
				.getManyAndCount();

			if (query.sort?.startsWith('priceRegular:')) {
				const [, direction] = query.sort.split(':');

				products.sort((a, b) => {
					const priceA =
						a.priceDiscount && Number(a.priceDiscount) > 0
							? Number(a.priceDiscount)
							: Number(a.priceRegular);

					const priceB =
						b.priceDiscount && Number(b.priceDiscount) > 0
							? Number(b.priceDiscount)
							: Number(b.priceRegular);

					return direction === 'asc'
						? priceA - priceB
						: priceB - priceA;
				});
			}

			products = products.map(product => ({
				...product,
				quality_label: getQualityLabel(product.quality),
			}));

			return {
				products,
				meta: {
					totalProducts,
					totalPages: Math.ceil(totalProducts / pagination.limit),
					currentPage: pagination.page,
				},
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_brand_logo_filename_by_id(id: string) {
		try {
			let brand: any = await this.brandRepository.createQueryBuilder('brand').select(['brand.id', 'brand.logoUrl']).where('brand.id = :id', { id }).getOne();
			
			return brand.logoUrl;
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_brand_banner_filename_by_id(id: string) {
		try {
			let brand: any = await this.brandRepository.createQueryBuilder('brand').select(['brand.id', 'brand.bannerUrl']).where('brand.id = :id', { id }).getOne();

			return brand.bannerUrl;
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_brands_by_select() {
		try {
			let brands = await this.brandRepository
				.createQueryBuilder('brand')
				.select(['brand.id', 'brand.name', 'brand.status', 'brand.logoUrl'])
				.where('brand.status = :status', { status: true })
				.orderBy('brand.name', 'ASC')
				.getMany();
			return brands;
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}
}
