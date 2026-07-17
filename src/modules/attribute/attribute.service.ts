import { Attribute } from '@/entities/attribute.entity';
import { Category } from '@/entities/category.entity';
import { Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { capitalizeStr } from '@/common/utils/capitalize-str.util';
import slugify from 'slugify';
import { AttributeValue } from '@/entities/attribute-value.entity';
import { AttributeCategory } from '@/entities/attribute-category.entity';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { EditAttributeDto } from './dto/edit-attribute.dto';
import { logHelper } from '@/common/utils/logger-helper.util';
import { UpdateStatusAttributesDto } from './dto/update-status-attributes.dto';
import { CreateGroupAttributeDto } from './dto/create-group-attribute.dto';
import { AttributeGroup } from '@/entities/attribute-group.entity';
import { EditGroupAttributeDto } from './dto/edit-group-attribute.dto';
import { KibanaService } from '@/common/services/kibana/kibana.service';
import { UpdateStatusGroupAttributesDto } from './dto/update-status-group-attributes.dto';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { AttributeValidator } from './validators/attribute.validator';
import { getPagination } from '@/common/utils/get-pagination.util';

@Injectable()
export class AttributeService {
	private readonly logger = new Logger('AuthService');

	constructor(
		@InjectRepository(Category) private categoryRepository: Repository<Category>,
		@InjectRepository(Attribute) private attributeRepository: Repository<Attribute>,
		@InjectRepository(AttributeValue) private attributeValuesRepository: Repository<AttributeValue>,
		@InjectRepository(AttributeGroup) private attributeGroupRepository: Repository<AttributeGroup>,
		@InjectRepository(AttributeCategory) private attributeCategoryRepository: Repository<AttributeCategory>,
		private readonly dataSource: DataSource,
		private kibanaService: KibanaService,
		private readonly attributeValidator: AttributeValidator
	) {}

	async create_attribute(createAttributeDto: CreateAttributeDto, request: any) {
		try {
			const isExistAttributeGroup = await this.attributeValidator.existsAttributeGroup(createAttributeDto.attributeGroupId!);

			if (!isExistAttributeGroup) {
				throw new NotFoundException('El grupo de atributos seleccionado no existe.');
			}

			const valuesPayload = (createAttributeDto.values || []).map((v) => ({
				value: v.value,
			}));

			const attribute = await this.dataSource.transaction(async (manager) => {
				const attributeEntity = manager.getRepository(Attribute).create({
					name: capitalizeStr(createAttributeDto.name),
					unit: createAttributeDto.unit,
					attributeGroupId: createAttributeDto.attributeGroupId,
					description: createAttributeDto.description,
					status: true,
				});

				const savedAttr = await manager.getRepository(Attribute).save(attributeEntity);

				if (!savedAttr?.id) {
					throw new InternalServerErrorException('No se pudo registrar el atributo.');
				}

				if (valuesPayload.length > 0) {
					const valuesToInsert = valuesPayload.map((v) => ({
						...v,
						attributeId: savedAttr.id,
					}));

					const result = await manager.getRepository(AttributeValue).insert(valuesToInsert);

					if (!result.identifiers || result.identifiers.length === 0) {
						throw new InternalServerErrorException('No se pudieron registrar los valores del atributo.');
					}
				}

				return savedAttr;
			});

			this.kibanaService.audit({
				action: 'create_attribute',
				performedBy: request.user.id,
				targetId: attribute.id,
				requestBody: JSON.stringify(createAttributeDto),
				response: JSON.stringify(attribute),
				requestId: request.requestId,
			});

			return {
				message: 'Registro creado correctamente.',
				data: attribute.id,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async create_group_attribute(createGroupAttributeDto: CreateGroupAttributeDto, request: any) {
		try {
			const categoriesIds = [...new Set(createGroupAttributeDto.categories || [])];

			const attributeGroup = await this.dataSource.transaction(async (manager) => {
				const groupEntity = manager.getRepository(AttributeGroup).create({
					name: capitalizeStr(createGroupAttributeDto.name),
					description: createGroupAttributeDto.description.trim(),
					status: true,
				});

				const savedGroup = await manager.getRepository(AttributeGroup).save(groupEntity);

				if (!savedGroup?.id) {
					throw new InternalServerErrorException('No se pudo registrar el grupo de atributos.');
				}

				if (categoriesIds.length > 0) {
					const categoriesToInsert = categoriesIds.map((categoryId) => ({
						attributeGroupId: savedGroup.id,
						categoryId,
					}));

					const result = await manager.getRepository(AttributeCategory).insert(categoriesToInsert);

					if (!result.identifiers || result.identifiers.length === 0) {
						throw new InternalServerErrorException('No se pudieron asociar las categorías al grupo.');
					}
				}

				return savedGroup;
			});

			this.kibanaService.audit({
				action: 'create_group_attribute',
				performedBy: request.user.id,
				targetId: attributeGroup.id,
				requestBody: JSON.stringify(createGroupAttributeDto),
				response: JSON.stringify(attributeGroup),
				requestId: request.requestId,
			});

			return {
				message: 'Registro creado correctamente.',
				data: attributeGroup.id,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_attribute_and_categories(id: string){
		try {
			
			const attributeGroup = await this.attributeGroupRepository
				.createQueryBuilder('attributeGroup')
				.select([
					'attributeGroup.id',
					'attributeGroup.name'
				])
				.where('attributeGroup.id = :id', { id })
				.getOne();

			const categories = await this.attributeCategoryRepository
				.createQueryBuilder('attributeCategory')
				.innerJoin('attributeCategory.category', 'category')
				.select([
					'category.id AS id',
					'category.name AS name'
				])
				.where('attributeCategory.attributeGroupId = :attributeGroupId', {
					attributeGroupId: id
				})
				.orderBy('category.name', 'ASC')
				.getRawMany();

			return {
				data: {
					attributeGroup,
					categories
				},
				message: 'Registros obtenidos correctamente.',
			};
			
		} catch (err) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_attributes(id: string, query: { filter: string; page: number; limit: number; status: string; sort: string }) {
		try {
			const pagination = getPagination(query.page, query.limit);

			const groupAttribute = await this.attributeGroupRepository.exists({
				where: { id },
			});

			if (!groupAttribute) {
				throw new NotFoundException('No se encontró el grupo de atributos.');
			}

			const queryBuilder = this.attributeRepository
				.createQueryBuilder('attribute')
				.select(['attribute.id', 'attribute.name', 'attribute.status', 'attribute.createdAt', 'attributeValues.id', 'attributeValues.value'])
				.where('attribute.attributeGroupId = :id', { id })
				.leftJoinAndSelect('attribute.attributeValues', 'attributeValues')
				.loadRelationCountAndMap('attribute.valuesCount', 'attribute.attributeValues');

			// FILTRO TEXTO
			if (query.filter?.trim()) {
				const searchTerms = query.filter
					.trim()
					.slice(0, 100)
					.split(/\s+/)
					.slice(0, 5)
					.map((term) => term.toLowerCase());

				const columns = ['attribute.name'];

				searchTerms.forEach((term, idx) => {
					const conditions = columns.map((column) => `${column} ILIKE :term${idx}`).join(' OR ');
					queryBuilder.andWhere(`(${conditions})`, { [`term${idx}`]: `%${term}%` });
				});
			}

			// FILTRO STATUS
			if (query.status && query.status !== 'Todos') {
				queryBuilder.andWhere('attribute.status = :status', { status: query.status === 'Activos' });
			}

			// ✅ ORDENAMIENTO
			const SORT_FIELDS = {
				name: 'attribute.name',
				createdAt: 'attribute.createdAt',
			} as const;

			if (query.sort?.trim() && query.sort !== 'Predeterminado') {
				const [field, direction] = query.sort.split(':');

				if (field in SORT_FIELDS && direction && ['asc', 'desc'].includes(direction.toLowerCase())) {
					queryBuilder.orderBy(SORT_FIELDS[field as keyof typeof SORT_FIELDS], direction.toUpperCase() as 'ASC' | 'DESC');
				} else {
					queryBuilder.orderBy('attribute.createdAt', 'DESC');
				}
			} else {
				queryBuilder.orderBy('attribute.createdAt', 'DESC');
			}

			const [attributes, totalAttributes]: any = await queryBuilder.skip(pagination.skip).take(pagination.limit).getManyAndCount();

			const data = attributes.map((attr) => ({
				id: attr.id,
				name: attr.name,
				status: attr.status,
				valuesCount: attr.valuesCount,
				attributeValues: attr.attributeValues.map((value) => value.value),
			}));

			return {
				attributes: data,
				meta: {
					total: totalAttributes,
					currentPage: pagination.page,
					limit: pagination.limit,
					totalPages: Math.ceil(totalAttributes / pagination.limit),
				},
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_groups_attributes(query: { filter: string; page: number; limit: number; status: string; categories: string; sort: string }) {
		try {
			const pagination = getPagination(query.page, query.limit);
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			const queryBuilder = this.attributeGroupRepository
				.createQueryBuilder('attributeGroup')
				.select([
					'attributeGroup.id',
					'attributeGroup.name',
					'attributeGroup.description',
					'attributeGroup.status',
					'attributeGroup.createdAt',

					'attributeCategory.id',

					'category.id',
					'category.name',
				])
				.leftJoinAndSelect('attributeGroup.attributeCategories', 'attributeCategory')
				.leftJoinAndSelect('attributeCategory.category', 'category')
				.leftJoinAndSelect('attributeGroup.attributes', 'attribute')
				.leftJoin('attributeGroup.attributeCategories', 'filterAttributeCategory')
				.leftJoin('filterAttributeCategory.category', 'filterCategory');

			// FILTRO TEXTO
			if (query.filter?.trim()) {
				const searchTerms = query.filter
					.trim()
					.slice(0, 100)
					.split(/\s+/)
					.slice(0, 5)
					.map((term) => term.toLowerCase());

				const columns = ['attributeGroup.name'];

				searchTerms.forEach((term, idx) => {
					const conditions = columns.map((column) => `${column} ILIKE :term${idx}`).join(' OR ');
					queryBuilder.andWhere(`(${conditions})`, { [`term${idx}`]: `%${term}%` });
				});
			}

			// FILTRO STATUS
			if (query.status && query.status !== 'Todos') {
				queryBuilder.andWhere('attributeGroup.status = :status', { status: query.status === 'Activos' });
			}

			// FILTRO CATEGORÍAS
			if (query.categories && query.categories !== 'Todos') {
				const categoryIds = query.categories.split(',');

				const validCategoryIds = categoryIds.filter((id) => uuidRegex.test(id));

				if (validCategoryIds.length > 0) {
					queryBuilder.andWhere('filterCategory.id IN (:...validCategoryIds)', {
						validCategoryIds,
					});
				}
			}

			// ✅ ORDENAMIENTO
			const SORT_FIELDS = {
				name: 'attributeGroup.name',
				createdAt: 'attributeGroup.createdAt',
			} as const;

			if (query.sort?.trim() && query.sort !== 'Predeterminado') {
				const [field, direction] = query.sort.split(':');

				if (field in SORT_FIELDS && direction && ['asc', 'desc'].includes(direction.toLowerCase())) {
					queryBuilder.orderBy(SORT_FIELDS[field as keyof typeof SORT_FIELDS], direction.toUpperCase() as 'ASC' | 'DESC');
				} else {
					queryBuilder.orderBy('attributeGroup.createdAt', 'DESC');
				}
			} else {
				queryBuilder.orderBy('attributeGroup.createdAt', 'DESC');
			}

			let [attributeGroups, totalAttributesGroups]: any = await queryBuilder.skip(pagination.skip).take(pagination.limit).getManyAndCount();

			attributeGroups = attributeGroups.map((attr) => {
				return {
					id: attr.id,
					name: attr.name,
					description: attr.description,
					status: attr.status,
					createdAt: attr.createdAt,
					categories: attr.attributeCategories.map((ac) => ({ id: ac.category.id, name: ac.category.name })),
				};
			});

			return {
				attributeGroups,
				totalAttributesGroups,
				meta: {
					total: totalAttributesGroups,
					currentPage: pagination.page,
					limit: pagination.limit,
					totalPages: Math.ceil(totalAttributesGroups / pagination.limit),
				},
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_status_attribute(id: string, status: boolean, request: any) {
		try {
			const exists = await this.attributeRepository.exists({ where: { id } });

			if (!exists) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const result = await this.attributeRepository
				.createQueryBuilder()
				.update(Attribute)
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

			const updatedAttribute = result.raw[0];

			this.kibanaService.audit({
				action: 'update_status_attribute',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify({ status }),
				response: JSON.stringify(updatedAttribute),
				requestId: request.requestId,
			});

			return {
				message: 'Registro actualizado correctamente.',
				data: updatedAttribute,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_status_group_attribute(id: string, status: boolean, request: any) {
		try {
			const exists = await this.attributeGroupRepository.exists({
				where: { id },
			});

			if (!exists) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const result = await this.attributeGroupRepository
				.createQueryBuilder()
				.update(AttributeGroup)
				.set({
					status: !status,
					statusAt: () => 'CURRENT_TIMESTAMP',
				})
				.where('id = :id', { id })
				.returning(['id', 'status', 'name'])
				.execute();

			if (!result.raw?.length) {
				throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			}

			const updatedAttributeGroup = result.raw[0];

			this.kibanaService.audit({
				action: 'update_status_group_attribute',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify({ status }),
				response: JSON.stringify(result.raw[0]),
				requestId: request.requestId,
			});

			return {
				message: 'Registro actualizado correctamente.',
				data: updatedAttributeGroup,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_status_attributes(updateStatusAttributesDto: UpdateStatusAttributesDto, request: any) {
		try {
			const ids = [...new Set(updateStatusAttributesDto.ids)];

			const result = await this.attributeRepository
				.createQueryBuilder()
				.update(Attribute)
				.set({
					status: updateStatusAttributesDto.status,
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
				action: 'update_status_attributes',
				performedBy: request.user.id,
				targetId: updatedIds,
				requestBody: JSON.stringify({
					status: updateStatusAttributesDto.status,
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

	async update_status_group_attributes(updateStatuGroupsAttributesDto: UpdateStatusGroupAttributesDto, request: any) {
		try {
			const ids = [...new Set(updateStatuGroupsAttributesDto.ids)];

			const result = await this.attributeGroupRepository
				.createQueryBuilder()
				.update(AttributeGroup)
				.set({
					status: updateStatuGroupsAttributesDto.status,
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
				action: 'update_status_group_attributes',
				performedBy: request.user.id,
				targetId: updateStatuGroupsAttributesDto.ids,
				requestBody: JSON.stringify({
					status: updateStatuGroupsAttributesDto.status,
				}),
				response: JSON.stringify({
					updatedIds,
					total: updatedIds.length,
				}),
				requestId: request.requestId,
			});

			return {
				message: 'Registro actualizado correctamente.',
				data: updatedIds,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_attribute(id: string, request: any) {
		try {
			const attribute = await this.attributeRepository
				.createQueryBuilder('attribute')
				.select(['attribute.id', 'attribute.name', 'attribute.description', 'attribute.unit'])
				.where('attribute.id = :id', { id })
				.getOne();

			if (!attribute) {
				throw new NotFoundException('No se encontró el registro.');
			}
			return {
				data: attribute,
				message: 'Registro obtenido correctamente.',
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_attribute_group(id: string) {
		try {
			const attributeGroup = await this.attributeGroupRepository
				.createQueryBuilder('attributeGroup')
				.select(['attributeGroup.id', 'attributeGroup.name', 'attributeGroup.description','attributeGroup.createdAt','attributeGroup.updatedAt','attributeGroup.statusAt'])
				.leftJoinAndSelect('attributeGroup.attributeCategories', 'attributeCategory')
				.leftJoinAndSelect('attributeCategory.category', 'category')
				.where('attributeGroup.id = :id', { id })
				.getOne();

			if (!attributeGroup) {
				throw new NotFoundException('No se encontró el registro.');
			}

			return {
				data: {
					...attributeGroup,
					categories: attributeGroup.attributeCategories.map((item) => item.category.id),
				},
				message: 'Registro obtenido correctamente.',
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_values_attribute(id: string) {
		try {
			const exists = await this.attributeRepository.exists({
				where: { id },
			});

			if (!exists) {
				throw new NotFoundException('No se encontró el atributo.');
			}

			const attributes = await this.attributeValuesRepository
				.createQueryBuilder('attributeValue')
				.select(['attributeValue.id', 'attributeValue.value'])
				.where('attributeValue.attributeId = :id', { id })
				.getMany();

			return {
				data: attributes,
				message: 'Registro obtenido correctamente.',
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async add_value_attribute(createAttributeValueDto: CreateAttributeValueDto, request: any) {
		try {
			const existsAttribute = await this.attributeRepository.exists({
				where: {
					id: createAttributeValueDto.attributeId,
				},
			});

			if (!existsAttribute) {
				throw new NotFoundException('No se encontró el atributo.');
			}

			const result = await this.attributeValuesRepository
				.createQueryBuilder()
				.insert()
				.into(AttributeValue)
				.values({
					attributeId: createAttributeValueDto.attributeId,
					value: createAttributeValueDto.value.trim(),
				})
				.returning(['id', 'value', 'status', 'attributeId'])
				.execute();

			const response = result.raw[0];

			if (!response?.id) {
				throw new InternalServerErrorException('No se pudo registrar el valor.');
			}

			this.kibanaService.audit({
				action: 'add_value_attribute',
				performedBy: request.user.id,
				targetId: '',
				requestBody: JSON.stringify(createAttributeValueDto),
				response: JSON.stringify(response),
				requestId: request.requestId,
			});

			return {
				message: 'Registro creado correctamente.',
				data: response,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_attribute(id: string, editAttributeDto: EditAttributeDto, request: any) {
		try {
			const exists = await this.attributeRepository.exists({
				where: { id },
			});

			if (!exists) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const payload = {
				name: capitalizeStr(editAttributeDto.name.trim()),
				unit: editAttributeDto.unit?.trim(),
				description: editAttributeDto.description?.trim(),
			};

			const result = await this.attributeRepository
				.createQueryBuilder()
				.update(Attribute)
				.set(payload)
				.where('id = :id', { id })
				.returning(['id', 'status', 'name', 'unit', 'description'])
				.execute();

			if (!result.affected) {
				throw new InternalServerErrorException('No se pudo actualizar el registro.');
			}

			if (!result.raw?.length) {
				throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			}

			const updatedAttribute = result.raw[0];

			this.kibanaService.audit({
				action: 'update_attribute',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify(editAttributeDto),
				response: JSON.stringify({
					id: updatedAttribute.id,
					name: updatedAttribute.name,
				}),
				requestId: request.requestId,
			});

			return {
				message: 'Registro actualizado correctamente.',
				data: updatedAttribute,
			};
		} catch (error) {}
	}

	async delete_value_attribute(id: string, request: any) {
		try {
			const exists = await this.attributeValuesRepository.exists({
				where: { id },
			});

			if (!exists) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const result = await this.attributeValuesRepository.delete(id);

			if (!result.affected) {
				throw new InternalServerErrorException('No se pudo eliminar el registro.');
			}

			this.kibanaService.audit({
				action: 'delete_value_attribute',
				performedBy: request.user.id,
				targetId: id,
				requestId: request.requestId,
			});

			return {
				data: true,
				message: 'Registro eliminado correctamente.',
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_attribute_group(id: string, editGroupAttributeDto: EditGroupAttributeDto, request: any) {
		try {
			const exists = await this.attributeGroupRepository.exists({
				where: { id },
			});

			if (!exists) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const categoriesIds = [...new Set(editGroupAttributeDto.categories || [])];

			const attributeGroup = await this.dataSource.transaction(async (manager) => {
				const attributeGroupRepository = manager.getRepository(AttributeGroup);
				const attributeCategoryRepository = manager.getRepository(AttributeCategory);

				const attributeGroupEntity = await attributeGroupRepository.preload({
					id,
					name: capitalizeStr(editGroupAttributeDto.name.trim()),
					description: editGroupAttributeDto.description?.trim(),
				});

				if (!attributeGroupEntity) {
					throw new NotFoundException('No se encontró el registro.');
				}

				const savedGroup = await attributeGroupRepository.save(attributeGroupEntity);

				if (!savedGroup?.id) {
					throw new InternalServerErrorException('No se pudo actualizar el grupo.');
				}

				const currentRelations = await attributeCategoryRepository.find({
					where: {
						attributeGroupId: id,
					},
				});

				const currentCategoryIds = currentRelations.map((item) => item.categoryId);

				const categoriesToInsert = categoriesIds.filter((categoryId) => !currentCategoryIds.includes(categoryId));

				const categoriesToDelete = currentCategoryIds.filter((categoryId) => !categoriesIds.includes(categoryId));

				if (categoriesToInsert.length) {
					await attributeCategoryRepository.insert(
						categoriesToInsert.map((categoryId) => ({
							attributeGroupId: id,
							categoryId,
						}))
					);
				}

				if (categoriesToDelete.length) {
					await attributeCategoryRepository.delete({
						attributeGroupId: id,
						categoryId: In(categoriesToDelete),
					});
				}

				const updatedGroup = await attributeGroupRepository
					.createQueryBuilder('attributeGroup')
					.leftJoinAndSelect('attributeGroup.attributeCategories', 'attributeCategory')
					.leftJoinAndSelect('attributeCategory.category', 'category')
					.select([
						'attributeGroup.id',
						'attributeGroup.status',
						'attributeGroup.name',
						'attributeGroup.description',

						'attributeCategory.id',
						'attributeCategory.categoryId',

						'category.id',
						'category.name',
					])
					.where('attributeGroup.id = :id', { id })
					.getOne();

				if (!updatedGroup) {
					throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
				}

				return updatedGroup;
			});

			this.kibanaService.audit({
				action: 'update_attribute_group',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify(editGroupAttributeDto),
				response: JSON.stringify({
					id: attributeGroup.id,
					name: attributeGroup.name,
				}),
				requestId: request.requestId,
			});

			return {
				message: 'Registro actualizado correctamente.',
				data: attributeGroup,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_attributes_by_select() {
		try {
			const attributes = await this.attributeRepository
				.createQueryBuilder('attribute')
				.select(['attribute.id', 'attribute.name', 'attribute.status'])
				.where('attribute.status = :status', { status: true })
				.orderBy('attribute.name', 'ASC')
				.getMany();
			return attributes;
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_attributes_by_category(id: string) {
		try {
			const categoryExists = await this.categoryRepository.exists({
				where: { id },
			});

			if (!categoryExists) {
				throw new NotFoundException('No se encontró la categoría.');
			}

			const groups = await this.attributeGroupRepository
				.createQueryBuilder('attributeGroup')
				.innerJoin('attributeGroup.attributeCategories', 'attributeCategory', 'attributeCategory.categoryId = :categoryId', { categoryId: id })
				.leftJoinAndSelect('attributeGroup.attributes', 'attribute', 'attribute.status = true')
				.leftJoinAndSelect('attribute.attributeValues', 'attributeValue')
				.select(['attributeGroup.id', 'attributeGroup.name', 'attribute.id', 'attribute.name', 'attributeValue.id', 'attributeValue.value'])
				.where('attributeGroup.status = true')
				.orderBy('attributeGroup.name', 'ASC')
				.addOrderBy('attribute.name', 'ASC')
				.getMany();

			const data = groups
				.map((group) => ({
					id: group.id,
					name: group.name,
					attributes: group.attributes
						.filter((attribute) => attribute.attributeValues?.length > 0)
						.map((attribute) => ({
							id: attribute.id,
							name: attribute.name,
							isFeatured: false,
							attributeValueId: null,
							attributeValues: attribute.attributeValues.map((value) => ({
								id: value.id,
								value: value.value,
							})),
						})),
				}))
				.filter((group) => group.attributes.length > 0);

			return {
				data,
				totalGroups: data.length,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}
}
