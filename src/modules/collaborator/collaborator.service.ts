import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { CreateCollaboratorDto } from './dto/create-collaborator.dto';
import { hashPassword } from '@/common/utils/hash.util';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Collaborator } from '@/entities/collaborator.entity';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { EditCollaboratorDto } from './dto/edit-collaborator.dto';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { logHelper } from '@/common/utils/logger-helper.util';

dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

@Injectable()
export class CollaboratorService {
	private readonly logger = new Logger('AuthService');

	constructor(
		@InjectRepository(Collaborator) private collaboratorRepository: Repository<Collaborator>,
		private authService: AuthService
	) {}

	async create_collaborator(createCollaboratorDto: CreateCollaboratorDto) {
		try {
			const data = { ...createCollaboratorDto };

			data.names = data.names?.trim().toUpperCase();
			data.surname = data.surname?.trim().toUpperCase();
			data.role = data.role?.trim().toUpperCase();
			data.password = await hashPassword(data.password);
			data.fullnames = `${data.names} ${data.surname}`.trim();

			const collaborator = this.collaboratorRepository.create(data);
			const saver = await this.collaboratorRepository.save(collaborator);
			logHelper(
				this.logger,
				'log',
				'Modulo Collaborator',
				'create_collaborator',
				'Colaborador creado correctamente',
				saver
			);
			return saver;
		} catch (error) {
			logHelper(
				this.logger,
				'error',
				'Modulo Collaborator',
				'create_collaborator()',
				'Error al crear colaborador',
				error.message
			);
		}
	}

	async login(loginDto: LoginDto) {
		const { email, password } = loginDto;
		const collaborator = await this.collaboratorRepository.findOneBy({ email });

		if (!collaborator?.status) {
			logHelper(
				this.logger,
				'warn',
				'Modulo Collaborator',
				'login',
				'No tienes permisos para acceder a la plataforma.',
				{ email: loginDto.email }
			);
			throw new ForbiddenException('No tienes permisos para acceder a la plataforma.');
		}

		let access = await bcrypt.compare(password, collaborator.password);
		if (!access) {
			logHelper(this.logger, 'warn', 'Modulo Collaborator', 'login()', 'No pudimos validar tus credenciales.', {
				email: loginDto.email,
			});
			throw new UnauthorizedException('No pudimos validar tus credenciales.');
		}

		const token = await this.authService.generateToken(collaborator);

		if (!token) {
			logHelper(
				this.logger,
				'error',
				'Modulo Collaborator',
				'login()',
				'Ocurrió un error interno al generar el token.',
				{ email: loginDto.email }
			);
			throw new InternalServerErrorException('Error interno al generar el token.');
		}

		try {
			await this.collaboratorRepository
				.createQueryBuilder()
				.update(Collaborator)
				.set({ lastDatelogin: new Date() })
				.where('id = :id', { id: collaborator.id })
				.execute();
		} catch (err) {
			logHelper(
				this.logger,
				'error',
				'Modulo Collaborator',
				'login()',
				'No se pudo actualizar lastDatelogin.',
				{ email: loginDto.email },
				err.message
			);
		}

		const save = {
			accessToken: token,
			collaborator: {
				id: collaborator.id,
				names: collaborator.names,
				surname: collaborator.surname,
				email: collaborator.email,
				role: collaborator.role,
			},
		};

		logHelper(
			this.logger,
			'log',
			'Modulo Collaborator',
			'login()',
			'Usuario inició sesión.',
			{
				token: token,
				email: loginDto.email,
			},
			''
		);

		return save;
	}

	async get_collaborators(query: { filter?: string; page?: number; limit?: number; status?: string }) {
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
		const queryBuilder = this.collaboratorRepository.createQueryBuilder('collaborator');

		if (query.filter?.trim()) {
			const searchTerms = query.filter
				.trim()
				.split(/\s+/)
				.slice(0, 5) // Limitar términos si quieres
				.map((t) => t.toLowerCase());

			const columns = [
				'collaborator.fullnames',
				'collaborator.number_document',
				'collaborator.email',
				'collaborator.phone',
				'collaborator.names',
			];

			searchTerms.forEach((term, idx) => {
				const conditions = columns.map((c) => `${c} ILIKE :term${idx}`).join(' OR ');
				const params = { [`term${idx}`]: `%${term}%` };
				idx === 0 ? queryBuilder.where(`(${conditions})`, params) : queryBuilder.andWhere(`(${conditions})`, params);
			});
		}

		if (query.status && query.status !== 'Todos') {
			const statusBool = query.status === 'Activos';
			queryBuilder.andWhere('collaborator.status = :status', { status: statusBool });
		}

		const [collaborators, totalCollaborators] = await queryBuilder
			.orderBy('collaborator.createdAt', 'DESC')
			.skip(skip)
			.take(limit)
			.getManyAndCount();

		return {
			collaborators,
			totalCollaborators,
			totalPages: Math.ceil(totalCollaborators / limit),
			currentPage: page,
		};
	}

	async get_collaborator(id: string) {
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

		if (!collaborator) throw new NotFoundException('No se encontró el colaborador.');
		return collaborator;
	}

	async update_collaborator(id: string, editCollaboratorDto: EditCollaboratorDto) {
		const data: Partial<Collaborator> = {
			...editCollaboratorDto,
			names: editCollaboratorDto.names?.trim().toUpperCase(),
			surname: editCollaboratorDto.surname?.trim().toUpperCase(),
			fullnames: `${editCollaboratorDto.names?.trim().toUpperCase()} ${editCollaboratorDto.surname?.trim().toUpperCase()}`,
			updatedAt: new Date(),
		};
		let result;

		if (editCollaboratorDto.password) {
			data.password = await hashPassword(editCollaboratorDto.password);
		}

		try {
			result = await this.collaboratorRepository
				.createQueryBuilder()
				.update(Collaborator)
				.set(data)
				.where('id = :id', { id: id + 's' })
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
		} catch (err) {
			logHelper(
				this.logger,
				'error',
				'Modulo Collaborator',
				'update_collaborator()',
				'No se pudo actualizar el colaborador.',
				data,
				err.message
			);
		}

		return result.raw[0];
	}

	async update_status_collaborator(id: string, status: boolean) {
		let result;
		try {
			result = await this.collaboratorRepository
				.createQueryBuilder()
				.update(Collaborator)
				.set({
					status: !status,
					statusAt: new Date(),
				})
				.where('id = :id', { id: id + 's' })
				.returning('*')
				.execute();
		} catch (err) {
			logHelper(
				this.logger,
				'error',
				'Modulo Collaborator',
				'update_status_collaborator()',
				'No se pudo actualizar el estado del colaborador.',
				{
					id,
					status,
				},
				err.message
			);
		}

		return result.raw[0];
	}

	async validate_email_collaborator(email: string) {
		const collaborator = await this.collaboratorRepository.findOneBy({ email });
		return collaborator;
	}

	async validate_dni_collaborator(number_document: string) {
		const collaborator = await this.collaboratorRepository.findOneBy({ number_document });
		return collaborator;
	}
}
