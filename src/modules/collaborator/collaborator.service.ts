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
import { UpdateStatusCollaboratorsDto } from './dto/update-status-collaborators.dto';
import { ExportCollaboratorsDto } from './dto/export-colllaborators.dto';
import { ValidateImportCollaboratorsDto } from './dto/validate-import-collaborators.dto';
import { AuthService } from '@/auth/auth.service';
import { KibanaService } from '@/common/services/kibana/kibana.service';
import { getPagination } from '@/common/utils/get-pagination.util';
import { ALLOWED_EXPORT } from './constants/allowed-export.contant';

dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

@Injectable()
export class CollaboratorService {
	constructor(
		@InjectRepository(Collaborator) private collaboratorRepository: Repository<Collaborator>,
		private authService: AuthService,
		private kibanaService: KibanaService
	) {}

	async create_collaborator(createCollaboratorDto: CreateCollaboratorDto, request: any) {
		try {
			const result = await this.collaboratorRepository
				.createQueryBuilder()
				.insert()
				.into(Collaborator)
				.values({
					...createCollaboratorDto,
					password: await hashPassword(createCollaboratorDto.password),
				})
				.returning(['id'])
				.execute();

			const id = result.raw[0]?.id;

			if (!id) {
				throw new InternalServerErrorException('No se pudo registrar el colaborador.');
			}

			this.kibanaService.audit({
				action: 'create_collaborator',
				performedBy: request.user.id,
				targetId: '',
				requestBody: JSON.stringify(createCollaboratorDto),
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

	async get_collaborators(query: { filter: string; page: number; limit: number; status?: string; sort?: string }) {
		try {
			const pagination = getPagination(query.page, query.limit);
			const queryBuilder = this.collaboratorRepository.createQueryBuilder('collaborator');

			if (query.filter?.trim()) {
				const searchTerms = query
					.filter!.trim()
					.split(/\s+/)
					.slice(0, 5)
					.map((t) => t.toLowerCase());

				const columns = ['collaborator.fullnames', 'collaborator.number_document', 'collaborator.email', 'collaborator.phone', 'collaborator.names'];

				searchTerms.forEach((term, idx) => {
					const conditions = columns.map((c) => `${c} ILIKE :term${idx}`).join(' OR ');
					const params = { [`term${idx}`]: `%${term}%` };

					idx === 0 ? queryBuilder.where(`(${conditions})`, params) : queryBuilder.andWhere(`(${conditions})`, params);
				});
			}

			if (query.status && query.status !== 'Todos') {
				const statusBool = query.status === 'Activos';
				queryBuilder.andWhere('collaborator.status = :status', {
					status: statusBool,
				});
			}

			// ORDENAMIENTO
			if (query.sort?.trim() && query.sort !== 'Predeterminado') {
				const [field, direction] = query.sort.split(':');

				if (!field || !direction) {
					queryBuilder.orderBy('collaborator.createdAt', 'DESC');
				} else {
					const fieldMap: Record<string, string> = {
						name: 'collaborator.names',
						email: 'collaborator.email',
						number_document: 'collaborator.number_document',
					};

					const allowedDirections = ['asc', 'desc'];

					if (
						fieldMap[field] &&
						allowedDirections.includes(direction.toLowerCase())
					) {
						queryBuilder.orderBy(
							fieldMap[field],
							direction.toUpperCase() as 'ASC' | 'DESC',
						);
					} else {
						queryBuilder.orderBy('collaborator.createdAt', 'DESC');
					}
				}
			} else {
				queryBuilder.orderBy('collaborator.createdAt', 'DESC');
			}

			const [collaborators, totalCollaborators] = await queryBuilder
			.skip(pagination.skip)
			.take(pagination.limit)
			.getManyAndCount();

			if (
				collaborators.length === 0 &&
				totalCollaborators > 0 &&
				pagination.page > 1
			) {
				const firstPageCollaborators = await queryBuilder
					.skip(0)
					.take(pagination.limit)
					.getMany();

				return {
					collaborators: firstPageCollaborators,
					meta: {
						totalCollaborators,
						totalPages: Math.ceil(totalCollaborators / pagination.limit),
						currentPage: 1,
					},
				};
			}

			return {
				collaborators,
				meta: {
					totalCollaborators,
					totalPages: Math.ceil(totalCollaborators / pagination.limit),
					currentPage: pagination.page,
				},
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async get_collaborator(id: string) {
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

	async update_collaborator(id: string, editCollaboratorDto: EditCollaboratorDto, request: any) {
		const exists = await this.collaboratorRepository.exists({
			where: { id },
		});

		if (!exists) {
			throw new NotFoundException('No se encontró el registro.');
		}

		const updateData = {
			...editCollaboratorDto,
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

			const { password, ...safeData } = editCollaboratorDto;
			
			this.kibanaService.audit({
				action: 'update_collaborator',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify(safeData),
				response: JSON.stringify(result.raw[0]),
				requestId: request.requestId,
			});

			return {
				success: true,
				message: 'Registro actualizado correctamente.',
				data: result.raw[0],
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async update_status_collaborator(id: string, status: boolean, request: any) {
		try {
			const exists = await this.collaboratorRepository.exists({ where: { id } });

			if (!exists) {
				throw new NotFoundException('No se encontró el registro.');
			}

			const result = await this.collaboratorRepository
				.createQueryBuilder()
				.update(Collaborator)
				.set({
					status: !status,
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
				action: 'update_status_collaborator',
				performedBy: request.user.id,
				targetId: id,
				requestBody: JSON.stringify({ 
					previousStatus: status,
    				newStatus: updatedCollaborator.status
				 }),
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

	async update_status_collaborators(updateStatusCollaboratorsDto: UpdateStatusCollaboratorsDto, request: any) {
		try {
			const ids = [...new Set(updateStatusCollaboratorsDto.ids)];

			if (!ids.length) {
				throw new BadRequestException('Debe seleccionar al menos un registro.');
			}

			const result = await this.collaboratorRepository
				.createQueryBuilder()
				.update(Collaborator)
				.set({
					status: updateStatusCollaboratorsDto.status,
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
				action: 'update_status_collaborators',
				performedBy: request.user.id,
				targetId: updatedIds,
				requestBody: JSON.stringify({
					status: updateStatusCollaboratorsDto.status,
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

	async export_collaborators(exportCollaboratorsDto: ExportCollaboratorsDto, request: any) {
		try {

			const allowedFields = new Set(ALLOWED_EXPORT);

			const fields = exportCollaboratorsDto.data.filter(({ checked, field }) => checked && allowedFields
			.has(field)).map(({ field }) => field);

			if (!fields.length) {
				throw new BadRequestException('Debe seleccionar al menos un campo válido para exportar.',);
			}

			const { scope, ids, sort, maskData } = exportCollaboratorsDto;
			const queryBuilder = this.collaboratorRepository.createQueryBuilder('collaborator');

			if ((scope === 'selected' || scope === 'page') && (!ids || !ids.length)) {
				throw new BadRequestException('Debe seleccionar al menos un colaborador para exportar.');
			}

			if ((scope === 'selected' || scope === 'page') && ids?.length) {
				queryBuilder.andWhere('collaborator.id IN (:...ids)', { ids });
			}

			const fieldMap = {
				name: 'collaborator.names',
				email: 'collaborator.email',
				number_document: 'collaborator.number_document',
			} as const;

			if (sort?.trim() && sort !== 'Predeterminado') {
				const [field, direction] = sort.split(':');

				if (!(field in fieldMap)) {
					throw new BadRequestException('El campo de ordenamiento es inválido.');
				}

				if (!['asc', 'desc'].includes(direction?.toLowerCase())) {
					throw new BadRequestException('La dirección de ordenamiento es inválida.');
				}

				queryBuilder.orderBy(fieldMap[field as keyof typeof fieldMap], direction.toUpperCase() as 'ASC' | 'DESC');
			} else {
				queryBuilder.orderBy('collaborator.createdAt', 'DESC');
			}

			let collaborators: Collaborator[];

			try {
				collaborators = await queryBuilder.getMany();
			} catch {
				throw new InternalServerErrorException('No fue posible obtener la información para la exportación.');
			}

			if (!collaborators.length) {
				throw new NotFoundException('No se encontraron colaboradores para exportar.');
			}

			const data = collaborators.map((collaborator) => {
				const row: Record<string, unknown> = {};

				fields.forEach((field) => {
					let value = collaborator[field];

					if (value instanceof Date) {
						value = value.toISOString().split('T')[0];
					}

					if (maskData) {
						switch (field) {
							case 'email':
								value = this.maskEmail(value as string);
								break;
							case 'number_document':
								value = this.maskDocument(value as string);
								break;
						}
					}

					row[field] = value ?? '';
				});

				return row;
			});

			await this.kibanaService.audit({
				action: 'export_collaborators',
				performedBy: request.user.id,
				targetId: '',
				requestBody: JSON.stringify(exportCollaboratorsDto),
				response: JSON.stringify({ exportedRecords: data.length }),
				requestId: request.requestId,
			});

			return {
				fields,
				data,
			};
		} catch (err: any) {
			if (err) throw err;
			throw new InternalServerErrorException('Ocurrió un problema en servidor.');
		}
	}

	async validate_import_collaborators(validateImportCollaboratorsDto: ValidateImportCollaboratorsDto, request: any) {
		try {
			const { data, mode, identifyBy } = validateImportCollaboratorsDto;
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
						Object.assign(existing, item);
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
				action: 'validate_import_collaborators',
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
