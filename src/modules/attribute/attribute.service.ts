import { Attribute } from '@/entities/attribute.entity';
import { Category } from '@/entities/category.entity';
import {
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { capitalizeStr } from '@/common/utils/capitalize-str.util';
import slugify from 'slugify';
import { AttributeValue } from '@/entities/attribute-value.entity';
import { AttributeCategory } from '@/entities/attribute-category.entity';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { EditAttributeDto } from './dto/edit-attribute.dto';
import { logHelper } from '@/common/utils/logger-helper.util';

@Injectable()
export class AttributeService {
	private readonly logger = new Logger('AuthService');

	constructor(
		@InjectRepository(Category) private categoryRepository: Repository<Category>,
		@InjectRepository(Attribute) private attributeRepository: Repository<Attribute>,
		@InjectRepository(AttributeValue) private attributeValuesRepository: Repository<AttributeValue>,
		private readonly dataSource: DataSource
	) {}

	async validate_name_attribute(name: string) {
		const attribute = await this.attributeRepository.findOneBy({ name });
		return attribute;
	}

	async create_attribute(createAttributeDto: CreateAttributeDto) {
		try {
			const name = capitalizeStr(createAttributeDto.name.toUpperCase());
			const code = slugify(name, { lower: true, strict: true, trim: true });

			const valuesPayload = (createAttributeDto.values || []).map((v) => ({
				value: v.value,
				code: slugify(v.value, { lower: true, strict: true, trim: true }),
			}));

			const categoriesIds = createAttributeDto.categories || [];

			const attribute = await this.dataSource.transaction(async (manager) => {
				const attributeEntity = manager.getRepository(Attribute).create({
					name,
					code,
					unit: createAttributeDto.unit,
					status: true,
				});
				const savedAttr = await manager.getRepository(Attribute).save(attributeEntity);

				if (valuesPayload.length) {
					const valuesToInsert = valuesPayload.map((v) => ({
						...v,
						attributeId: savedAttr.id, // FK column creada automáticamente por TypeORM
					}));
					await manager.getRepository(AttributeValue).insert(valuesToInsert);
				}

				if (categoriesIds.length) {
					const categoriesToInsert: any = categoriesIds.map((catId) => ({
						attributeId: savedAttr.id,
						categoryId: catId,
					}));
					console.log('categoriesToInsert', categoriesToInsert);

					await manager.getRepository(AttributeCategory).insert(categoriesToInsert);
				}

				return savedAttr;
			});

			return attribute;
		} catch (error) {
			logHelper(
				this.logger,
				'error',
				'Modulo Attribute',
				'create_attribute()',
				'Error al crear el atributo.',
				error.message
			);

			throw new InternalServerErrorException('Error al crear el atributo.');
		}
	}

	async get_attributes(query: { filter: string; page: number; limit: number; status: string; categories: string }) {
		try {
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			const page = Number(query.page) || 0;
			const MAX_LIMIT = process.env.MAX_LIMIT_QUERY ? Number(process.env.MAX_LIMIT_QUERY) : 100;
			const limit = Math.min(Number(query.limit) || 0, MAX_LIMIT);

			// ✅ Si page o limit son <= 0, no se consulta nada
			if (page <= 0 || limit <= 0) {
				return {
					collaborators: [],
					totalCollaborators: 0,
					totalPages: 0,
					currentPage: page <= 0 ? 0 : page,
				};
			}

			const skip = (page - 1) * limit;
			const queryBuilder = this.attributeRepository.createQueryBuilder('attribute');

			queryBuilder.loadRelationCountAndMap(
				'attribute.valuesCount', // nombre del campo virtual que aparecerá en el resultado
				'attribute.attributeValues' // relación que quieres contar
			);

			queryBuilder
				.leftJoinAndSelect('attribute.attributeCategories', 'attributeCategory')
				.leftJoinAndSelect('attributeCategory.category', 'category');

			if (query.filter?.trim()) {
				const searchTerms = query.filter
					.trim()
					.split(/\s+/)
					.slice(0, 5) // Limitar términos si quieres
					.map((t) => t.toLowerCase());

				const columns = ['attribute.name'];

				searchTerms.forEach((term, idx) => {
					const conditions = columns.map((c) => `${c} ILIKE :term${idx}`).join(' OR ');
					const params = { [`term${idx}`]: `%${term}%` };
					idx === 0 ? queryBuilder.where(`(${conditions})`, params) : queryBuilder.andWhere(`(${conditions})`, params);
				});
			}

			if (query.status && query.status !== 'Todos') {
				const statusBool = query.status === 'Activos';
				queryBuilder.andWhere('attribute.status = :status', {
					status: statusBool,
				});
			}

			if (query.categories && query.categories !== 'Todos') {
				const categoryIds = query.categories.split(',');
				const validCategoryIds = categoryIds.filter((id) => uuidRegex.test(id));
				if (validCategoryIds.length > 0) {
					queryBuilder.andWhere('category.id IN (:...validCategoryIds)', {
						validCategoryIds,
					});
				}
			}

			let [attributes, totalAttributes]: any = await queryBuilder
				.orderBy('attribute.createdAt', 'DESC')
				.skip(skip)
				.take(query.limit)
				.getManyAndCount();

			attributes = attributes.map((attr) => {
				return {
					id: attr.id,
					name: attr.name,
					code: attr.code,
					unit: attr.unit,
					status: attr.status,
					createdAt: attr.createdAt,
					updatedAt: attr.updatedAt,
					valuesCount: (attr as any).valuesCount,
					categories: attr.attributeCategories.map((ac) => ac.category.name).slice(0, 2),
				};
			});

			return {
				attributes,
				totalAttributes,
				totalPages: Math.ceil(totalAttributes / query.limit),
				currentPage: query.page,
			};
		} catch (error) {
			logHelper(
				this.logger,
				'error',
				'Modulo Attribute',
				'get_attributes()',
				'Error al obtener los atributos.',
				query,
				error.message
			);

			throw new InternalServerErrorException('Error al obtener los atributos.');
		}
	}

	async update_status_attribute(id: string, status: boolean) {
		try {
			const result = await this.attributeRepository
				.createQueryBuilder()
				.update(Attribute)
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
				'Modulo Attribute',
				'update_status_attribute',
				'Estado del atributo actualizado correctamente.',
				{
					status: !status,
					statusAt: new Date(),
					id,
				}
			);

			return result.raw[0];
		} catch (error) {
			logHelper(
				this.logger,
				'error',
				'Modulo Attribute',
				'update_status_attribute()',
				'No se pudo actualizar el estado del atributo.',
				{
					id,
					status,
				},
				error.message
			);

			throw new InternalServerErrorException('No se pudo actualizar el estado del atributo.');
		}
	}

	async get_attribute(id: string) {
		try {
			/* throw new UnauthorizedException('Token inválido'); */
			let attribute = await this.attributeRepository
				.createQueryBuilder('attribute')
				.leftJoinAndSelect('attribute.attributeCategories', 'attributeCategory')
				.leftJoinAndSelect('attributeCategory.category', 'category')
				.where('attribute.id = :id', { id })
				.getOne();

			if (!attribute) {
				throw new NotFoundException('Atributo no encontrado.');
			}

			// extraer solo los nombres de categorías (si quieres un array plano)
			const categories = attribute.attributeCategories.map((ac) => ac.category.id);

			return {
				...attribute,
				categories, // ['cat1', 'cat2', ...]
			};
		} catch (error) {
			logHelper(
				this.logger,
				'error',
				'Modulo Attribute',
				'get_attribute()',
				'Error al obtener el atributo.',
				error.message
			);

			throw new InternalServerErrorException('Error al obtener el atributo.');
		}
	}

	async get_values_attribute(id: string) {
		try {
			let attributes = await this.attributeValuesRepository
				.createQueryBuilder('attribute-values')
				.where('attribute-values.attributeId = :id', { id })
				.getMany();
			return attributes;
		} catch (error) {
			logHelper(
				this.logger,
				'error',
				'Modulo Attribute',
				'get_values_attribute()',
				'Error al obtener los valores el atributo.',
				{
					id,
				},
				error.message
			);
			throw new InternalServerErrorException('Error al obtener los valores el atributo.');
		}
	}

	async add_value_attribute(createAttributeValueDto: CreateAttributeValueDto) {
		try {
			const code = slugify(createAttributeValueDto.value ?? '', {
				lower: true,
				strict: true,
				trim: true,
			});

			const attribute = this.attributeValuesRepository.create({
				...createAttributeValueDto,
				code,
			});

			return await this.attributeValuesRepository.save(attribute);
		} catch (error) {
			logHelper(
				this.logger,
				'error',
				'Modulo Attribute',
				'add_value_attribute()',
				'Error al agregar los valores el atributo.',
				createAttributeValueDto,
				error.message
			);
			throw new InternalServerErrorException('Error al agregar los valores el atributo.');
		}
	}

	async update_attribute(id: string, editAttributeDto: EditAttributeDto) {
		try {
			/* throw new Error("ECONNREFUSED"); */
			const name = capitalizeStr(editAttributeDto.name.toUpperCase());
			const code = slugify(editAttributeDto.name, { lower: true, strict: true, trim: true });
			editAttributeDto.code = code;
			const categoriesIds = editAttributeDto.categories || [];
			console.log(categoriesIds);

			const attribute = await this.dataSource.transaction(async (manager) => {
				const attributeEntity = await manager.getRepository(Attribute).preload({
					id: id,
					name,
					code,
					unit: editAttributeDto.unit,
					status: true,
				});

				if (!attributeEntity) {
					throw new Error('Attribute not found');
				}

				if (categoriesIds.length >= 1) {
					const existingCategories = await manager.getRepository(AttributeCategory).find({
						where: { attributeId: id },
					});

					const existingCategoryIds = existingCategories.map((c) => c.categoryId);
					console.log('existingCategoryIds', existingCategoryIds);

					const newCategories = categoriesIds
						.filter((prev: any) => !existingCategoryIds.includes(prev)) // ahora sí compara ids
						.map((prev) => ({
							attributeId: id,
							categoryId: prev,
						}));
					console.log('newCategories', newCategories);

					if (newCategories.length) {
						await manager.getRepository(AttributeCategory).insert(newCategories);
					}
				}

				const newAttribute = await manager
					.getRepository(Attribute)
					.createQueryBuilder('attribute')
					.leftJoinAndSelect('attribute.attributeCategories', 'attributeCategory')
					.leftJoinAndSelect('attributeCategory.category', 'category')
					.where('attribute.id = :id', { id })
					.getOne();

				if (!newAttribute) throw new Error('NOTDOCUMENT');

				const categories = newAttribute.attributeCategories.map((prev: any) => prev.category.id);

				return {
					...newAttribute,
					categories,
				};
			});

			return attribute;
		} catch (error) {
			logHelper(
				this.logger,
				'error',
				'Modulo Attribute',
				'update_attribute()',
				'Error al actualizar el atributo.',
				{ ...editAttributeDto, id },
				error.message
			);
			throw new InternalServerErrorException('Error al actualizar el atributo.');
		}
	}
	
}
