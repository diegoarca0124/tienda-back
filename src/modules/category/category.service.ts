import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from '@/entities/category.entity';
import { Brand } from '@/entities/brand.entity';
import { DataSource, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { EditCategoryDto } from './dto/edit-category.dto';
import { Subcategory } from '@/entities/subcategory.entity';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { EditSubcategoryDto } from './dto/edit-subcategory.dto';
import { UpdateSubcategoriesStatusDto } from './dto/update-subcategories-status.dto';
import { Product } from '@/entities/product.entity';
import { UpdateCatSubcatProductsDto } from './dto/update-catsubcat-products.dto';
import { MoveSubcategoryDto } from './dto/move-subcategory.dto';
import { KibanaService } from '@/common/services/kibana/kibana.service';

import { escapeLikePattern } from '@/common/utils/escape-like-pattern.util';
import { CategoryValidator } from './validators/category.validator';
import { getQualityLabel } from './utils/calculate-total.util';
import { FindCategoryProductsBuilder } from './builders/find-category-products.builder';
import { FindCategoryProductsQueryDto } from './dto/find-category-products.dto';
import { FindCategoriesQueryDto } from './dto/find-categories.dto';
import { FindCategoriesBuilder } from './builders/find-categories.builder';
import { UpdateCategoryStatusDto } from './dto/update-category-status.dto';
import { UpdatCategoriesStatusDto } from './dto/update-categories-status.dto';
import {
	MovedSubcategory,
	CategoryProduct,
	CategoryRequest,
	GetSubcategoryRes,
	GetCategoriesSelectRes,
	GetCategorySubcategorySelectionRes,
	CreateCategoryRes,
	CreateSubcategoryRes,
	FindCategoryProductsRes,
	GetCategoriesRes,
	GetBrandsByCategoryRes,
	GetCategoriesWithSubcategoriesRes,
	GetCategoryRes,
	GetSubcategoriesByCategorySelect,
	GetSubcategoriesRes,
	MoveProductsToSubcategoryRes,
	MoveSubcategoryRes,
	UpdateCategoriesStatusRes,
	UpdateCategoryRes,
	UpdateCategoryStatusRes,
	UpdateSubcategoriesStatusRes,
	UpdateSubcategoryRes,
	UpdateSubcategoryStatusRes,
} from './interfaces/controller.interface';
import { UpdateSubcategoryStatusDto } from './dto/update-subcategory-status.dto';
import { rethrowCategoryUniqueViolation } from './utils/index-messages.util';

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
		@InjectRepository(Brand) private brandRepository: Repository<Brand>,
		private readonly dataSource: DataSource,
		private kibanaService: KibanaService,
		private categoryValidator: CategoryValidator
	) {}

	async createCategory(dto: CreateCategoryDto, request: CategoryRequest): Promise<CreateCategoryRes> {
		try {
			const result = await this.categoryRepository
				.createQueryBuilder()
				.insert()
				.into(Category)
				.values({
					...dto,
					status: true,
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
				throw new InternalServerErrorException('No se pudo registrar la categoría.');
			}

			this.kibanaService.audit({
				action: 'createCategory',
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
		} catch (err: unknown) {
			rethrowCategoryUniqueViolation(err);
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
					'category.color',
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

			const categoriesWithProducts = categories.map((category) => {
				const latestProducts = products.filter((product) => product.categoryId === category.id).slice(0, 4);

				return {
					...category,
					totalProducts: Number(Reflect.get(category, 'totalProducts') ?? 0),
					latestProducts,
					moreProducts: Math.max(Number(Reflect.get(category, 'totalProducts') ?? 0) - latestProducts.length, 0),
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

	async updateCategoryStatus(id: string, dto: UpdateCategoryStatusDto, request: CategoryRequest): Promise<UpdateCategoryStatusRes> {
		const { updatedCategory, affectedSubcategories, affectedProducts } = await this.dataSource.transaction(async (manager) => {
			const categoryResult = await manager
				.createQueryBuilder()
				.update(Category)
				.set({
					status: dto.status,
					statusAt: () => 'CURRENT_TIMESTAMP',
				})
				.where('id = :id', { id })
				.andWhere('status IS DISTINCT FROM :status', { status: dto.status })
				.returning(['id', 'status', 'name', 'statusAt'])
				.execute();

			let updatedCategory = categoryResult.raw[0];
			if (!categoryResult.affected) {
				const existingCategory = await manager.findOne(Category, { where: { id }, select: { id: true, name: true, status: true, statusAt: true } });
				if (!existingCategory) throw new NotFoundException('No se encontró la categoría.');
				if (existingCategory.status !== dto.status) throw new ConflictException('El estado cambió durante la operación. Intenta nuevamente.');
				updatedCategory = existingCategory;
			}
			if (!updatedCategory) throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');

			let affectedSubcategories = 0;
			let affectedProducts = 0;

			if (!dto.status) {
				const subcategoriesResult = await manager
					.createQueryBuilder()
					.update(Subcategory)
					.set({
						status: false,
						statusAt: () => 'CURRENT_TIMESTAMP',
					})
					.where('categoryId = :id', { id })
					.andWhere('status = :active', { active: true })
					.execute();

				const productsResult = await manager
					.createQueryBuilder()
					.update(Product)
					.set({
						status: 'draft',
						statusAt: () => 'CURRENT_TIMESTAMP',
					})
					.where('categoryId = :id', { id })
					.andWhere('status IS DISTINCT FROM :draftStatus', { draftStatus: 'draft' })
					.execute();

				affectedSubcategories = subcategoriesResult.affected ?? 0;
				affectedProducts = productsResult.affected ?? 0;
			}

			return {
				updatedCategory,
				affectedSubcategories,
				affectedProducts,
			};
		});

		this.kibanaService.audit({
			action: 'updateCategoryStatus',
			performedBy: request.user.id,
			targetId: id,
			requestBody: JSON.stringify(dto),
			response: JSON.stringify({
				...updatedCategory,
				affectedSubcategories,
				affectedProducts,
			}),
			requestId: request.requestId,
		});

		return {
			message: 'Registro actualizado correctamente.',
			data: updatedCategory,
		};
	}

	async updateCategoriesStatus(dto: UpdatCategoriesStatusDto, request: CategoryRequest): Promise<UpdateCategoriesStatusRes> {
		const ids = [...new Set(dto.ids)];

		const { updatedIds, affectedSubcategories, affectedProducts } = await this.dataSource.transaction(async (manager) => {
			const categoriesResult = await manager
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

			if (categoriesResult.affected && !categoriesResult.raw?.length) throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			const selectedCategories = await manager.find(Category, { where: { id: In(ids) }, select: { id: true, status: true } });
			if (!selectedCategories.length) throw new NotFoundException('No se encontraron categorías.');
			if (selectedCategories.some((category) => category.status !== dto.status)) throw new ConflictException('El estado cambió durante la operación. Intenta nuevamente.');
			const updatedIds = selectedCategories.map((category) => category.id);
			let affectedSubcategories = 0;
			let affectedProducts = 0;

			if (!dto.status) {
				const subcategoriesResult = await manager
					.createQueryBuilder()
					.update(Subcategory)
					.set({
						status: false,
						statusAt: () => 'CURRENT_TIMESTAMP',
					})
					.where('categoryId IN (:...ids)', { ids })
					.andWhere('status = :active', { active: true })
					.execute();

				const productsResult = await manager
					.createQueryBuilder()
					.update(Product)
					.set({
						status: 'draft',
						statusAt: () => 'CURRENT_TIMESTAMP',
					})
					.where('categoryId IN (:...ids)', { ids })
					.andWhere('status IS DISTINCT FROM :draftStatus', { draftStatus: 'draft' })
					.execute();

				affectedSubcategories = subcategoriesResult.affected ?? 0;
				affectedProducts = productsResult.affected ?? 0;
			}

			return {
				updatedIds,
				affectedSubcategories,
				affectedProducts,
			};
		});

		this.kibanaService.audit({
			action: 'updateCategoriesStatus',
			performedBy: request.user.id,
			targetId: updatedIds,
			requestBody: JSON.stringify(dto),
			response: JSON.stringify({
				updatedIds,
				total: updatedIds.length,
				affectedSubcategories,
				affectedProducts,
			}),
			requestId: request.requestId,
		});

		return {
			message: 'Registros actualizados correctamente.',
			data: updatedIds,
		};
	}

	async getCategory(id: string): Promise<GetCategoryRes> {
		try {
			const category = await this.categoryRepository
				.createQueryBuilder('category')
				.select([
					'category.id',
					'category.name',
					'category.icon',
					'category.prefix',
					'category.code',
					'category.color',
					'category.description',
					'category.status',
					'category.slug',
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
		} catch (err: unknown) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async updateCategory(id: string, dto: EditCategoryDto, request: CategoryRequest): Promise<UpdateCategoryRes> {
		const exists = await this.categoryRepository.exists({ where: { id } });

		if (!exists) {
			throw new NotFoundException('No se encontró el registro.');
		}

		const updateData = {
			...dto,
			slug: slugify(dto.name, {
				lower: true,
				strict: true,
				trim: true,
			}),
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
					'slug',
					'icon',
					'prefix',
					'code',
					'color',
					'description',
					'status',
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

			if (!result.affected || !result.raw?.length) {
				throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			}
			this.kibanaService.audit({
				action: 'updateCategory',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify(dto),
				response: JSON.stringify(result.raw[0]),
				requestId: request.requestId,
			});
		} catch (err: unknown) {
			rethrowCategoryUniqueViolation(err);
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}

		return {
			message: 'Registro actualizado correctamente.',
			data: result.raw[0],
		};
	}

	async createSubcategory(dto: CreateSubcategoryDto, request: CategoryRequest): Promise<CreateSubcategoryRes> {
		try {
			const exist = await this.categoryValidator.existsIdCategory(dto.categoryId);

			if (!exist) {
				throw new NotFoundException('La categoría seleccionada no existe.');
			}

			const result = await this.subcategoryRepository
				.createQueryBuilder()
				.insert()
				.into(Subcategory)
				.values({
					...dto,
					status: true,
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
				throw new InternalServerErrorException('No se pudo registrar la subcategoría.');
			}

			this.kibanaService.audit({
				action: 'createSubcategory',
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
		} catch (err: unknown) {
			rethrowCategoryUniqueViolation(err);
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async getSubcategory(id: string): Promise<GetSubcategoryRes> {
		const subcategory = await this.subcategoryRepository.findOne({ where: { id } });
		if (!subcategory) throw new NotFoundException('No se encontró la subcategoría.');
		return { data: subcategory, message: 'Registro obtenido correctamente.' };
	}

	async getSubcategories(id: string, filter: string = ''): Promise<GetSubcategoriesRes> {
		try {
			const category = await this.categoryRepository.exist({
				where: { id },
			});

			if (!category) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const queryBuilder = this.subcategoryRepository.createQueryBuilder('subcategory').where('subcategory.categoryId = :id', { id }).orderBy('subcategory.name', 'ASC');

			if (filter.trim()) {
				queryBuilder.andWhere("subcategory.name ILIKE :filter ESCAPE '\\'", {
					filter: `%${escapeLikePattern(filter.trim())}%`,
				});
			}

			const subcategories = await queryBuilder.getMany();

			return {
				data: subcategories,
				message: 'Registros obtenido correctamente.',
			};
		} catch (err: unknown) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async updateSubcategoryStatus(id: string, dto: UpdateSubcategoryStatusDto, request: CategoryRequest): Promise<UpdateSubcategoryStatusRes> {
		const { updatedSubcategory, affectedProducts } = await this.dataSource.transaction(async (manager) => {
			let categoryId: string | undefined;

			if (dto.status) {
				const subcategory = await manager.findOne(Subcategory, {
					where: { id },
					select: {
						id: true,
						categoryId: true,
					},
				});

				if (!subcategory) {
					throw new NotFoundException('No se encontró la subcategoría.');
				}

				const category = await manager.findOne(Category, {
					where: { id: subcategory.categoryId },
					select: {
						id: true,
						status: true,
					},
					lock: {
						mode: 'pessimistic_write',
					},
				});

				if (!category) {
					throw new NotFoundException('No se encontró la categoría de la subcategoría.');
				}

				if (!category.status) {
					throw new BadRequestException('No se puede activar la subcategoría porque su categoría está inactiva.');
				}

				categoryId = category.id;
			}

			const subcategoryQuery = manager
				.createQueryBuilder()
				.update(Subcategory)
				.set({
					status: dto.status,
					statusAt: () => 'CURRENT_TIMESTAMP',
				})
				.where('id = :id', { id })
				.andWhere('status IS DISTINCT FROM :status', { status: dto.status });

			if (categoryId) {
				subcategoryQuery.andWhere('categoryId = :categoryId', { categoryId });
			}

			const subcategoryResult = await subcategoryQuery.returning(['id', 'status', 'name', 'statusAt']).execute();

			let updatedSubcategory = subcategoryResult.raw[0];
			if (!subcategoryResult.affected) {
				const existingSubcategory = await manager.findOne(Subcategory, {
					where: { id },
					select: {
						id: true,
						categoryId: true,
						name: true,
						status: true,
						statusAt: true,
					},
				});

				if (!existingSubcategory) {
					throw new NotFoundException('No se encontró la subcategoría.');
				}

				if (categoryId && existingSubcategory.categoryId !== categoryId) {
					throw new BadRequestException('La categoría asignada cambió durante la operación. Inténtalo nuevamente.');
				}

				if (existingSubcategory.status !== dto.status) throw new ConflictException('El estado cambió durante la operación. Intenta nuevamente.');
				updatedSubcategory = { id: existingSubcategory.id, name: existingSubcategory.name, status: existingSubcategory.status, statusAt: existingSubcategory.statusAt };
			}
			if (!updatedSubcategory) throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');

			let affectedProducts = 0;

			if (!dto.status) {
				const productsResult = await manager
					.createQueryBuilder()
					.update(Product)
					.set({
						status: 'draft',
						statusAt: () => 'CURRENT_TIMESTAMP',
					})
					.where('subcategoryId = :id', { id })
					.andWhere('status IS DISTINCT FROM :draftStatus', { draftStatus: 'draft' })
					.execute();

				affectedProducts = productsResult.affected ?? 0;
			}

			return {
				updatedSubcategory,
				affectedProducts,
			};
		});

		this.kibanaService.audit({
			action: 'updateSubcategoryStatus',
			performedBy: request.user.id,
			targetId: id,
			requestBody: JSON.stringify({ status: dto.status }),
			response: JSON.stringify({
				...updatedSubcategory,
				affectedProducts,
			}),
			requestId: request.requestId,
		});

		return {
			message: 'Registro actualizado correctamente.',
			data: updatedSubcategory,
		};
	}

	async updateSubcategory(id: string, dto: EditSubcategoryDto, request: CategoryRequest): Promise<UpdateSubcategoryRes> {
		try {
			const exists = await this.subcategoryRepository.exists({ where: { id } });

			if (!exists) {
				throw new NotFoundException('No se encontr\u00f3 el registro.');
			}

			const updateData = {
				...dto,
				slug: slugify(dto.name, {
					lower: true,
					strict: true,
					trim: true,
				}),
				updatedAt: () => 'CURRENT_TIMESTAMP',
			};

			const result = await this.subcategoryRepository
				.createQueryBuilder()
				.update(Subcategory)
				.set(updateData)
				.where('id = :id', { id })
				.returning(['id', 'name', 'code', 'prefix', 'slug', 'icon', 'categoryId', 'status', 'createdAt', 'updatedAt', 'statusAt'])
				.execute();

			if (!result.affected) {
				throw new InternalServerErrorException('No se pudo actualizar el registro.');
			}

			if (!result.raw?.length) {
				throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			}

			this.kibanaService.audit({
				action: 'updateSubcategory',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify(dto),
				response: JSON.stringify(result.raw[0]),
				requestId: request.requestId,
			});

			return {
				message: 'Registro actualizado correctamente.',
				data: result.raw[0],
			};
		} catch (err: unknown) {
			rethrowCategoryUniqueViolation(err);
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async updateSubcategoriesStatus(dto: UpdateSubcategoriesStatusDto, request: CategoryRequest): Promise<UpdateSubcategoriesStatusRes> {
		const ids = [...new Set(dto.ids)];

		const { updatedIds, affectedProducts } = await this.dataSource.transaction(async (manager) => {
			if (dto.status) {
				const selectedSubcategories = await manager.find(Subcategory, {
					where: { id: In(ids) },
					select: { id: true, categoryId: true },
				});

				if (!selectedSubcategories.length) {
					throw new NotFoundException('No se encontraron subcategorías.');
				}

				const categoryIds = [...new Set(selectedSubcategories.map((subcategory) => subcategory.categoryId))];
				const activeCategories = await manager.find(Category, {
					where: { id: In(categoryIds), status: true },
					select: { id: true },
					order: { id: 'ASC' },
					lock: { mode: 'pessimistic_write' },
				});

				if (activeCategories.length !== categoryIds.length) {
					throw new BadRequestException('No se pueden activar subcategorías cuya categoría se encuentra inactiva.');
				}

				// Lock parents before children, as category deactivation and moves do.
				const lockedSubcategories = await manager.find(Subcategory, {
					where: { id: In(ids) },
					select: { id: true, categoryId: true },
					order: { id: 'ASC' },
					lock: { mode: 'pessimistic_write' },
				});
				const activeCategoryIds = new Set(activeCategories.map((category) => category.id));

				if (!lockedSubcategories.length) {
					throw new NotFoundException('No se encontraron subcategorías.');
				}

				if (lockedSubcategories.some((subcategory) => !activeCategoryIds.has(subcategory.categoryId))) {
					throw new BadRequestException('La categoría asignada cambió durante la operación. Inténtalo nuevamente.');
				}
			}

			const subcategoriesResult = await manager
				.createQueryBuilder()
				.update(Subcategory)
				.set({
					status: dto.status,
					statusAt: () => 'CURRENT_TIMESTAMP',
				})
				.where('id IN (:...ids)', { ids })
				.andWhere('status IS DISTINCT FROM :status', { status: dto.status })
				.returning(['id'])
				.execute();

			if (subcategoriesResult.affected && !subcategoriesResult.raw?.length) throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			const selectedSubcategories = await manager.find(Subcategory, { where: { id: In(ids) }, select: { id: true, status: true } });
			if (!selectedSubcategories.length) throw new NotFoundException('No se encontraron subcategorías.');
			if (selectedSubcategories.some((subcategory) => subcategory.status !== dto.status))
				throw new ConflictException('El estado cambió durante la operación. Intenta nuevamente.');
			const updatedIds = selectedSubcategories.map((subcategory) => subcategory.id);
			let affectedProducts = 0;

			if (!dto.status) {
				const productsResult = await manager
					.createQueryBuilder()
					.update(Product)
					.set({
						status: 'draft',
						statusAt: () => 'CURRENT_TIMESTAMP',
					})
					.where('subcategoryId IN (:...ids)', { ids })
					.andWhere('status IS DISTINCT FROM :draftStatus', { draftStatus: 'draft' })
					.execute();

				affectedProducts = productsResult.affected ?? 0;
			}

			return { updatedIds, affectedProducts };
		});

		this.kibanaService.audit({
			action: 'updateSubcategoriesStatus',
			performedBy: request.user.id,
			targetId: updatedIds,
			requestBody: JSON.stringify(dto),
			response: JSON.stringify({
				updatedIds,
				total: updatedIds.length,
				affectedProducts,
			}),
			requestId: request.requestId,
		});

		return {
			message: 'Registros actualizados correctamente.',
			data: updatedIds,
		};
	}

	async getBrandsByCategory(categoryId: string): Promise<GetBrandsByCategoryRes> {
		try {
			const categoryExists = await this.categoryRepository.exists({ where: { id: categoryId } });
			if (!categoryExists) {
				throw new NotFoundException('No se encontró la categoría asignada.');
			}

			const brands = await this.brandRepository
				.createQueryBuilder('brand')
				.select(['brand.id', 'brand.logoUrl', 'brand.name', 'brand.status', 'brand.websiteUrl'])
				.where((qb) => {
					const products = qb.subQuery().select('1').from(Product, 'product').where('product.categoryId = :categoryId').andWhere('product.brandId = brand.id').getQuery();
					return `EXISTS ${products}`;
				})
				.setParameter('categoryId', categoryId)
				.orderBy('brand.name', 'ASC')
				.addOrderBy('brand.id', 'ASC')
				.getMany();

			return {
				data: brands,
				message: 'Registros obtenidos correctamente.',
			};
		} catch (err: unknown) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async findCategoryProducts(categoryId: string, query: FindCategoryProductsQueryDto): Promise<FindCategoryProductsRes> {
		try {
			if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) {
				throw new BadRequestException({
					code: 'INVALID_QUERY_PARAMS',
					message: 'Los parámetros de la URL no son válidos.',
				});
			}

			const category = await this.categoryRepository.findOne({
				where: { id: categoryId },
			});

			if (!category) {
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

			const totalProducts = await queryBuilder.clone().getCount();
			const totalPages = Math.ceil(totalProducts / query.limit);
			const currentPage = totalPages === 0 ? 1 : Math.min(query.page, totalPages);
			const skip = (currentPage - 1) * query.limit;
			const products = await queryBuilder.skip(skip).take(query.limit).getMany();

			const productsWithQuality = products.map((product): CategoryProduct => ({
				...product,
				quality_label: getQualityLabel(product.quality),
				status: product.status as 'draft' | 'published',
				visibility: product.visibility as 'public' | 'private',
			}));

			return {
				category: category.name,
				products: productsWithQuality,
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
					brandIds: query.brandIds?.join(',') ?? 'Todos',
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

	async getCategoriesWithSubcategories(): Promise<GetCategoriesWithSubcategoriesRes> {
		const categories = await this.categoryRepository
			.createQueryBuilder('category')
			.leftJoinAndSelect('category.subcategories', 'subcategory')
			.select([
				'category.id',
				'category.prefix',
				'category.code',
				'category.name',
				'category.color',
				'category.icon',
				'category.status',
				'subcategory.id',
				'subcategory.name',
				'subcategory.prefix',
				'subcategory.code',
				'subcategory.status',
				'subcategory.categoryId',
			])
			.orderBy('category.name', 'ASC')
			.addOrderBy('subcategory.name', 'ASC')
			.getMany();

		return {
			data: categories,
			message: 'Registros obtenidos correctamente.',
		};
	}

	async get_categories_by_select(): Promise<GetCategoriesSelectRes> {
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
		} catch (err: unknown) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async getSubcategoriesByCategorySelect(id: string): Promise<GetSubcategoriesByCategorySelect> {
		try {
			const category = await this.categoryRepository.exists({
				where: { id },
			});

			if (!category) {
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
				data: subcategories.map((subcategory) => ({ ...subcategory, totalProducts: Number(Reflect.get(subcategory, 'totalProducts') ?? 0) })),
				message: 'Registro obtenido correctamente.',
			};
		} catch (err: unknown) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_subcat_by_select(): Promise<GetCategorySubcategorySelectionRes> {
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
		} catch (err: unknown) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async moveProductsToSubcategory(dto: UpdateCatSubcatProductsDto, request: CategoryRequest): Promise<MoveProductsToSubcategoryRes> {
		if (!dto.products?.length) {
			throw new BadRequestException('Debe seleccionar al menos un producto.');
		}

		const productIds = [...new Set(dto.products)];
		const queryRunner = this.dataSource.createQueryRunner();
		let affectedProducts = 0;

		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();

			// Usar el mismo orden de bloqueos que moveSubcategory.
			const category = await queryRunner.manager.findOne(Category, {
				where: { id: dto.categoryId },
				select: { id: true },
				lock: { mode: 'pessimistic_write' },
			});

			if (!category) {
				throw new NotFoundException('La categoría seleccionada no existe.');
			}

			const subcategory = await queryRunner.manager.findOne(Subcategory, {
				where: { id: dto.subcategoryId },
				select: { id: true, categoryId: true },
				lock: { mode: 'pessimistic_write' },
			});

			if (!subcategory) {
				throw new NotFoundException('La subcategoría seleccionada no existe.');
			}

			// Validar la pertenencia después de obtener el bloqueo.
			if (subcategory.categoryId !== category.id) {
				throw new BadRequestException('La subcategoría seleccionada no pertenece a la categoría indicada. Actualiza la selección e inténtalo nuevamente.');
			}

			const result = await queryRunner.manager
				.createQueryBuilder()
				.update(Product)
				.set({
					categoryId: subcategory.categoryId,
					subcategoryId: subcategory.id,
					status: 'draft',
					statusAt: () => `CASE WHEN "status" IS DISTINCT FROM 'draft' THEN CURRENT_TIMESTAMP ELSE "statusAt" END`,
				})
				.where('id IN (:...productIds)', {
					productIds,
				})
				.execute();

			affectedProducts = result.affected ?? 0;

			if (!affectedProducts) {
				throw new NotFoundException('No se encontraron los productos seleccionados.');
			}

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

		try {
			await this.kibanaService.audit({
				action: 'moveProductsToSubcategory',
				performedBy: request.user.id,
				targetId: dto.subcategoryId,
				requestBody: JSON.stringify({
					...dto,
					products: productIds,
				}),
				response: JSON.stringify({
					affected: affectedProducts,
				}),
				requestId: request.requestId,
			});
		} catch (error: unknown) {
			console.error('No se pudo registrar la auditoría.', error);
		}

		return {
			message: affectedProducts === 1 ? 'El producto se movió correctamente.' : `${affectedProducts} productos se movieron correctamente.`,
			data: affectedProducts,
		};
	}

	async moveSubcategory(subcategoryId: string, dto: MoveSubcategoryDto, request: CategoryRequest): Promise<MoveSubcategoryRes> {
		const queryRunner = this.dataSource.createQueryRunner();

		let movedSubcategory: MovedSubcategory | undefined;

		let affectedProducts = 0;

		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();

			const category = await queryRunner.manager.findOne(Category, {
				where: {
					id: dto.categoryId,
				},
				select: { id: true, status: true },
				lock: { mode: 'pessimistic_write' },
			});

			if (!category) {
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
					status: true,
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

			const nextStatus = category.status && subcategory.status;
			const statusChanged = subcategory.status !== nextStatus;

			const subcategoryResult = await queryRunner.manager
				.createQueryBuilder()
				.update(Subcategory)
				.set({
					categoryId: category.id,
					status: nextStatus,
					...(statusChanged && { statusAt: () => 'CURRENT_TIMESTAMP' }),
				})
				.where('id = :subcategoryId', {
					subcategoryId,
				})
				.returning(['id', 'name', 'categoryId', 'status'])
				.execute();

			if (subcategoryResult.affected !== 1 || !subcategoryResult.raw[0]) {
				throw new InternalServerErrorException('No se pudo mover la subcategoría.');
			}

			const productResult = await queryRunner.manager
				.createQueryBuilder()
				.update(Product)
				.set({
					categoryId: category.id,
					...(!nextStatus && {
						status: 'draft',
						statusAt: () => `CASE WHEN "status" IS DISTINCT FROM 'draft' THEN CURRENT_TIMESTAMP ELSE "statusAt" END`,
					}),
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
				action: 'moveSubcategory',
				performedBy: request.user.id,
				targetId: subcategoryId,
				requestBody: JSON.stringify(dto),
				response: JSON.stringify({
					subcategoryId,
					categoryId: dto.categoryId,
					status: movedSubcategory.status,
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
