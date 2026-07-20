import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { CreateCollaboratorDto } from './dto/create-collaborator.dto';
import { hashPassword } from '@/common/utils/hash.util';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Collaborator } from '@/entities/collaborator.entity';
import { In, Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { EditCollaboratorDto } from './dto/edit-collaborator.dto';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { ExportCollaboratorsDto } from './dto/export-colllaborators.dto';
import { ImportCollaboratorsDto } from './dto/import-collaborators.dto';
import { AuthService } from '@/auth/auth.service';
import { KibanaService } from '@/common/services/kibana/kibana.service';
import { FindCollaboratorBuilder } from './builders/find-collaborators.builder';
import { FindCollaboratorsQueryDto } from './dto/find-collaborators.dto';
import { UpdateCollaboratorStatusDto } from './dto/update-collaborator-status.dto';
import { UpdateCollaboratorsStatusDto } from './dto/update-collaborators-status.dto';
import { ALLOWED_EXPORT } from './constants/allowed-export.constant';

dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

@Injectable()
export class CollaboratorService {
	constructor(
		@InjectRepository(Collaborator) private collaboratorRepository: Repository<Collaborator>,
		private authService: AuthService,
		private kibanaService: KibanaService
	) {}

	async createCollaborator(dto: CreateCollaboratorDto, request: any) {
		try {
			const result = await this.collaboratorRepository
				.createQueryBuilder()
				.insert()
				.into(Collaborator)
				.values({
					...dto,
					password: await hashPassword(dto.password),
				})
				.returning(['id'])
				.execute();

			const id = result.raw[0]?.id;

			if (!id) {
				throw new InternalServerErrorException('No se pudo registrar el colaborador.');
			}

			const { password, ...safeData } = dto;

			this.kibanaService.audit({
				action: 'createCollaborator',
				performedBy: request.user.id,
				targetId: '',
				requestBody: JSON.stringify(safeData),
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

	async login(loginDto: LoginDto) {
		const { email, password } = loginDto;

		const collaborator = await this.collaboratorRepository.findOne({
			select: {
				id: true,
				names: true,
				surname: true,
				email: true,
				password: true,
				role: true,
				status: true,
			},
			where: { email },
		});

		if (!collaborator) {
			throw new UnauthorizedException('Correo o contraseña incorrectos.');
		}

		if (!collaborator.status) {
			throw new ForbiddenException('Tu cuenta se encuentra inactivas.');
		}

		const isValidPassword = await bcrypt.compare(password, collaborator.password);

		if (!isValidPassword) {
			throw new UnauthorizedException('Correo o contraseña incorrectos.');
		}

		const accessToken = await this.authService.generateToken(collaborator);

		void this.collaboratorRepository
			.createQueryBuilder()
			.update(Collaborator)
			.set({
				lastDatelogin: new Date(),
			})
			.where('id = :id', { id: collaborator.id })
			.execute()
			.catch(() => {});

		return {
			message: 'Inicio de sesión realizado correctamente.',
			data: {
				accessToken,
				collaborator: {
					id: collaborator.id,
					names: collaborator.names,
					surname: collaborator.surname,
					email: collaborator.email,
					role: collaborator.role,
				},
			},
		};
	}

	async getCollaborators(query: FindCollaboratorsQueryDto) {
		try {
			const skip = (query.page - 1) * query.limit;

			const queryBuilder = this.collaboratorRepository
			.createQueryBuilder('collaborator')
			.select([
				'collaborator.id',
				'collaborator.names',
				'collaborator.surname',
				'collaborator.email',
				'collaborator.fullnames',
				'collaborator.status',
				'collaborator.number_document',
				'collaborator.type_document',
				'collaborator.prefix',
				'collaborator.phone',
				'collaborator.role',
				'collaborator.createdAt',
			]);

			FindCollaboratorBuilder.applyFilters(
				queryBuilder, query
			);

			const [collaborators, totalCollaborators] = await queryBuilder
			.skip(skip)
			.take(query.limit)
			.getManyAndCount();

			return {
				collaborators,
				meta: {
					totalCollaborators,
					totalPages: Math.ceil(totalCollaborators / query.limit),
					currentPage: query.page,
					limit: query.limit,
				},
				filters: {
					filter: query.filter,
					status: query.status,
					sort: query.sort,
				}
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async getCollaborator(id: string) {
		try {
			const collaborator = await this.collaboratorRepository
				.createQueryBuilder('collaborator')
				.select([
					'collaborator.id',
					'collaborator.names',
					'collaborator.surname',
					'collaborator.email',
					'collaborator.phone',
					'collaborator.role',
					'collaborator.type_document',
					'collaborator.number_document',
					'collaborator.prefix',
					'collaborator.createdAt',
					'collaborator.updatedAt',
					'collaborator.statusAt',
				])
				.where('collaborator.id = :id', { id })
				.getOne();

			if (!collaborator) {
				throw new NotFoundException('No se encontró el registro.');
			}

			return {
				data: collaborator,
				message: 'Registro obtenido correctamente.',
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async updateCollaborator(id: string, dto: EditCollaboratorDto, request: any) {
		const exists = await this.collaboratorRepository.exists({
			where: { id },
		});

		if (!exists) {
			throw new NotFoundException('No se encontró el registro.');
		}

		const updateData = {
			...dto,
			updatedAt: () => 'CURRENT_TIMESTAMP',
		};

		if (updateData.password) {
			updateData.password = await hashPassword(updateData.password);
		}else{
			updateData.password = await hashPassword('123456');
		}
		
		let result;
		try {
			result = await this.collaboratorRepository
				.createQueryBuilder()
				.update(Collaborator)
				.set(updateData)
				.where('id = :id', { id })
				.returning([
					'id',
					'names',
					'surname',
					'email',
					'phone',
					'role',
					'type_document',
					'number_document',
					'prefix',
					'createdAt',
					'statusAt',
					'updatedAt',
				])
				.execute();

			if (!result.affected) {
				throw new InternalServerErrorException('No se pudo actualizar el registro.');
			}

			if (!result.raw?.length) {
				throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			}

			const { password, ...safeData } = dto;
			
			this.kibanaService.audit({
				action: 'updateCollaborator',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify(safeData),
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

	async updateCollaboratorStatus(id: string, dto: UpdateCollaboratorStatusDto, request: any) {
		try {
			const exists = await this.collaboratorRepository.exists({ where: { id } });

			if (!exists) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const result = await this.collaboratorRepository
				.createQueryBuilder()
				.update(Collaborator)
				.set({
					status: dto.status,
					statusAt: () => 'CURRENT_TIMESTAMP',
				})
				.where('id = :id', { id })
				.returning(['id', 'status', 'names'])
				.execute();

			if (!result.affected) {
				throw new InternalServerErrorException('No se pudo actualizar el registro.');
			}

			if (!result.raw?.length) {
				throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			}

			const updatedCollaborator = result.raw[0];

			this.kibanaService.audit({
				action: 'updateCollaboratorStatus',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify(dto),
				response: JSON.stringify(result.raw[0]),
				requestId: request.requestId,
			});
			return {
				message: 'Registro actualizado correctamente.',
				data: updatedCollaborator,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async updateCollaboratorsStatus(dto: UpdateCollaboratorsStatusDto, request: any) {
		try {
			const ids = [...new Set(dto.ids)];

			if (!ids.length) {
				throw new BadRequestException('Debe seleccionar al menos un registro.');
			}

			const result = await this.collaboratorRepository
				.createQueryBuilder()
				.update(Collaborator)
				.set({
					status: dto.status,
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
				action: 'updateCollaboratorsStatus',
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
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async exportCollaborators(dto: ExportCollaboratorsDto, request: any) {
		const allowedFields = new Set(ALLOWED_EXPORT);
		const fields = dto.data.filter(({ checked, field }) => checked && allowedFields.has(field)).map(({ field }) => field);

		if (!fields.length) throw new BadRequestException('Debe seleccionar al menos un campo válido para exportar.');

		const { scope, ids = [], sort, maskData } = dto;
		const requiresIds = scope === 'selected' || scope === 'page';

		if (requiresIds && !ids.length) throw new BadRequestException('Debe seleccionar al menos un colaborador para exportar.');

		const queryBuilder = this.collaboratorRepository.createQueryBuilder('collaborator');

		if (requiresIds) queryBuilder.andWhere('collaborator.id IN (:...ids)', { ids: [...new Set(ids)] });

		const fieldMap = {
			names: 'collaborator.names',
			email: 'collaborator.email',
			number_document: 'collaborator.number_document',
		} as const;

		if (sort?.trim() && sort !== 'Predeterminado') {
			const [field, rawDirection] = sort.split(':');
			const direction = rawDirection?.toUpperCase();

			if (!(field in fieldMap)) throw new BadRequestException('El campo de ordenamiento es inválido.');
			if (direction !== 'ASC' && direction !== 'DESC') throw new BadRequestException('La dirección de ordenamiento es inválida.');

			queryBuilder.orderBy(fieldMap[field as keyof typeof fieldMap], direction);
		} else {
			queryBuilder.orderBy('collaborator.createdAt', 'DESC');
		}

		let collaborators: Collaborator[];

		try {
			collaborators = await queryBuilder.getMany();
		} catch {
			throw new InternalServerErrorException('No fue posible obtener la información para la exportación.');
		}

		if (!collaborators.length) throw new NotFoundException('No se encontraron colaboradores para exportar.');

		const data = collaborators.map((collaborator) => {
			const row: Record<string, unknown> = {};

			for (const field of fields) {
				let value = collaborator[field];

				if (value instanceof Date) value = value.toISOString().slice(0, 10);
				if (maskData && typeof value === 'string' && field === 'email') value = this.maskEmail(value);
				if (maskData && typeof value === 'string' && field === 'number_document') value = this.maskDocument(value);

				row[field] = value ?? '';
			}

			return row;
		});

		await this.kibanaService.audit({
			action: 'exportCollaborators',
			performedBy: request.user.id,
			targetId: '',
			requestBody: JSON.stringify(dto),
			response: JSON.stringify({ exportedRecords: data.length }),
			requestId: request.requestId,
		});

		return { fields, data };
	}

	async importCollaborators(dto: ImportCollaboratorsDto, request: any) {
		try {
			const { data, mode, identifyBy } = dto;
			const defaultPassword = await hashPassword('123456');
			const cleanData = await Promise.all(
				data.map(async ({ index, ...item }) => ({
					...item,
					password: defaultPassword,
				}))
			);
			const identifyValues = cleanData.map((item) => item[identifyBy]).filter(Boolean);
			const existingCollaborators = await this.collaboratorRepository.find({
				where: {
					[identifyBy]: In(identifyValues),
				},
			});
			const existingMap = new Map(existingCollaborators.map((item) => [item[identifyBy], item]));
			const toCreate: Array<any> = [];
			const toUpdate: Array<any> = [];
			for (const item of cleanData) {
				const identifyValue = item[identifyBy];
				const existing = existingMap.get(identifyValue);
				if (mode === 'news') {
					if (!existing) {
						toCreate.push(this.collaboratorRepository.create(item));
					}
				}
				if (mode === 'update') {
					if (existing) {
						const { password, ...updateData } = item;
						Object.assign(existing, updateData);
						toUpdate.push(existing);
					}
				}
				if (mode === 'upsert') {
					if (existing) {
						Object.assign(existing, item);
						toUpdate.push(existing);
					} else {
						toCreate.push(this.collaboratorRepository.create(item));
					}
				}
			}

			if (toCreate.length > 0) {
				await this.collaboratorRepository.save(toCreate);
			}
			if (toUpdate.length > 0) {
				await this.collaboratorRepository.save(toUpdate);
			}

			this.kibanaService.audit({
				action: 'importCollaborators',
				performedBy: request.user.id,
				targetId: '',
				requestBody: JSON.stringify({
					mode,
					identifyBy,
					total: cleanData.length
				}),
				response: JSON.stringify({ import: true }),
				requestId: request.requestId,
			});

			return {
				message: 'Importación realizada correctamente',
				created: toCreate.length,
				updated: toUpdate.length,
				ignored: cleanData.length - (toCreate.length + toUpdate.length),
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	private maskEmail(email: string) {
		if (!email) return '';
		const [name, domain] = email.split('@');
		return name.slice(0, 2) + '***@' + domain;
	}

	private maskDocument(doc: string) {
		if (!doc) return '';
		return '****' + doc.slice(-4);
	}
}
