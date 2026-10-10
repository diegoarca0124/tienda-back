import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	ServiceUnavailableException,
	UnauthorizedException,
} from '@nestjs/common';
import { CreateCollaboratorDto } from './dto/create-collaborator.dto';
import { hashPassword } from '@/common/utils/hash.util';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Collaborator } from '@/entities/collaborator.entity';
import { In, QueryFailedError, Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { EditCollaboratorDto } from './dto/edit-collaborator.dto';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { ExportCollaboratorsDto } from './dto/export-colllaborators.dto';
import { ImportCollaboratorsDto } from './dto/import-collaborators.dto';
import { AuthService } from '@/auth/auth.service';
import { KibanaService } from '@/common/services/kibana/kibana.service';
import { FindCollaboratorsBuilder } from './builders/find-collaborators.builder';
import { FindCollaboratorsQueryDto } from './dto/find-collaborators.dto';
import { UpdateCollaboratorStatusDto } from './dto/update-collaborator-status.dto';
import { UpdateCollaboratorsStatusDto } from './dto/update-collaborators-status.dto';
import { ALLOWED_EXPORT } from './constants/allowed-export.constant';
import { exportCollaboratorsFile } from './utils/export-collaborators-file.util';
import { rethrowCollaboratorUniqueViolation } from './utils/index-messages.util';
import {
	CreateCollaboratorRes,
	ExportCollaboratorsRes,
	GetCollaboratorRes,
	GetCollaboratorsRes,
	ImportCollaboratorsRes,
	LoginRes,
	RevokeCollaboratorSessionsRes,
	UpdateCollaboratorRes,
	UpdateCollaboratorsStatusRes,
	UpdateCollaboratorStatusRes,
	ValidateTokenRes,
} from './interface/controller.interface';

dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

@Injectable()
export class CollaboratorService {
	constructor(
		@InjectRepository(Collaborator) private collaboratorRepository: Repository<Collaborator>,
		private authService: AuthService,
		private kibanaService: KibanaService
	) {}

	async createCollaborator(dto: CreateCollaboratorDto, request: any): Promise<CreateCollaboratorRes> {
		try {
			const result = await this.collaboratorRepository
				.createQueryBuilder()
				.insert()
				.into(Collaborator)
				.values({
					...dto,
					fullnames: `${dto.names} ${dto.surname}`,
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
		} catch (err: unknown) {
			rethrowCollaboratorUniqueViolation(err);
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async login(loginDto: LoginDto): Promise<LoginRes> {
		try {
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
				throw new UnauthorizedException('Correo o contraseña incorrectos');
			}

			if (!collaborator.status) {
				throw new ForbiddenException('Tu cuenta se encuentra inactiva.');
			}

			const isValidPassword = await bcrypt.compare(password, collaborator.password);

			if (!isValidPassword) {
				throw new UnauthorizedException('Correo o contraseña incorrecto.');
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
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async validateToken(id: string): Promise<ValidateTokenRes> {
		const isActive = await this.collaboratorRepository.exists({ where: { id, status: true } });
		if (!isActive) {
			throw new UnauthorizedException('Tu cuenta no está disponible. Inicia sesión nuevamente.');
		}

		return { valid: true, message: 'Sesión válida.' };
	}

	async getCollaborators(query: FindCollaboratorsQueryDto): Promise<GetCollaboratorsRes> {
		try {
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

			FindCollaboratorsBuilder.applyFilters(queryBuilder, query);

			const totalCollaborators = await queryBuilder.clone().getCount();
			const totalPages = Math.ceil(totalCollaborators / query.limit);
			const currentPage = totalPages === 0 ? 1 : Math.min(query.page, totalPages);
			const skip = (currentPage - 1) * query.limit;
			const collaborators = await queryBuilder.skip(skip).take(query.limit).getMany();

			return {
				collaborators,
				meta: {
					totalCollaborators,
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

	async getCollaborator(id: string): Promise<GetCollaboratorRes> {
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
					'collaborator.status',
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

	async updateCollaborator(id: string, dto: EditCollaboratorDto, request: any): Promise<UpdateCollaboratorRes> {
		const exists = await this.collaboratorRepository.exists({
			where: { id },
		});

		if (!exists) {
			throw new NotFoundException('No se encontró el registro.');
		}

		const passwordChanged = Boolean(dto.password);
		if (passwordChanged && process.env.TOKEN_REVOCATION !== 'true') {
			throw new ServiceUnavailableException('No se puede cambiar la contraseña porque la revocación de sesiones no está habilitada.');
		}

		const updateData = {
			...dto,
			fullnames: `${dto.names} ${dto.surname}`,
			updatedAt: () => 'CURRENT_TIMESTAMP',
		};

		if (dto.password) {
			updateData.password = await hashPassword(dto.password);
		} else {
			delete updateData.password;
		}

		let result;
		try {
			result = await this.collaboratorRepository
				.createQueryBuilder()
				.update(Collaborator)
				.set(updateData)
				.where('id = :id', { id })
				.returning(['id', 'names', 'surname', 'email', 'phone', 'role', 'type_document', 'number_document', 'prefix', 'status', 'createdAt', 'statusAt', 'updatedAt'])
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

			if (passwordChanged) {
				try {
					await this.authService.revokeUserTokens(id);
				} catch {
					throw new ServiceUnavailableException('La contraseña se actualizó, pero no se pudieron cerrar las sesiones. Reintenta desde "Cerrar sesiones".');
				}
			}

			return {
				message: 'Registro actualizado correctamente.',
				data: result.raw[0],
			};
		} catch (err: any) {
			rethrowCollaboratorUniqueViolation(err);
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async updateCollaboratorStatus(id: string, dto: UpdateCollaboratorStatusDto, request: any): Promise<UpdateCollaboratorStatusRes> {
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
				.andWhere('status IS DISTINCT FROM :status', {
					status: dto.status,
				})
				.returning(['id', 'status', 'statusAt', 'names'])
				.execute();

			if (result.affected && !result.raw?.length) {
				throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			}

			const updatedCollaborator = result.affected
				? result.raw[0]
				: await this.collaboratorRepository.findOne({
						select: { id: true, status: true, statusAt: true, names: true },
						where: { id },
					});

			if (!updatedCollaborator) {
				throw new NotFoundException('No se encontró el colaborador.');
			}
			if (updatedCollaborator.status !== dto.status) {
				throw new ConflictException('El estado del colaborador cambió durante la operación. Intenta nuevamente.');
			}

			if (!dto.status) {
				await this.revokeInactiveCollaboratorSessions([id]);
			}

			this.kibanaService.audit({
				action: 'updateCollaboratorStatus',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify(dto),
				response: JSON.stringify(updatedCollaborator),
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

	async updateCollaboratorsStatus(dto: UpdateCollaboratorsStatusDto, request: any): Promise<UpdateCollaboratorsStatusRes> {
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
				.andWhere('status IS DISTINCT FROM :status', {
					status: dto.status,
				})
				.returning(['id'])
				.execute();

			if (result.affected && !result.raw?.length) {
				throw new InternalServerErrorException('No se pudo recuperar el registro actualizado.');
			}

			const collaborators = await this.collaboratorRepository.find({
				select: { id: true, status: true },
				where: { id: In(ids) },
			});
			if (!collaborators.length) {
				throw new NotFoundException('No se encontraron colaboradores.');
			}
			if (collaborators.some((collaborator) => collaborator.status !== dto.status)) {
				throw new ConflictException('El estado de un colaborador cambió durante la operación. Intenta nuevamente.');
			}
			const updatedIds = collaborators.map((collaborator) => collaborator.id);

			if (!dto.status) {
				await this.revokeInactiveCollaboratorSessions(updatedIds);
			}

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

	async revokeCollaboratorSessions(id: string, request: any): Promise<RevokeCollaboratorSessionsRes> {
		const exists = await this.collaboratorRepository.exists({ where: { id } });
		if (!exists) {
			throw new NotFoundException('No se encontró el colaborador.');
		}
		if (process.env.TOKEN_REVOCATION !== 'true') {
			throw new ServiceUnavailableException('La revocación de sesiones no está habilitada.');
		}

		let revokedSessions: number;
		try {
			revokedSessions = await this.authService.revokeUserTokens(id);
		} catch {
			throw new ServiceUnavailableException('No se pudo completar el cierre de las sesiones.');
		}

		const data = { id, revokedSessions };
		this.kibanaService.audit({
			action: 'revokeCollaboratorSessions',
			performedBy: request.user.id,
			targetId: id,
			requestBody: JSON.stringify({ id }),
			response: JSON.stringify(data),
			requestId: request.requestId,
		});

		return {
			message: revokedSessions > 0 ? 'Sesiones cerradas correctamente.' : 'No se encontraron sesiones registradas para cerrar.',
			data,
		};
	}

	async exportCollaborators(dto: ExportCollaboratorsDto, request: any): Promise<ExportCollaboratorsRes> {
		let exportedFile: ExportCollaboratorsRes | undefined;
		try {
			const allowedFields = new Set(ALLOWED_EXPORT);
			const fields = [...new Set(dto.data.filter(({ checked, field }) => checked && allowedFields.has(field)).map(({ field }) => field))];

			if (!fields.length) throw new BadRequestException('Debe seleccionar al menos un campo válido para exportar.');

			const { scope, ids = [], sort, maskData } = dto;
			if (dto.format !== 'xlsx' && dto.format !== 'csv') throw new BadRequestException('El formato debe ser xlsx o csv.');
			const requiresIds = scope === 'selected' || scope === 'page';

			if (requiresIds && !ids.length) throw new BadRequestException('Debe seleccionar al menos un colaborador para exportar.');

			const queryBuilder = this.collaboratorRepository.createQueryBuilder('collaborator').select(fields.map((field) => `collaborator.${field}`));

			if (requiresIds) queryBuilder.andWhere('collaborator.id IN (:...ids)', { ids: [...new Set(ids)] });

			const fieldMap = {
				names: 'collaborator.names',
				email: 'collaborator.email',
				number_document: 'collaborator.number_document',
			} as const;

			if (sort?.trim() && sort !== 'Predeterminado') {
				const [field, rawDirection] = sort.split(':');
				const direction = rawDirection?.toUpperCase();

				if (!Object.prototype.hasOwnProperty.call(fieldMap, field)) throw new BadRequestException('El campo de ordenamiento es inválido.');
				if (direction !== 'ASC' && direction !== 'DESC') throw new BadRequestException('La dirección de ordenamiento es inválida.');

				queryBuilder.orderBy(fieldMap[field as keyof typeof fieldMap], direction);
			} else {
				queryBuilder.orderBy('collaborator.createdAt', 'DESC');
			}

			queryBuilder.addOrderBy('collaborator.id', 'ASC');
			const dateFormatter = new Intl.DateTimeFormat('es-PE', {
				timeZone: 'America/Lima',
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hourCycle: 'h23',
			});
			let exportedRecords = 0;
			const service = this;
			// Una misma instantánea evita saltos o duplicados si cambian datos entre lotes.
			exportedFile = await this.collaboratorRepository.manager.transaction('REPEATABLE READ', async (manager) => {
				async function* rows(): AsyncGenerator<unknown[]> {
					const batchSize = 500;
					for (let offset = 0; ; offset += batchSize) {
						const collaborators = await queryBuilder.clone().setQueryRunner(manager.queryRunner!).offset(offset).limit(batchSize).getMany();
						if (!collaborators.length) {
							if (!exportedRecords) throw new NotFoundException('No se encontraron colaboradores para exportar.');
							break;
						}
						for (const collaborator of collaborators) {
							exportedRecords++;
							yield fields.map((field) => {
								let value = collaborator[field];
								if (value instanceof Date) value = dateFormatter.format(value);
								if (typeof value === 'boolean' && field === 'status') value = value ? 'ACTIVO' : 'INACTIVO';
								if (maskData && typeof value === 'string' && field === 'email') value = service.maskEmail(value);
								if (maskData && typeof value === 'string' && field === 'number_document') value = service.maskDocument(value);
								return value ?? '';
							});
						}
						if (collaborators.length < batchSize) break;
					}
				}
				exportedFile = await exportCollaboratorsFile(fields, dto.format as 'xlsx' | 'csv', rows());
				return exportedFile;
			});

			await this.kibanaService.audit({
				action: 'exportCollaborators',
				performedBy: request.user.id,
				targetId: '',
				requestBody: JSON.stringify(dto),
				response: JSON.stringify({ exportedRecords }),
				requestId: request.requestId,
			});

			return exportedFile;
		} catch (err: any) {
			await exportedFile?.cleanup();
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async importCollaborators(dto: ImportCollaboratorsDto, request: any): Promise<ImportCollaboratorsRes> {
		try {
			const { data, mode, identifyBy } = dto;
			const defaultPassword = await hashPassword('123456');
			const cleanData: Record<string, any>[] = data.map((row) => {
				const { index, ...item } = row as Record<string, any> & { index?: unknown };
				return {
					...item,
					fullnames: `${item.names} ${item.surname}`,
					password: defaultPassword,
				};
			});
			const identifyValues = cleanData.map((item) => item[identifyBy]).filter(Boolean);
			const existingCollaborators = await this.collaboratorRepository.find({
				where: {
					[identifyBy]: In(identifyValues),
				},
			});
			const existingMap = new Map(existingCollaborators.map((item) => [item[identifyBy], item]));
			const toCreate: Array<any> = [];
			const toUpdate: Collaborator[] = [];
			const inactiveCollaboratorIds = new Set<string>();
			for (const item of cleanData) {
				const identifyValue = item[identifyBy];
				const existing = existingMap.get(identifyValue);
				if (mode === 'news') {
					if (!existing) {
						toCreate.push(this.collaboratorRepository.create(item));
					}
				}
				if (mode === 'update' || mode === 'upsert') {
					if (existing) {
						const { password, ...updateData } = item;
						if (existing.status !== updateData.status) {
							existing.statusAt = new Date();
						}
						Object.assign(existing, updateData);
						toUpdate.push(existing);
						if (existing.status === false) {
							inactiveCollaboratorIds.add(existing.id);
						}
					} else if (mode === 'upsert') {
						toCreate.push(this.collaboratorRepository.create(item));
					}
				}
			}

			if (toCreate.length > 0 || toUpdate.length > 0) {
				await this.collaboratorRepository.manager.transaction(async (manager) => {
					if (toCreate.length > 0) {
						await manager.save(Collaborator, toCreate);
					}
					if (toUpdate.length > 0) {
						await manager.save(Collaborator, toUpdate);
					}
				});
			}
			await this.revokeInactiveCollaboratorSessions([...inactiveCollaboratorIds]);

			this.kibanaService.audit({
				action: 'importCollaborators',
				performedBy: request.user.id,
				targetId: '',
				requestBody: JSON.stringify({
					mode,
					identifyBy,
					total: cleanData.length,
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
			rethrowCollaboratorUniqueViolation(err);
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	private async revokeInactiveCollaboratorSessions(ids: string[]): Promise<void> {
		if (!ids.length || process.env.TOKEN_REVOCATION !== 'true') return;

		const results = await Promise.allSettled(ids.map((id) => this.authService.revokeUserTokens(id)));
		if (results.some((result) => result.status === 'rejected')) {
			throw new ServiceUnavailableException('Las cuentas quedaron inactivas, pero no se pudo completar el cierre de sus sesiones. Reintenta la desactivación.');
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
