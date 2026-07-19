import { Body, Controller, Post, Req, UseInterceptors, Get, Query, Param, Put, ParseUUIDPipe, UseGuards, HttpCode, HttpStatus, Res, StreamableFile } from '@nestjs/common';
import { CollaboratorService } from './collaborator.service';
import { CreateCollaboratorDto } from './dto/create-collaborator.dto';
import { Collaborator } from '@/entities/collaborator.entity';
import { CreateCollaboratorInterceptor } from './interceptor/create-collaborator.interceptor';
import { LoginInterceptor } from './interceptor/login.interceptor';
import { LoginDto } from './dto/login.dto';
import { EditCollaboratorInterceptor } from './interceptor/edit-collaborator.interceptor';
import { EditCollaboratorDto } from './dto/edit-collaborator.dto';
import { ValidateUUID } from '@/common/pipes/validate-uuid.pipe';
import * as dotenv from 'dotenv';
import path from 'path';
import { UpdateStatusCollaboratorsDto } from './dto/update-status-collaborators.dto';
import { UpdateStatusCollaboratorsInterceptor } from './interceptor/update-status-collaborators.interceptor';
import { ExportCollaboratorsDto } from './dto/export-colllaborators.dto';
import { ExportCollaboratorsInterceptor } from './interceptor/export-colllaborators.interceptor';
import type { Response } from 'express';
import { ValidateImportCollaboratorsDto } from './dto/validate-import-collaborators.dto';
import { ValidateImportCollaboratorsInterceptor } from './interceptor/validate-import-collaborators.interceptor';
import { AuthService } from '@/auth/auth.service';
import { Public } from '@/auth/decorators/public.decorator';
import { FindCollaboratorsQueryDto } from './dto/find-collaborators.dto';
import { QueryParamsErrorsPipe } from '@/common/pipes/query-params-errors.pipe';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

@Controller('collaborator')
export class CollaboratorController {
	constructor(
		private readonly collaboratorService: CollaboratorService,
		private readonly authService: AuthService
	) {}

	@Post('create_collaborator')
	@UseInterceptors(CreateCollaboratorInterceptor)
	create_collaborator(@Body() createCollaboratorDto: CreateCollaboratorDto, @Req() request): Promise<any> {
		return this.collaboratorService.create_collaborator(createCollaboratorDto, request);
	}

	@Post('login')
	@Public()
	@UseInterceptors(LoginInterceptor)
	login(@Body() loginDto: LoginDto): Promise<{ data: any; message: string }> {
		return this.collaboratorService.login(loginDto);
	}

	@Get('logout')
	@HttpCode(HttpStatus.OK)
	async logout(@Req() req: any) {
		if (process.env.TOKEN_REVOCATION === 'true') {
			const jti = req.user.jti;
			if (!jti) {
				return {
					success: false,
					revoked: false,
					message: 'No se proporcionó el JTI de acceso.',
				};
			}
			await this.authService.revokeToken(jti);
			return {
				success: true,
				revoked: true,
				message: 'Sesión cerrada correctamente.',
			};
		} else {
			return {
				success: true,
				revoked: false,
				message: 'Sesión cerrada correctamente.',
			};
		}
	}

	@Get('getCollaborators')
	getCollaborators(
		@Query(new QueryParamsErrorsPipe(FindCollaboratorsQueryDto))
		query: unknown,
	) {
		return this.collaboratorService.getCollaborators(query as FindCollaboratorsQueryDto);
	}

	@Get('get_collaborator/:id')
	get_collaborator(@Param('id', ValidateUUID) id) {
		return this.collaboratorService.get_collaborator(id);
	}

	@Put('update_collaborator/:id')
	@UseInterceptors(EditCollaboratorInterceptor)
	update_collaborator(
		@Param('id', ValidateUUID) id: string,
		@Body() editCollaboratorDto: EditCollaboratorDto,
		@Req() request
	): Promise<{ success: boolean; message: string; data: Collaborator }> {
		return this.collaboratorService.update_collaborator(id, editCollaboratorDto, request);
	}

	@Put('update_status_collaborator/:id')
	update_status_collaborator(
		@Param('id', ValidateUUID) id: string, 
		@Body() data: { status: boolean }, 
		@Req() request
	): Promise<{ data: Collaborator; message: string }> {
		return this.collaboratorService.update_status_collaborator(id, data.status, request);
	}

	@Post('update_status_collaborators')
	@UseInterceptors(UpdateStatusCollaboratorsInterceptor)
	update_status_collaborators(@Body() updateStatusCollaboratorsDto: UpdateStatusCollaboratorsDto, @Req() request): Promise<{ data: any; message: string }> {
		return this.collaboratorService.update_status_collaborators(updateStatusCollaboratorsDto, request);
	}

	@Post('export_collaborators')
	@UseInterceptors(ExportCollaboratorsInterceptor)
	async export_collaborators(@Body() exportCollaboratorsDto: ExportCollaboratorsDto, @Req() request): Promise<any> {
		const result = await this.collaboratorService.export_collaborators(exportCollaboratorsDto, request);
		return result;
	}

	@Post('validate_import_collaborators')
	@UseInterceptors(ValidateImportCollaboratorsInterceptor)
	async validate_import_collaborators(@Body() validateImportCollaboratorsDto: ValidateImportCollaboratorsDto, @Req() request): Promise<any> {
		const result = await this.collaboratorService.validate_import_collaborators(validateImportCollaboratorsDto, request);
		return result;
	}
}
