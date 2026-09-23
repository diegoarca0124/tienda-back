import { Brand } from '@/entities/brand.entity';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateBrandDto } from './dto/create-brand.dto';
import slugify from 'slugify';
import { EditBrandDto } from './dto/edit-brand-dto';
import { UpdateBrandsStatusDto } from './dto/update-brands-status.dto';
import { Product } from '@/entities/product.entity';
import { KibanaService } from '@/common/services/kibana/kibana.service';
import { getPagination } from '@/common/utils/get-pagination.util';
import { getQualityLabel } from './utils/calculate-total.util';
import type { CreateBrandRes, FilesCreateBrand, FilesUpdateBrand, GetBrandRes, GetBrandsRes, UpdateBrandRes, UpdateBrandsStatusRes, UpdateBrandStatusRes } from './interfaces/controller.interface';
import { FindBrandsQueryDto } from './dto/find-brands.dto';
import { FindBrandsBuilder } from './builders/find-brands.builder';
import { awsProcessImage } from '@/common/utils/aws-process-image.util';
import { deleteImageVariants } from '@/common/utils/delete-image-variants.util';
import { UpdateBrandStatusDto } from './dto/update-brand-status.dto';
import { FindBrandProductsQueryDto } from './dto/find-brand-products.dto';
import { FindCategoryProductsBuilder } from '../category/builders/find-category-products.builder';

interface ProductPreview {
	id: string;
	name: string;
	code: string;
	cover: string;
	brandId: string;
}

@Injectable()
export class BrandService {
	private readonly logger = new Logger(BrandService.name);

	constructor(
		@InjectRepository(Brand) private brandRepository: Repository<Brand>,
		@InjectRepository(Product) private productRepository: Repository<Product>,
		private kibanaService: KibanaService
	) {}

	async createBrand(dto: CreateBrandDto, files: FilesCreateBrand, request: any): Promise<CreateBrandRes> {
		const newImages: string[] = [];
		let id: string;

		try {
			const logoFile = files?.logoUrl?.[0];
			const bannerFile = files?.bannerUrl?.[0];

			if (logoFile) {
				dto.logoUrl = await awsProcessImage(logoFile, 'brands');
				newImages.push(dto.logoUrl);
			}

			if (bannerFile) {
				dto.bannerUrl = await awsProcessImage(bannerFile, 'brands');
				newImages.push(dto.bannerUrl);
			}

			const result = await this.brandRepository
				.createQueryBuilder()
				.insert()
				.into(Brand)
				.values({
					...dto,
					slug: slugify(dto.name, {
						lower: true,
						strict: true,
						trim: true,
					}),
				})
				.returning(['id'])
				.execute();

			id = result.raw[0]?.id;

			if (!id) {
				throw new InternalServerErrorException('No se pudo registrar la marca.');
			}

		} catch (error) {
			await Promise.allSettled(newImages.map((filename) => deleteImageVariants('brands', filename)));
			throw error;
		}

		this.kibanaService.audit({
			action: 'createBrand',
			performedBy: request.user.id,
			targetId: id,
			requestBody: JSON.stringify(dto),
			response: JSON.stringify({ id }),
			requestId: request.requestId,
		});

		return {
			message: 'Registro creado correctamente.',
			data: id,
		};
	}

	async getBrands(query: FindBrandsQueryDto): Promise<GetBrandsRes> {
		try {
			const queryBuilder = this.brandRepository
				.createQueryBuilder('brand')
				.select([
					'brand.id',
					'brand.name',
					'brand.slug',
					'brand.createdAt',
					'brand.status',
					'brand.prefix',
					'brand.code',
					'brand.websiteUrl',
					'brand.logoUrl',
					'brand.prefix',
				])
				.loadRelationCountAndMap('brand.totalProducts', 'brand.products');

			FindBrandsBuilder.applyFilters(queryBuilder, query);
			const totalBrands = await queryBuilder.getCount();
			const totalPages = Math.ceil(totalBrands / query.limit);
			const currentPage = totalPages === 0 ? 1 : Math.min(query.page, totalPages);
			const skip = (currentPage - 1) * query.limit;

			const brands = await queryBuilder.skip(skip).take(query.limit).getMany();
			const brandsIds = brands.map((brand) => brand.id);
			const products: ProductPreview[] =
				brandsIds.length > 0
					? await this.productRepository.query(
							`
						SELECT
							ranked.id,
							ranked.name,
							ranked.code,
							ranked.cover,
							ranked."brandId"
						FROM (
							SELECT
								product.id,
								product.name,
								product.code,
								product.cover,
								product."brandId",
								ROW_NUMBER() OVER (
									PARTITION BY product."brandId"
									ORDER BY
										product."createdAt" DESC,
										product.id ASC
								) AS row_number
							FROM products product
							WHERE product."brandId" =
								ANY($1::uuid[])
						) ranked
						WHERE ranked.row_number <= 4
						ORDER BY
							ranked."brandId",
							ranked.row_number
						`,
							[brandsIds]
						)
					: [];

			const brandsWithProducts = brands.map((brand: any) => {
				const latestProducts = products.filter((product) => product.brandId === brand.id).slice(0, 4);

				return {
					...brand,
					latestProducts,
					moreProducts: Math.max((brand.totalProducts ?? 0) - latestProducts.length, 0),
				};
			});

			return {
				brands: brandsWithProducts,
				meta: {
					totalBrands,
					totalPages,
					currentPage,
					limit: query.limit,
				},
				filters: {
					filter: query.filter,
					status: query.status,
					sort: query.sort,
					countries: query.countries,
				},
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async updateBrandStatus(id: string, dto: UpdateBrandStatusDto, request: any):Promise<UpdateBrandStatusRes> {
		const result = await this.brandRepository
			.createQueryBuilder()
			.update(Brand)
			.set({
				status: dto.status,
				statusAt: () => 'CURRENT_TIMESTAMP',
			})
			.where('id = :id', { id })
			.andWhere('status IS DISTINCT FROM :status', { status: dto.status })
			.returning(['id', 'status', 'name'])
			.execute();

		if (!result.affected) {
			const brandExists = await this.brandRepository.exists({
				where: { id },
			});

			if (!brandExists) {
				throw new NotFoundException('No se encontró la marca.');
			}

			throw new BadRequestException(dto.status ? 'La marca ya se encuentra activa.' : 'La marca ya se encuentra inactiva.');
		}

		const updatedBrand = result.raw[0];

		this.kibanaService.audit({
			action: 'updateBrandStatus',
			performedBy: request.user.id,
			targetId: id,
			requestBody: JSON.stringify(dto),
			response: JSON.stringify(updatedBrand),
			requestId: request.requestId,
		});

		return {
			message: 'Registro actualizado correctamente.',
			data: updatedBrand,
		};
	}

	async getBrand(id: string): Promise<GetBrandRes> {
		try {
			let brand: any = await this.brandRepository
				.createQueryBuilder('brand')
				.select([
					'brand.id',
					'brand.name',
					'brand.logoUrl',
					'brand.bannerUrl',
					'brand.prefix',
					'brand.code',
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

	async updateBrand(id: string, dto: EditBrandDto, files: FilesUpdateBrand, request: any): Promise<UpdateBrandRes> {
		const currentBrand = await this.brandRepository.findOne({
			select: {
				id: true,
				logoUrl: true,
				bannerUrl: true,
			},
			where: { id },
		});

		if (!currentBrand) {
			throw new NotFoundException('No se encontró el registro.');
		}

		const logoFile = files?.logoUrl?.[0];
		const bannerFile = files?.bannerUrl?.[0];
		const newImages: string[] = [];
		const updateData = { ...dto };


		let result;

		try {
			if (logoFile) {
				dto.logoUrl = await awsProcessImage(logoFile, 'brands');
				newImages.push(dto.logoUrl);
			}

			if (bannerFile) {
				dto.bannerUrl = await awsProcessImage(bannerFile, 'brands');
				newImages.push(dto.bannerUrl);
			}

			console.log('dto',dto);
			

			result = await this.brandRepository
				.createQueryBuilder()
				.update(Brand)
				.set({
					...updateData,
					updatedAt: () => 'CURRENT_TIMESTAMP',
				})
				.where('id = :id', { id })
				.returning(['id', 'status', 'name', 'prefix', 'description', 'country', 'websiteUrl', 'logoUrl', 'bannerUrl', 'createdAt', 'updatedAt', 'statusAt'])
				.execute();

			if (!result.affected) {
				throw new InternalServerErrorException('No se pudo actualizar el registro.');
			}

			if (!result.raw?.length) {
				throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			}
		} catch (error) {
			await Promise.allSettled(newImages.map((filename) => deleteImageVariants('brands', filename)));
			throw error;
		}

		this.kibanaService.audit({
			action: 'update_brand',
			performedBy: request.user.id,
			targetId: id,
			requestBody: JSON.stringify(dto),
			response: JSON.stringify(result.raw[0]),
			requestId: request.requestId,
		});

		const deletionResults = await Promise.allSettled([
			logoFile && currentBrand.logoUrl ? deleteImageVariants('brands', currentBrand.logoUrl) : Promise.resolve(),
			bannerFile && currentBrand.bannerUrl ? deleteImageVariants('brands', currentBrand.bannerUrl) : Promise.resolve(),
		]);

		deletionResults.forEach((deletionResult, index) => {
			if (deletionResult.status === 'rejected') {
				const imageType = index === 0 ? 'logo' : 'banner';
				this.logger.error(`No fue posible eliminar el ${imageType} anterior de la marca ${id}.`, deletionResult.reason);
			}
		});

		return {
			message: 'Registro actualizado correctamente.',
			data: result.raw[0],
		};
	}

	async updateBrandsStatus(dto: UpdateBrandsStatusDto, request: any): Promise<UpdateBrandsStatusRes> {
		const ids = [...new Set(dto.ids)];
		
		const result = await this.brandRepository
			.createQueryBuilder()
			.update(Brand)
			.set({
				status: dto.status,
				statusAt: () => 'CURRENT_TIMESTAMP',
			})
			.where('id IN (:...ids)', { ids })
			.andWhere('status IS DISTINCT FROM :status', { status: dto.status })
			.returning(['id'])
			.execute();

		if (!result.affected) {
			const existingBrand = await this.brandRepository.count({
				where: {
					id: In(ids),
				},
			});

			if (existingBrand === 0) {
				throw new NotFoundException('No se encontraron marcas.');
			}

			throw new BadRequestException(dto.status ? 'Las marcas seleccionadas ya se encuentran activas.' : 'Las marcas seleccionadas ya se encuentran inactivas.');
		}

		const updatedIds: string[] = result.raw.map((item: { id: string }) => item.id);

		this.kibanaService.audit({
			action: 'updateBrandsStatus',
			performedBy: request.user.id,
			targetId: updatedIds,
			requestBody: JSON.stringify(dto),
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
	}

	async findBrandProducts(brandId: string, query: FindBrandProductsQueryDto) {
		try {
			if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) {
				throw new BadRequestException({
					code: 'INVALID_QUERY_PARAMS',
					message: 'Los parámetros de la URL no son válidos.',
				});
			}

			const exists = await this.brandRepository.exists({ where: { id: brandId } });
			if (!exists) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const queryBuilder = this.productRepository
				.createQueryBuilder('product')
				.leftJoinAndSelect('product.category', 'category')
				.leftJoinAndSelect('product.subcategory', 'subcategory')
				.leftJoinAndSelect('product.brand', 'brand')
				.select([
					'product.id',
					'product.name',
					'product.cover',
					'product.status',
					'product.visibility',
					'product.createdAt',
					'product.priceRegular',
					'product.quality',
					'product.stockQuantity',
					'product.priceDiscount',
					'category.id',
					'category.name',
					'subcategory.id',
					'subcategory.name',
					'subcategory.prefix',
					'subcategory.code',
					'brand.id',
					'brand.name',
					'brand.logoUrl',
				])
				.where('product.brandId = :brandId', {
					brandId,
				});

			FindCategoryProductsBuilder.applyFilters(queryBuilder, query);

			const totalProducts = await queryBuilder.clone().getCount();
			const totalPages = Math.ceil(totalProducts / query.limit);
			const currentPage = totalPages === 0 ? 1 : Math.min(query.page, totalPages);
			const skip = (currentPage - 1) * query.limit;
			let products = await queryBuilder.skip(skip).take(query.limit).getMany();

			products = products.map((product) => ({
				...product,
				quality_label: getQualityLabel(product.quality),
			}));

			return {
				products,
				meta: {
					totalProducts,
					totalPages,
					currentPage,
					limit: query.limit,
				},
				filters: {
					filter: query.filter,
					status: query.status,
					sort: query.sort,
					subcategoryIds: query.subcategoryIds?.join(',') ?? 'Todos',
					quality: query.quality,
					visibility: query.visibility,
					minPrice: query.minPrice,
					maxPrice: query.maxPrice,
				},
			};
		} catch (err) {
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
