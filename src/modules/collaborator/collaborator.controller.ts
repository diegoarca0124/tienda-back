import {
	Body,
	Controller,
	Post,
	Req,
	UseInterceptors,
	Get,
	Query,
	Param,
	Put,
	ParseUUIDPipe,
	UseGuards,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { CollaboratorService } from './collaborator.service';
import { CreateCollaboratorDto } from './dto/create-collaborator.dto';
import { Collaborator } from '@/entities/collaborator.entity';
import { CreateCollaboratorInterceptor } from './interceptor/create-collaborator.interceptor';
import { LoginInterceptor } from './interceptor/login.interceptor';
import { LoginDto } from './dto/login.dto';
import { EditCollaboratorInterceptor } from './interceptor/edit-collaborator.interceptor';
import { EditCollaboratorDto } from './dto/edit-collaborator.dto';
import { ValidateUUID } from '@/common/pipes/validate-uuid.pipe';
import { AuthGuard } from '@/common/guards/auth/auth.guard';
import { AuthService } from './auth.service';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

@Controller('collaborator')
export class CollaboratorController {
	constructor(
		private readonly collaboratorService: CollaboratorService,
		private readonly authService: AuthService
	) {}

	@Post('create_collaborator')
	@UseGuards(AuthGuard)
	@UseInterceptors(CreateCollaboratorInterceptor)
	create_collaborator(@Body() createCollaboratorDto: CreateCollaboratorDto): Promise<Collaborator | undefined> {
		return this.collaboratorService.create_collaborator(createCollaboratorDto);
	}

	@Post('login')
	@UseInterceptors(LoginInterceptor)
	login(@Body() loginDto: LoginDto, @Req() request: any) {
		return this.collaboratorService.login(loginDto);
	}

	@Get('logout')
	@HttpCode(HttpStatus.OK)
	async logout(@Req() req: Request) {
		if (process.env.TOKEN_REVOCATION === 'true') {
			const authHeader = req.headers['authorization'];
			if (!authHeader) {
				return {
					success: false,
					revoked: false,
					message: 'No se proporcionó el token',
				};
			}
			const token = authHeader.split(' ')[1];
			await this.authService.revokeToken(token);
			return {
				success: true,
				revoked: true,
				message: 'Sesion cerrada y token revocado correctamente',
			};
		} else {
			return {
				success: true,
				revoked: false,
				message: 'Sesion cerrada correctamente, pero la revocación de tokens está deshabilitada',
			};
		}
	}

	@Get('get_collaborators')
	@UseGuards(AuthGuard)
	get_collaborators(@Query() query: { filter: string; page: number; limit: number; status: string, sort: string }) {
		return this.collaboratorService.get_collaborators(query);
	}

	@Get('get_collaborator/:id')
	@UseGuards(AuthGuard)
	get_collaborator(@Param('id', ValidateUUID) id) {
		return this.collaboratorService.get_collaborator(id);
	}

	@Put('update_collaborator/:id')
	@UseGuards(AuthGuard)
	@UseInterceptors(EditCollaboratorInterceptor)
	update_collaborator(@Param('id', ValidateUUID) id: string, @Body() editCollaboratorDto: EditCollaboratorDto) {
		return this.collaboratorService.update_collaborator(id, editCollaboratorDto);
	}

	@Put('update_status_collaborator/:id')
	@UseGuards(AuthGuard)
	update_status_collaborator(@Param('id', ValidateUUID) id: string, @Body() data: { status: boolean }) {
		return this.collaboratorService.update_status_collaborator(id, data.status);
	}

	@Get('validate_token')
	@HttpCode(HttpStatus.OK)
	async validateToken(@Req() req: Request) {
		const authHeader = req.headers['authorization'];

		if (!authHeader) {
			return { valid: false, message: 'No se proporcionó el token' };
		}

		const token = authHeader.split(' ')[1];

		try {
			const payload = await this.authService.validateToken(token);
			return {
				valid: true,
				message: 'Token válido y vigente',
				payload,
			};
		} catch (error) {
			return {
				valid: false,
				message: error.message || 'Token inválido o expirado',
			};
		}
	}
}
