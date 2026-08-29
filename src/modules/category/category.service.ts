import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from '@/entities/category.entity';
import { DataSource, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { EditCategoryDto } from './dto/edit-category.dto';
import { Subcategory } from '@/entities/subcategory.entity';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { EditSubcategoryDto } from './dto/edit-subcategory.dto';
import { UpdateStatusSubcategoriesDto } from './dto/update-status-subcategories.dto';
import { Product } from '@/entities/product.entity';
import { UpdateCatSubcatProductsDto } from './dto/update-catsubcat-products.dto';
import { MoveSubcategoryDto } from './dto/move-subcategory.dto';
import { KibanaService } from '@/common/services/kibana/kibana.service';
import { getPagination } from '@/common/utils/get-pagination.util';
import { CategoryValidator } from './validators/category.validator';
import { getQualityLabel } from './utils/calculate-total.util';
import { FindCategoryProductsBuilder } from './builders/find-category-products.builder';
import { FindCategoryProductsQueryDto } from './dto/find-category-products.dto';
import { FindCategoriesQueryDto } from './dto/find-categories.dto';
import { FindCategoriesBuilder } from './builders/find-categories.builder';
import { UpdateCategoryStatusDto } from './dto/update-category-status.dto';
import { UpdateStatusCategoriesDto } from './dto/update-status-categories.dto';
import { CreateCategoryRes, GetCategoriesRes, MoveSubcategoryRes, UpdateCategoriesStatusRes, UpdateCategoryStatusRes } from './interfaces/controller.interface';

interface ProductPreview {
	id: string;
	name: string;
	code: string;
	cover: string;
	categoryId: string;
}

@Injectable()
export class CategoryService {
	constructor(
		@InjectRepository(Category) private categoryRepository: Repository<Category>,
		@InjectRepository(Subcategory) private subcategoryRepository: Repository<Subcategory>,
		@InjectRepository(Product) private productRepository: Repository<Product>,
		private readonly dataSource: DataSource,
		private kibanaService: KibanaService,
		private categoryValidator: CategoryValidator
	) {}

	async createCategory(dto: CreateCategoryDto, request: any):Promise<CreateCategoryRes> {
		try {
			const result = await this.categoryRepository
				.createQueryBuilder()
				.insert()
				.into(Category)
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

			const id = result.raw[0]?.id;

			if (!id) {
				throw new InternalServerErrorException('No se pudo registrar la marca.');
			}

			this.kibanaService.audit({
				action: 'create_category',
				performedBy: request.user.id,
				targetId: '',
				requestBody: JSON.stringify(dto),
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

	async getCategories(query: FindCategoriesQueryDto): Promise<GetCategoriesRes> {
		try {
			const queryBuilder = this.categoryRepository
				.createQueryBuilder('category')
				.select([
					'category.id',
					'category.name',
					'category.description',
					'category.createdAt',
					'category.status',
					'category.prefix',
					'category.icon',
					'category.code',
					'category.isDimensions',
					'category.isCharacteristics',
					'category.isCondition',
					'category.isWarranty',
					'category.isCountryOfOrigin',
					'category.isMaterial',
					'category.isTemperature',
				])
				.loadRelationCountAndMap('category.totalProducts', 'category.products');

			FindCategoriesBuilder.applyFilters(queryBuilder, query);

			const totalCategories = await queryBuilder.getCount();

			const totalPages = Math.ceil(totalCategories / query.limit);

			const currentPage = totalPages === 0 ? 1 : Math.min(query.page, totalPages);

			const skip = (currentPage - 1) * query.limit;

			const categories = await queryBuilder.skip(skip).take(query.limit).getMany();

			const categoryIds = categories.map((category) => category.id);

			const products: ProductPreview[] =
				categoryIds.length > 0
					? await this.productRepository.query(
							`
						SELECT
							ranked.id,
							ranked.name,
							ranked.code,
							ranked.cover,
							ranked."categoryId"
						FROM (
							SELECT
								product.id,
								product.name,
								product.code,
								product.cover,
								product."categoryId",
								ROW_NUMBER() OVER (
									PARTITION BY product."categoryId"
									ORDER BY
										product."createdAt" DESC,
										product.id ASC
								) AS row_number
							FROM products product
							WHERE product."categoryId" =
								ANY($1::uuid[])
						) ranked
						WHERE ranked.row_number <= 4
						ORDER BY
							ranked."categoryId",
							ranked.row_number
						`,
							[categoryIds]
						)
					: [];

			const categoriesWithProducts = categories.map((category: any) => {
				const latestProducts = products.filter((product) => product.categoryId === category.id).slice(0, 4);

				return {
					...category,
					latestProducts,
					moreProducts: Math.max((category.totalProducts ?? 0) - latestProducts.length, 0),
				};
			});

			return {
				categories: categoriesWithProducts,
				meta: {
					totalCategories,
					totalPages,
					currentPage,
					limit: query.limit,
				},
				filters: {
					filter: query.filter,
					status: query.status,
					sort: query.sort,
					configurations: query.configurations,
				},
			};
		} catch (err: unknown) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async updateCategoryStatus(id: string, dto: UpdateCategoryStatusDto, request: any): Promise<UpdateCategoryStatusRes> {
		const result = await this.categoryRepository
			.createQueryBuilder()
			.update(Category)
			.set({
				status: dto.status,
				statusAt: () => 'CURRENT_TIMESTAMP',
			})
			.where('id = :id', { id })
			.andWhere('status IS DISTINCT FROM :status', { status: dto.status })
			.returning(['id', 'status', 'name'])
			.execute();

		if (!result.affected) {
			const categoryExists = await this.categoryRepository.exists({
				where: { id },
			});

			if (!categoryExists) {
				throw new NotFoundException('No se encontró la categoría.');
			}

			throw new BadRequestException(dto.status ? 'La categoría ya se encuentra activa.' : 'La categoría ya se encuentra inactiva.');
		}

		const updatedCategory = result.raw[0];

		this.kibanaService.audit({
			action: 'updateCategoryStatus',
			performedBy: request.user.id,
			targetId: id,
			requestBody: JSON.stringify(dto),
			response: JSON.stringify(updatedCategory),
			requestId: request.requestId,
		});

		return {
			message: 'Registro actualizado correctamente.',
			data: updatedCategory,
		};
	}

	async updateCategoriesStatus(dto: UpdateStatusCategoriesDto, request: any): Promise<UpdateCategoriesStatusRes> {
		const ids = [...new Set(dto.ids)];

		const result = await this.categoryRepository
			.createQueryBuilder()
			.update(Category)
			.set({
				status: dto.status,
				statusAt: () => 'CURRENT_TIMESTAMP',
			})
			.where('id IN (:...ids)', { ids })
			.andWhere('status IS DISTINCT FROM :status', { status: dto.status })
			.returning(['id'])
			.execute();

		if (!result.affected) {
			const existingCategories = await this.categoryRepository.count({
				where: {
					id: In(ids),
				},
			});

			if (existingCategories === 0) {
				throw new NotFoundException('No se encontraron categorías.');
			}

			throw new BadRequestException(dto.status ? 'Las categorías seleccionadas ya se encuentran activas.' : 'Las categorías seleccionadas ya se encuentran inactivas.');
		}

		const updatedIds: string[] = result.raw.map((item: { id: string }) => item.id);

		this.kibanaService.audit({
			action: 'updateCategoriesStatus',
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

	async get_category(id: string) {
		try {
			const category = await this.categoryRepository
				.createQueryBuilder('category')
				.select([
					'category.id',
					'category.name',
					'category.icon',
					'category.prefix',
					'category.code',
					'category.description',
					'category.isDimensions',
					'category.isCharacteristics',
					'category.isCondition',
					'category.isWarranty',
					'category.isCountryOfOrigin',
					'category.isMaterial',
					'category.isTemperature',
					'category.createdAt',
					'category.updatedAt',
					'category.statusAt',
				])
				.where('category.id = :id', { id })
				.getOne();

			if (!category) {
				throw new NotFoundException('No se encontró el registro.');
			}

			return {
				data: category,
				message: 'Registro obtenido correctamente.',
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_category(id: string, editCategoryDto: EditCategoryDto, request: any) {
		const exists = await this.categoryRepository.exists({
			where: { id },
		});

		if (!exists) {
			throw new NotFoundException('No se encontró el registro.');
		}

		const updateData = {
			...editCategoryDto,
			updatedAt: () => 'CURRENT_TIMESTAMP',
		};

		let result;
		try {
			result = await this.categoryRepository
				.createQueryBuilder()
				.update(Category)
				.set(updateData)
				.where('id = :id', { id })
				.returning([
					'id',
					'name',
					'icon',
					'prefix',
					'code',
					'description',
					'isDimensions',
					'isCharacteristics',
					'isCondition',
					'isWarranty',
					'isCountryOfOrigin',
					'isMaterial',
					'isTemperature',
					'createdAt',
					'updatedAt',
					'statusAt',
				])
				.execute();

			this.kibanaService.audit({
				action: 'update_category',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify(editCategoryDto),
				response: JSON.stringify(result.raw[0]),
				requestId: request.requestId,
			});
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}

		return {
			message: 'Registro actualizado correctamente.',
			data: result.raw[0],
		};
	}

	async create_subcategory(createSubcategory: CreateSubcategoryDto, request: any) {
		try {
			const exist = await this.categoryValidator.existsIdCategory(createSubcategory.categoryId!);

			if (!exist) {
				throw new NotFoundException('La categoría seleccionada no existe.');
			}

			const result = await this.subcategoryRepository
				.createQueryBuilder()
				.insert()
				.into(Subcategory)
				.values({
					...createSubcategory,
					slug: slugify(createSubcategory.name, {
						lower: true,
						strict: true,
						trim: true,
					}),
				})
				.returning('*')
				.execute();

			const saveData = result.raw[0];

			if (!saveData) {
				throw new InternalServerErrorException('No se pudo registrar la marca.');
			}

			this.kibanaService.audit({
				action: 'create_subcategory',
				performedBy: request.user.id,
				targetId: '',
				requestBody: JSON.stringify(createSubcategory),
				response: JSON.stringify(saveData),
				requestId: request.requestId,
			});

			return {
				message: 'Registro creado correctamente.',
				data: saveData,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_subcategories(id: string) {
		try {
			const category = await this.categoryRepository.exist({
				where: { id },
			});

			if (!category) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const subcategories = await this.subcategoryRepository
				.createQueryBuilder('subcategory')
				.where('subcategory.categoryId = :id', { id })
				.orderBy('subcategory.name', 'ASC')
				.getMany();

			return {
				data: subcategories,
				message: 'Registros obtenido correctamente.',
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_status_subcategory(id: string, status: boolean, request: any) {
		try {
			const exists = await this.subcategoryRepository.exists({ where: { id } });

			if (!exists) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const result = await this.subcategoryRepository
				.createQueryBuilder()
				.update(Subcategory)
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

			const updatedSubcategory = result.raw[0];

			this.kibanaService.audit({
				action: 'update_status_subcategory',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify({ status }),
				response: JSON.stringify(updatedSubcategory),
				requestId: request.requestId,
			});

			return {
				message: 'Registro actualizado correctamente.',
				data: updatedSubcategory,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_subcategory(id: string, editSubcategoryDto: EditSubcategoryDto, request: any) {
		try {
			const exists = await this.subcategoryRepository.exists({
				where: { id },
			});

			if (!exists) {
				throw new NotFoundException('No se encontró la categoría asignada.');
			}

			editSubcategoryDto.updatedAt = new Date();
			let result;

			result = await this.subcategoryRepository.createQueryBuilder().update(Subcategory).set(editSubcategoryDto).where('id = :id', { id }).returning('*').execute();

			if (!result.affected) {
				throw new InternalServerErrorException('No se pudo actualizar el registro.');
			}

			if (!result.raw?.length) {
				throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			}

			this.kibanaService.audit({
				action: 'update_subcategory',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify(editSubcategoryDto),
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

	async update_status_subcategories(updateStatusSubcategoriesDto: UpdateStatusSubcategoriesDto, request: any) {
		try {
			const ids = [...new Set(updateStatusSubcategoriesDto.ids)];

			if (!ids.length) {
				throw new BadRequestException('Debe seleccionar al menos un registro.');
			}

			const result = await this.subcategoryRepository
				.createQueryBuilder()
				.update(Subcategory)
				.set({
					status: updateStatusSubcategoriesDto.status,
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
				action: 'update_status_subcategories',
				performedBy: request.user.id,
				targetId: updateStatusSubcategoriesDto.ids,
				requestBody: JSON.stringify({
					status: updateStatusSubcategoriesDto.status,
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

	async findCategoryProducts(categoryId: string, query: FindCategoryProductsQueryDto) {
		try {
			const skip = (query.page - 1) * query.limit;

			if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) {
				throw new BadRequestException({
					code: 'INVALID_QUERY_PARAMS',
					message: 'Los parámetros de la URL no son válidos.',
				});
			}

			const exists = await this.categoryRepository.exists({ where: { id: categoryId } });
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
				.where('product.categoryId = :categoryId', {
					categoryId,
				});

			FindCategoryProductsBuilder.applyFilters(queryBuilder, query);

			let [products, totalProducts] = await queryBuilder.skip(skip).take(query.limit).getManyAndCount();

			products = products.map((product) => ({
				...product,
				quality_label: getQualityLabel(product.quality),
			}));

			return {
				products,
				meta: {
					totalProducts,
					totalPages: Math.ceil(totalProducts / query.limit),
					currentPage: query.page,
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

	async get_categories_with_subcategories() {
		try {
			const categories = await this.categoryRepository
				.createQueryBuilder('category')
				.leftJoinAndSelect('category.subcategories', 'subcategory')
				.loadRelationCountAndMap('category.totalProducts', 'category.products')
				.loadRelationCountAndMap('subcategory.totalProducts', 'subcategory.products')
				.select(['category.id', 'category.name', 'category.icon', 'subcategory.id', 'subcategory.name', 'subcategory.icon', 'subcategory.categoryId'])
				.orderBy('category.name', 'ASC')
				.addOrderBy('subcategory.name', 'ASC')
				.getMany();

			return {
				categories: categories,
				message: 'Registro obtenido correctamente.',
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_categories_by_select() {
		try {
			const categories = await this.categoryRepository
				.createQueryBuilder('category')
				.select([
					'category.id',
					'category.name',
					'category.icon',
					'category.prefix',
					'category.status',
					'category.isDimensions',
					'category.isCharacteristics',
					'category.isCondition',
					'category.isWarranty',
					'category.isCountryOfOrigin',
					'category.isMaterial',
					'category.isTemperature',
				])
				.orderBy('category.name', 'ASC')
				.getMany();
			return {
				data: categories,
				message: 'Registro obtenido correctamente.',
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_subcategories_by_select(id: string) {
		try {
			const exists = await this.categoryRepository.exists({
				where: { id },
			});

			if (!exists) {
				throw new NotFoundException('No se encontró la categoría asignada.');
			}

			const subcategories = await this.subcategoryRepository
				.createQueryBuilder('subcategory')
				.loadRelationCountAndMap('subcategory.totalProducts', 'subcategory.products')
				.select(['subcategory.id', 'subcategory.name', 'subcategory.icon', 'subcategory.status', 'subcategory.prefix', 'subcategory.code'])
				.andWhere('subcategory.categoryId = :id', {
					id,
				})
				.orderBy('subcategory.name', 'ASC')
				.getMany();
			return {
				data: subcategories,
				message: 'Registro obtenido correctamente.',
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_subcat_by_select() {
		try {
			const categories = await this.categoryRepository
				.createQueryBuilder('category')
				.leftJoinAndSelect('category.subcategories', 'subcategory')
				.select(['category.id', 'category.name', 'category.status', 'category.prefix', 'subcategory.id', 'subcategory.name', 'subcategory.status', 'subcategory.prefix'])
				.orderBy('category.name', 'ASC')
				.addOrderBy('subcategory.name', 'ASC')
				.getMany();

			return {
				data: categories.map((category) => ({
					...category,
					subcategories: category.subcategories.map((subcategory) => ({
						...subcategory,
						checked: false,
					})),
				})),
				message: 'Registro obtenido correctamente.',
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_catsubcat_products(updateCatSubcatProductsDto: UpdateCatSubcatProductsDto, request: any) {
		try {
			const [categoryExists, subcategoryExists] = await Promise.all([
				this.categoryRepository.exists({
					where: {
						id: updateCatSubcatProductsDto.categoryId,
					},
				}),
				this.subcategoryRepository.exists({
					where: {
						id: updateCatSubcatProductsDto.subcategoryId,
					},
				}),
			]);

			if (!categoryExists) {
				throw new NotFoundException('La categoría seleccionada no existe.');
			}

			if (!subcategoryExists) {
				throw new NotFoundException('La subcategoría seleccionada no existe.');
			}

			if (!updateCatSubcatProductsDto.products?.length) {
				throw new BadRequestException('Debe seleccionar al menos un producto.');
			}

			const { affected } = await this.productRepository
				.createQueryBuilder()
				.update(Product)
				.set({
					categoryId: updateCatSubcatProductsDto.categoryId,
					subcategoryId: updateCatSubcatProductsDto.subcategoryId,
					status: 'draft',
				})
				.where('id IN (:...productIds)', {
					productIds: updateCatSubcatProductsDto.products,
				})
				.execute();

			await this.kibanaService.audit({
				action: 'update_catsubcat_products',
				performedBy: request.user.id,
				targetId: updateCatSubcatProductsDto.categoryId,
				requestBody: JSON.stringify(updateCatSubcatProductsDto),
				response: JSON.stringify({ affected }),
				requestId: request.requestId,
			});

			return {
				message: 'Productos actualizados correctamente.',
				data: affected,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async moveSubcategory(subcategoryId: string, dto: MoveSubcategoryDto, request: any): Promise<MoveSubcategoryRes> {
		const queryRunner = this.dataSource.createQueryRunner();

		let movedSubcategory: Pick<Subcategory, 'id' | 'name' | 'categoryId'> | undefined;

		let affectedProducts = 0;

		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();

			const categoryExists = await queryRunner.manager.exists(Category, {
				where: {
					id: dto.categoryId,
				},
			});

			if (!categoryExists) {
				throw new NotFoundException('La categoría seleccionada no existe.');
			}

			const subcategory = await queryRunner.manager.findOne(Subcategory, {
				where: {
					id: subcategoryId,
				},
				select: {
					id: true,
					name: true,
					categoryId: true,
				},
				lock: {
					mode: 'pessimistic_write',
				},
			});

			if (!subcategory) {
				throw new NotFoundException('La subcategoría seleccionada no existe.');
			}

			if (subcategory.categoryId === dto.categoryId) {
				throw new BadRequestException('La subcategoría ya pertenece a la categoría seleccionada.');
			}

			const subcategoryResult = await queryRunner.manager
				.createQueryBuilder()
				.update(Subcategory)
				.set({
					categoryId: dto.categoryId,
				})
				.where('id = :subcategoryId', {
					subcategoryId,
				})
				.returning(['id', 'name', 'categoryId'])
				.execute();

			if (subcategoryResult.affected !== 1 || !subcategoryResult.raw[0]) {
				throw new InternalServerErrorException('No se pudo mover la subcategoría.');
			}

			const productResult = await queryRunner.manager
				.createQueryBuilder()
				.update(Product)
				.set({
					categoryId: dto.categoryId,
				})
				.where('subcategoryId = :subcategoryId', {
					subcategoryId,
				})
				.execute();

			movedSubcategory = subcategoryResult.raw[0];

			affectedProducts = productResult.affected ?? 0;

			await queryRunner.commitTransaction();
		} catch (error: unknown) {
			if (queryRunner.isTransactionActive) {
				await queryRunner.rollbackTransaction();
			}

			if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof InternalServerErrorException) {
				throw error;
			}

			throw new InternalServerErrorException('Ocurrió un problema en el servidor.');
		} finally {
			if (!queryRunner.isReleased) {
				await queryRunner.release();
			}
		}

		if (!movedSubcategory) {
			throw new InternalServerErrorException('No se pudo recuperar la subcategoría actualizada.');
		}

		try {
			this.kibanaService.audit({
				action: 'move_subcategory',
				performedBy: request.user.id,
				targetId: subcategoryId,
				requestBody: JSON.stringify(dto),
				response: JSON.stringify({
					subcategoryId,
					categoryId: dto.categoryId,
					affectedProducts,
				}),
				requestId: request.requestId,
			});
		} catch (error: unknown) {
			console.error('No se pudo registrar la auditoría.', error);
		}

		return {
			message: 'La subcategoría fue movida correctamente.',
			data: {
				...movedSubcategory,
				affectedProducts,
			},
		};
	}
}
