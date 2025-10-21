import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { capitalizeStr } from '@/common/utils/capitalize-str.util';
import { Category } from '@/entities/category.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { EditCategoryDto } from './dto/edit-category.dto';
import { Subcategory } from '@/entities/subcategory.entity';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { EditSubcategoryDto } from './dto/edit-subcategory.dto';
import { logHelper } from '@/common/utils/logger-helper.util';

@Injectable()
export class CategoryService {
	private readonly logger = new Logger('AuthService');

	constructor(
		@InjectRepository(Category) private categoryRepository: Repository<Category>,
		@InjectRepository(Subcategory) private subcategoryRepository: Repository<Subcategory>
	) {}

	async create_category(createCategory: CreateCategoryDto) {
		try {
			const data = { ...createCategory };
			data.name = capitalizeStr(data.name.toUpperCase());
			data.slug = slugify(data.name, {
				lower: true,
				strict: true,
				trim: true,
			});
			const category: any = this.categoryRepository.create(data);
			const saver = await this.categoryRepository.save(category);
			logHelper(this.logger, 'log', 'Modulo Category', 'create_category', 'Categoría creada correctamente', saver);
			return saver;
		} catch (error) {
			logHelper(
				this.logger,
				'error',
				'Modulo Category',
				'create_category()',
				'Error al crear la categoría.',
				error.message
			);

			throw new InternalServerErrorException('Error al crear la categoría.');
		}
	}

	async get_categories(query: { filter: string; page: number; limit: number; status: string }) {
		try {
			const page = Number(query.page) || 0;
			const MAX_LIMIT = process.env.MAX_LIMIT_QUERY ? Number(process.env.MAX_LIMIT_QUERY) : 100;
			const limit = Math.min(Number(query.limit) || 0, MAX_LIMIT);

			// ✅ Si page o limit son <= 0, no se consulta nada
			if (page <= 0 || limit <= 0) {
				return {
					categories: [],
					totalCategories: 0,
					totalPages: 0,
					currentPage: page <= 0 ? 0 : page,
				};
			}

			const skip = (page - 1) * limit;
			const queryBuilder = this.categoryRepository.createQueryBuilder('category');

			if (query.filter?.trim()) {
				const searchTerms = query.filter
					.trim()
					.split(/\s+/)
					.slice(0, 5) // Limitar términos si quieres
					.map((t) => t.toLowerCase());

				const columns = ['category.name', 'category.description'];

				searchTerms.forEach((term, idx) => {
					const conditions = columns.map((c) => `${c} ILIKE :term${idx}`).join(' OR ');
					const params = { [`term${idx}`]: `%${term}%` };
					idx === 0 ? queryBuilder.where(`(${conditions})`, params) : queryBuilder.andWhere(`(${conditions})`, params);
				});
			}

			if (query.status && query.status !== 'Todos') {
				const statusBool = query.status === 'Activos';
				queryBuilder.andWhere('category.status = :status', { status: statusBool });
			}

			const [categories, totalCategories] = await queryBuilder
				.orderBy('category.createdAt', 'DESC')
				.skip(skip)
				.take(limit)
				.getManyAndCount();

			return {
				categories,
				totalCategories,
				totalPages: Math.ceil(totalCategories / limit),
				currentPage: page,
			};
		} catch (error) {
			logHelper(
				this.logger,
				'error',
				'Modulo Category',
				'get_categories()',
				'Error al obtener las categorías.',
				query,
				error.message
			);

			throw new InternalServerErrorException('Error al obtener las categorías.');
		}
	}

	async update_status_category(id: string, status: boolean) {
		try {
			const result = await this.categoryRepository
				.createQueryBuilder()
				.update(Category)
				.set({
					status: !status,
					statusAt: new Date(),
				})
				.where('id = :id', { id })
				.returning('*')
				.execute();

			logHelper(
				this.logger,
				'log',
				'Modulo Category',
				'update_status_category',
				'Estado de la categoría actualizada correctamente.',
				{
					status: !status,
					statusAt: new Date(),
					id,
				}
			);

			return result.raw[0];
		} catch (err) {
			logHelper(
				this.logger,
				'error',
				'Modulo Category',
				'update_status_category()',
				'No se pudo actualizar el estado de la categoría.',
				{
					id,
					status,
				},
				err.message
			);
			throw new InternalServerErrorException('Error al actualizar el estado del colaborador.');
		}
	}

	async get_category(id: string) {
		try {
			const category = await this.categoryRepository
				.createQueryBuilder('category')
				.where('category.id = :id', { id })
				.getOne();

			if (!category) {
				throw new NotFoundException('Categoría no encontrada.');
			}

			return category;
		} catch (error) {
			console.log(error);

			logHelper(
				this.logger,
				'error',
				'Modulo Category',
				'get_category()',
				'Error al obtener la categoría.',
				error.message
			);

			throw new InternalServerErrorException('Error al obtener la categoría.');
		}
	}

	async update_category(id: string, editCategoryDto: EditCategoryDto) {
		/* throw new Error("ECONNREFUSED"); */
		const data: Partial<Category> = {
			...editCategoryDto,
			name: capitalizeStr(editCategoryDto.name.toUpperCase()),
			slug: slugify(editCategoryDto.name, {
				lower: true,
				strict: true,
				trim: true,
			}),
		};
		let result;

		try {
			result = await this.categoryRepository
				.createQueryBuilder()
				.update(Category)
				.set(data)
				.where('id = :id', { id })
				.returning('*')
				.execute();

			logHelper(this.logger, 'log', 'Modulo Category', 'update_category', 'Categoría actualizada correctamente.', {
				...data,
				id,
			});
		} catch (err) {
			logHelper(
				this.logger,
				'error',
				'Modulo Category',
				'update_category()',
				'Error al actualizar la categoría.',
				{ ...data, id },
				err.message
			);
			throw new InternalServerErrorException('Error al actualizar la categoría.');
		}

		return result.raw[0];
	}

	async create_subcategory(createSubcategory: CreateSubcategoryDto) {
		try {
			let data = { ...createSubcategory };
			data.name = capitalizeStr(data.name.toUpperCase());
			data.slug = slugify(data.name, {
				lower: true,
				strict: true,
				trim: true,
			});
			const subcategory: any = this.subcategoryRepository.create(data);
			const saver = await this.subcategoryRepository.save(subcategory);
			logHelper(
				this.logger,
				'log',
				'Modulo Category',
				'create_subcategory',
				'Subcategoría creada correctamente',
				saver
			);
			return saver;
		} catch (error) {
			logHelper(
				this.logger,
				'error',
				'Modulo Category',
				'create_subcategory()',
				'Error al crear la subcategoría.',
				error.message
			);

			throw new InternalServerErrorException('Error al crear la subcategoría.');
		}
	}

	async get_subcategories(id: string) {
		try {
			const subcategories = await this.subcategoryRepository
				.createQueryBuilder('subcategory')
				.where('subcategory.categoryId = :id', { id })
				.orderBy('subcategory.name', 'ASC')
				.getMany();

			return subcategories;
		} catch (error) {
			logHelper(
				this.logger,
				'error',
				'Modulo Category',
				'get_subcategories()',
				'Error al obtener las subcategorías.',
				{ id: id },
				error.message
			);

			throw new InternalServerErrorException('Error al obtener las categorías.');
		}
	}

	async update_status_subcategory(id: string, status: boolean) {
		try {
			const result = await this.subcategoryRepository
				.createQueryBuilder()
				.update(Subcategory)
				.set({
					status: !status,
					statusAt: new Date(),
				})
				.where('id = :id', { id })
				.returning('*')
				.execute();

			logHelper(
				this.logger,
				'log',
				'Modulo Category',
				'update_status_subcategory',
				'Estado de la subcategoría actualizada correctamente.',
				{
					status: !status,
					statusAt: new Date(),
					id,
				}
			);

			return result.raw[0];
		} catch (err) {
			logHelper(
				this.logger,
				'error',
				'Modulo Category',
				'update_status_subcategory()',
				'No se pudo actualizar el estado de la subcategoría.',
				{
					id,
					status,
				},
				err.message
			);
			throw new InternalServerErrorException('Error al actualizar el estado del colaborador.');
		}
	}

	async update_subcategory(id: string, editSubcategoryDto: EditSubcategoryDto) {
		/* throw new Error("ECONNREFUSED"); */
		const data: Partial<Subcategory> = {
			...editSubcategoryDto,
			name: capitalizeStr(editSubcategoryDto.name.toUpperCase()),
			slug: slugify(editSubcategoryDto.name, {
				lower: true,
				strict: true,
				trim: true,
			}),
		};

		let result;

		try {
			result = await this.subcategoryRepository
				.createQueryBuilder()
				.update(Subcategory)
				.set(data)
				.where('id = :id', { id })
				.returning('*')
				.execute();

			logHelper(
				this.logger,
				'log',
				'Modulo Category',
				'update_subcategory',
				'Subcategoría actualizada correctamente.',
				{ ...data, id }
			);
		} catch (err) {
			logHelper(
				this.logger,
				'error',
				'Modulo Category',
				'update_subcategory()',
				'Error al actualizar la subcategoría.',
				data,
				err.message
			);
			throw new InternalServerErrorException('Error al actualizar la subcategoría.');
		}

		return result.raw[0];
	}

	async validate_name_category(name: string) {
		const category = await this.categoryRepository.findOneBy({ name });
		return category;
	}

	async validate_name_subcategory(categoryId: string, name: string) {
		const subcategory = await this.subcategoryRepository
			.createQueryBuilder('subcategory')
			.where('subcategory.categoryId = :id', { id: categoryId })
			.andWhere('subcategory.name = :name', { name })
			.getOne();

		return subcategory;
	}
}
