import { Attribute } from '@/entities/attribute.entity';
import { Category } from '@/entities/category.entity';
import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { capitalizeStr } from '@/common/utils/capitalize-str.util';
import slugify from 'slugify';
import { AttributeValue } from '@/entities/attribute-value.entity';
import { AttributeCategory } from '@/entities/attribute-category.entity';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { EditAttributeDto } from './dto/edit-attribute.dto';
import { logHelper } from '@/common/utils/logger-helper.util';
import { UpdateAttributeStatusDto } from './dto/update-attribute-status.dto';
import { UpdateAttributesStatusDto } from './dto/update-attributes-status.dto';
import { CreateGroupAttributeDto } from './dto/create-group-attribute.dto';
import { AttributeGroup } from '@/entities/attribute-group.entity';
import { EditGroupAttributeDto } from './dto/edit-group-attribute.dto';
import { KibanaService } from '@/common/services/kibana/kibana.service';
import { UpdateAttributeGroupStatusDto } from './dto/update-attribute-group-status.dto';
import { UpdateAttributeGroupsStatusDto } from './dto/update-attribute-groups-status.dto';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { AttributeValidator } from './validators/attribute.validator';
import type {
	CreateAttributeRes,
	CreateGroupAttributeRes,
	GetAttributesRes,
	GetAttributesByCategoryRes,
	GetAttributeRes,
	GetAttributeGroupRes,
	GetAttributeValuesRes,
	CreateAttributeValueRes,
	DeleteAttributeValueRes,
	UpdateAttributeRes,
	UpdateAttributeGroupRes,
	GetCategoriesByAttributeGroupRes,
	GetAttributesGroupsRes,
	UpdateAttributeStatusRes,
	UpdateAttributesStatusRes,
	UpdateAttributeGroupStatusRes,
	UpdateAttributeGroupsStatusRes,
} from './interfaces/controller.interface';
import { rethrowAttributeUniqueViolation } from './utils/index-messages.util';
import { plainToInstance } from 'class-transformer';
import { FindAttributesQueryDto } from './dto/find-attributes.dto';
import { FindAttributesBuilder } from './builders/find-attributes.builder';
import { FindAttributesGroupsQueryDto } from './dto/find-attributes-groups.dto';
import { FindAttributesGroupsBuilder } from './builders/find-attributes-groups.builder';

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

	async createAttribute(dto: CreateAttributeDto, request: any): Promise<CreateAttributeRes> {
		try {
			dto = plainToInstance(CreateAttributeDto, dto);
			const groupExists = await this.attributeValidator.existsAttributeGroup(dto.attributeGroupId);
			if (!groupExists) {
				throw new NotFoundException('El grupo de atributos seleccionado no existe.');
			}

			const id = await this.dataSource.transaction(async (manager) => {
				const result = await manager
					.createQueryBuilder()
					.insert()
					.into(Attribute)
					.values({
						name: dto.name,
						unit: dto.unit,
						attributeGroupId: dto.attributeGroupId,
						description: dto.description,
						status: true,
					})
					.returning(['id'])
					.execute();

				const id: string | undefined = result.raw[0]?.id;

				if (!id) {
					throw new InternalServerErrorException('No se pudo registrar el atributo.');
				}

				const valuesResult = await manager
					.createQueryBuilder()
					.insert()
					.into(AttributeValue)
					.values(dto.values.map(({ value }) => ({ value, attributeId: id })))
					.returning(['id'])
					.execute();

				if (valuesResult.raw.length !== dto.values.length) {
					throw new InternalServerErrorException('No se pudieron registrar los valores del atributo.');
				}

				return id;
			});

			this.kibanaService.audit({
				action: 'createAttribute',
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
			rethrowAttributeUniqueViolation(err);
			throw err;
		}
	}

	async createGroupAttribute(dto: CreateGroupAttributeDto, request: any): Promise<CreateGroupAttributeRes> {
		try {
			dto = plainToInstance(CreateGroupAttributeDto, dto);
			const categoriesIds = [...new Set(dto.categories)];

			const id = await this.dataSource.transaction(async (manager) => {
				const result = await manager
					.createQueryBuilder()
					.insert()
					.into(AttributeGroup)
					.values({
						name: dto.name,
						description: dto.description,
						status: true,
					})
					.returning(['id'])
					.execute();

				const id: string | undefined = result.raw[0]?.id;
				if (!id) {
					throw new InternalServerErrorException('No se pudo registrar el grupo de atributos.');
				}

				const categoriesResult = await manager
					.createQueryBuilder()
					.insert()
					.into(AttributeCategory)
					.values(categoriesIds.map((categoryId) => ({ attributeGroupId: id, categoryId })))
					.returning(['id'])
					.execute();

				if (categoriesResult.raw.length !== categoriesIds.length) {
					throw new InternalServerErrorException('No se pudieron asociar las categorías al grupo.');
				}

				return id;
			});

			this.kibanaService.audit({
				action: 'createGroupAttribute',
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
			rethrowAttributeUniqueViolation(err);
			throw err;
		}
	}

	async getAttributes(id: string, query: FindAttributesQueryDto): Promise<GetAttributesRes> {
		try {
			const groupExists = await this.attributeGroupRepository.exists({ where: { id } });
			if (!groupExists) {
				throw new NotFoundException('No se encontró el grupo de atributos.');
			}

			const queryBuilder = this.attributeRepository
				.createQueryBuilder('attribute')
				.leftJoin('attribute.attributeValues', 'attributeValues')
				.select(['attribute.id', 'attribute.name', 'attribute.status', 'attribute.createdAt', 'attributeValues.id', 'attributeValues.value'])
				.where('attribute.attributeGroupId = :id', { id });

			FindAttributesBuilder.applyFilters(queryBuilder, query);

			const totalAttributes = await queryBuilder.clone().getCount();
			const totalPages = Math.ceil(totalAttributes / query.limit);
			const currentPage = totalPages === 0 ? 1 : Math.min(query.page, totalPages);
			const skip = (currentPage - 1) * query.limit;
			const attributes = await queryBuilder.skip(skip).take(query.limit).getMany();

			return {
				attributes: attributes.map((attribute) => ({
					id: attribute.id,
					name: attribute.name,
					status: attribute.status,
					valuesCount: attribute.attributeValues.length,
					attributeValues: attribute.attributeValues.map((value) => value.value),
				})),
				meta: {
					totalAttributes,
					totalPages,
					currentPage,
					limit: query.limit,
				},
				filters: {
					filter: query.filter,
					status: query.status,
					sort: query.sort,
				},
			};
		} catch (err: unknown) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async getCategoriesByAttributeGroup(id: string): Promise<GetCategoriesByAttributeGroupRes> {
		try {
			const attributeGroup = await this.attributeGroupRepository
				.createQueryBuilder('attributeGroup')
				.select(['attributeGroup.id', 'attributeGroup.name'])
				.where('attributeGroup.id = :id', { id })
				.getOne();

			if (!attributeGroup) {
				throw new NotFoundException('No se encontró el grupo de atributos.');
			}

			const categories = await this.attributeCategoryRepository
				.createQueryBuilder('attributeCategory')
				.innerJoin('attributeCategory.category', 'category')
				.select(['category.id AS id', 'category.name AS name'])
				.where('attributeCategory.attributeGroupId = :attributeGroupId', {
					attributeGroupId: id,
				})
				.orderBy('category.name', 'ASC')
				.addOrderBy('category.id', 'ASC')
				.getRawMany<Pick<Category, 'id' | 'name'>>();

			return {
				data: {
					attributeGroup,
					categories,
				},
				message: 'Registros obtenidos correctamente.',
			};
		} catch (err: unknown) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async getAttributesGroups(query: FindAttributesGroupsQueryDto): Promise<GetAttributesGroupsRes> {
		try {
			const queryBuilder = this.attributeGroupRepository
				.createQueryBuilder('attributeGroup')
				.leftJoin('attributeGroup.attributeCategories', 'attributeCategory')
				.leftJoin('attributeCategory.category', 'category')
				.select([
					'attributeGroup.id',
					'attributeGroup.name',
					'attributeGroup.description',
					'attributeGroup.status',
					'attributeGroup.createdAt',
					'attributeCategory.id',
					'category.id',
					'category.name',
				]);

			FindAttributesGroupsBuilder.applyFilters(queryBuilder, query);

			const totalAttributesGroups = await queryBuilder.clone().getCount();
			const totalPages = Math.ceil(totalAttributesGroups / query.limit);
			const currentPage = totalPages === 0 ? 1 : Math.min(query.page, totalPages);
			const skip = (currentPage - 1) * query.limit;
			const attributeGroups = await queryBuilder.skip(skip).take(query.limit).getMany();

			return {
				attributeGroups: attributeGroups.map((group) => ({
					id: group.id,
					name: group.name,
					description: group.description,
					status: group.status,
					createdAt: group.createdAt,
					categories: group.attributeCategories.map(({ category }) => ({ id: category.id, name: category.name })),
				})),
				meta: {
					totalAttributesGroups,
					totalPages,
					currentPage,
					limit: query.limit,
				},
				filters: {
					filter: query.filter,
					status: query.status,
					sort: query.sort,
					categories: query.categories,
				},
			};
		} catch (err: unknown) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async updateAttributeStatus(id: string, dto: UpdateAttributeStatusDto, request: any): Promise<UpdateAttributeStatusRes> {
		const result = await this.attributeRepository
			.createQueryBuilder()
			.update(Attribute)
			.set({ status: dto.status, statusAt: () => 'CURRENT_TIMESTAMP' })
			.where('id = :id', { id })
			.andWhere('status IS DISTINCT FROM :status', { status: dto.status })
			.returning(['id', 'status', 'name'])
			.execute();

		if (!result.affected) {
			const exists = await this.attributeRepository.exists({ where: { id } });
			if (!exists) {
				throw new NotFoundException('No se encontró el atributo.');
			}
			throw new BadRequestException(dto.status ? 'El atributo ya se encuentra activo.' : 'El atributo ya se encuentra inactivo.');
		}

		if (!result.raw?.length) {
			throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
		}
		const updatedAttribute = result.raw[0];

		this.kibanaService.audit({
			action: 'updateAttributeStatus',
			performedBy: request.user.id,
			targetId: id,
			requestBody: JSON.stringify(dto),
			response: JSON.stringify(updatedAttribute),
			requestId: request.requestId,
		});

		return { message: 'Registro actualizado correctamente.', data: updatedAttribute };
	}

	async updateAttributesStatus(dto: UpdateAttributesStatusDto, request: any): Promise<UpdateAttributesStatusRes> {
		const ids = [...new Set(dto.ids)];
		const result = await this.attributeRepository
			.createQueryBuilder()
			.update(Attribute)
			.set({ status: dto.status, statusAt: () => 'CURRENT_TIMESTAMP' })
			.where('id IN (:...ids)', { ids })
			.andWhere('status IS DISTINCT FROM :status', { status: dto.status })
			.returning(['id'])
			.execute();

		if (!result.affected) {
			const existingAttributes = await this.attributeRepository.count({ where: { id: In(ids) } });
			if (existingAttributes === 0) {
				throw new NotFoundException('No se encontraron atributos.');
			}
			throw new BadRequestException(dto.status ? 'Los atributos seleccionados ya se encuentran activos.' : 'Los atributos seleccionados ya se encuentran inactivos.');
		}

		if (!result.raw?.length) {
			throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
		}
		const updatedIds: string[] = result.raw.map((item: { id: string }) => item.id);

		this.kibanaService.audit({
			action: 'updateAttributesStatus',
			performedBy: request.user.id,
			targetId: updatedIds,
			requestBody: JSON.stringify(dto),
			response: JSON.stringify({ updatedIds, total: updatedIds.length }),
			requestId: request.requestId,
		});

		return { message: 'Registros actualizados correctamente.', data: updatedIds };
	}

	async updateAttributeGroupStatus(id: string, dto: UpdateAttributeGroupStatusDto, request: any): Promise<UpdateAttributeGroupStatusRes> {
		const result = await this.attributeGroupRepository
			.createQueryBuilder()
			.update(AttributeGroup)
			.set({ status: dto.status, statusAt: () => 'CURRENT_TIMESTAMP' })
			.where('id = :id', { id })
			.andWhere('status IS DISTINCT FROM :status', { status: dto.status })
			.returning(['id', 'status', 'name'])
			.execute();

		if (!result.affected) {
			const exists = await this.attributeGroupRepository.exists({ where: { id } });
			if (!exists) {
				throw new NotFoundException('No se encontró el grupo de atributos.');
			}
			throw new BadRequestException(dto.status ? 'El grupo de atributos ya se encuentra activo.' : 'El grupo de atributos ya se encuentra inactivo.');
		}

		if (!result.raw?.length) {
			throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
		}
		const updatedAttributeGroup = result.raw[0];

		this.kibanaService.audit({
			action: 'updateAttributeGroupStatus',
			performedBy: request.user.id,
			targetId: id,
			requestBody: JSON.stringify(dto),
			response: JSON.stringify(updatedAttributeGroup),
			requestId: request.requestId,
		});

		return { message: 'Registro actualizado correctamente.', data: updatedAttributeGroup };
	}

	async updateAttributeGroupsStatus(dto: UpdateAttributeGroupsStatusDto, request: any): Promise<UpdateAttributeGroupsStatusRes> {
		const ids = [...new Set(dto.ids)];
		const result = await this.attributeGroupRepository
			.createQueryBuilder()
			.update(AttributeGroup)
			.set({ status: dto.status, statusAt: () => 'CURRENT_TIMESTAMP' })
			.where('id IN (:...ids)', { ids })
			.andWhere('status IS DISTINCT FROM :status', { status: dto.status })
			.returning(['id'])
			.execute();

		if (!result.affected) {
			const existingAttributeGroups = await this.attributeGroupRepository.count({ where: { id: In(ids) } });
			if (existingAttributeGroups === 0) {
				throw new NotFoundException('No se encontraron grupos de atributos.');
			}
			throw new BadRequestException(dto.status ? 'Los grupos de atributos seleccionados ya se encuentran activos.' : 'Los grupos de atributos seleccionados ya se encuentran inactivos.');
		}

		if (!result.raw?.length) {
			throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
		}
		const updatedIds: string[] = result.raw.map((item: { id: string }) => item.id);

		this.kibanaService.audit({
			action: 'updateAttributeGroupsStatus',
			performedBy: request.user.id,
			targetId: updatedIds,
			requestBody: JSON.stringify(dto),
			response: JSON.stringify({ updatedIds, total: updatedIds.length }),
			requestId: request.requestId,
		});

		return { message: 'Registros actualizados correctamente.', data: updatedIds };
	}

	async getAttribute(id: string): Promise<GetAttributeRes> {
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

	async getAttributeGroup(id: string): Promise<GetAttributeGroupRes> {
		try {
			const attributeGroup = await this.attributeGroupRepository
				.createQueryBuilder('attributeGroup')
				.select([
					'attributeGroup.id',
					'attributeGroup.name',
					'attributeGroup.description',
					'attributeGroup.createdAt',
					'attributeGroup.updatedAt',
					'attributeGroup.statusAt',
				])
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

	async getAttributeValues(id: string): Promise<GetAttributeValuesRes> {
		try {
			const exists = await this.attributeRepository.exists({
				where: { id },
			});

			if (!exists) {
				throw new NotFoundException('No se encontró el atributo.');
			}

			const attributeValues = await this.attributeValuesRepository
				.createQueryBuilder('attributeValue')
				.select(['attributeValue.id', 'attributeValue.value'])
				.where('attributeValue.attributeId = :id', { id })
				.orderBy('attributeValue.value', 'ASC')
				.addOrderBy('attributeValue.id', 'ASC')
				.getMany();

			return {
				data: attributeValues,
				message: 'Registros obtenidos correctamente.',
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async createAttributeValue(dto: CreateAttributeValueDto, request: any): Promise<CreateAttributeValueRes> {
		try {
			dto = plainToInstance(CreateAttributeValueDto, dto);
			const existsAttribute = await this.attributeRepository.exists({
				where: {
					id: dto.attributeId,
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
					attributeId: dto.attributeId,
					value: dto.value,
				})
				.returning(['id', 'value', 'status', 'attributeId'])
				.execute();

			const response: CreateAttributeValueRes['data'] | undefined = result.raw?.[0];

			if (!response?.id) {
				throw new InternalServerErrorException('No se pudo registrar el valor.');
			}

			this.kibanaService.audit({
				action: 'createAttributeValue',
				performedBy: request.user.id,
				targetId: response.id,
				requestBody: JSON.stringify(dto),
				response: JSON.stringify(response),
				requestId: request.requestId,
			});

			return {
				message: 'Registro creado correctamente.',
				data: response,
			};
		} catch (err: unknown) {
			rethrowAttributeUniqueViolation(err);
			throw err;
		}
	}

	async updateAttribute(id: string, dto: EditAttributeDto, request: any): Promise<UpdateAttributeRes> {
		try {
			dto = plainToInstance(EditAttributeDto, dto);
			const exists = await this.attributeRepository.exists({
				where: { id },
			});

			if (!exists) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const payload = {
				name: dto.name,
				unit: dto.unit,
				description: dto.description,
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

			const updatedAttribute: UpdateAttributeRes['data'] = result.raw[0];

			this.kibanaService.audit({
				action: 'updateAttribute',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify(dto),
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
		} catch (err: unknown) {
			rethrowAttributeUniqueViolation(err);
			throw err;
		}
	}

	async deleteAttributeValue(id: string, request: any): Promise<DeleteAttributeValueRes> {
		try {
			const result = await this.attributeValuesRepository.delete(id);

			if (!result.affected) {
				throw new NotFoundException('No se encontró el valor del atributo.');
			}

			this.kibanaService.audit({
				action: 'deleteAttributeValue',
				performedBy: request.user.id,
				targetId: id,
				requestId: request.requestId,
			});

			return {
				data: true,
				message: 'Registro eliminado correctamente.',
			};
		} catch (err: unknown) {
			const databaseError = (err as { driverError?: { code?: string }; code?: string })?.driverError ?? err;
			if ((databaseError as { code?: string })?.code === '23503') {
				throw new ConflictException('No se puede eliminar el valor porque está asociado a productos.');
			}
			throw err;
		}
	}

	async updateAttributeGroup(id: string, dto: EditGroupAttributeDto, request: any): Promise<UpdateAttributeGroupRes> {
		try {
			dto = plainToInstance(EditGroupAttributeDto, dto);
			const exists = await this.attributeGroupRepository.exists({
				where: { id },
			});

			if (!exists) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const categoriesIds = [...new Set(dto.categories)];

			const attributeGroup = await this.dataSource.transaction(async (manager) => {
				const attributeGroupRepository = manager.getRepository(AttributeGroup);
				const attributeCategoryRepository = manager.getRepository(AttributeCategory);

				const result = await attributeGroupRepository
					.createQueryBuilder()
					.update(AttributeGroup)
					.set({ name: dto.name, description: dto.description })
					.where('id = :id', { id })
					.returning(['id'])
					.execute();

				if (!result.affected) {
					throw new NotFoundException('No se encontró el registro.');
				}

				if (!result.raw?.[0]?.id) {
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
				action: 'updateAttributeGroup',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify(dto),
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
		} catch (err: unknown) {
			rethrowAttributeUniqueViolation(err);
			throw err;
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

	async getAttributesByCategory(id: string): Promise<GetAttributesByCategoryRes> {
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
				.addOrderBy('attributeGroup.id', 'ASC')
				.addOrderBy('attribute.name', 'ASC')
				.addOrderBy('attribute.id', 'ASC')
				.addOrderBy('attributeValue.value', 'ASC')
				.addOrderBy('attributeValue.id', 'ASC')
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
				message: 'Registros obtenidos correctamente.',
			};
		} catch (err: unknown) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}
}
