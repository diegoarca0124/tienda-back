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
import { UpdateStatusCollaboratorsInterceptor } from './interceptor/update-status-collaborators.interceptor';
import { ExportCollaboratorsDto } from './dto/export-colllaborators.dto';
import { ExportCollaboratorsInterceptor } from './interceptor/export-colllaborators.interceptor';
import type { Response } from 'express';
import { ImportCollaboratorsDto } from './dto/import-collaborators.dto';
import { ImportCollaboratorsInterceptor } from './interceptor/import-collaborators.interceptor';
import { AuthService } from '@/auth/auth.service';
import { Public } from '@/auth/decorators/public.decorator';
import { FindCollaboratorsQueryDto } from './dto/find-collaborators.dto';
import { QueryParamsErrorsPipe } from '@/common/pipes/query-params-errors.pipe';
import { UpdateCollaboratorStatusDto } from './dto/update-collaborator-status.dto';
import { UpdateCollaboratorsStatusDto } from './dto/update-collaborators-status.dto';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

@Controller('collaborator')
export class CollaboratorController {
	constructor(
		private readonly collaboratorService: CollaboratorService,
		private readonly authService: AuthService
	) {}

	@Post('createCollaborator')
	@UseInterceptors(CreateCollaboratorInterceptor)
	createCollaborator(
		@Body() dto: CreateCollaboratorDto, 
		@Req() request
	): Promise<any> {
		return this.collaboratorService.createCollaborator(dto, request);
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

	@Get('getCollaborator/:id')
	getCollaborator(
		@Param('id', ValidateUUID) id
	) {
		return this.collaboratorService.getCollaborator(id);
	}

	@Put('updateCollaborator/:id')
	@UseInterceptors(EditCollaboratorInterceptor)
	updateCollaborator(
		@Param('id', ValidateUUID) id: string,
		@Body() dto: EditCollaboratorDto,
		@Req() request
	): Promise<{ data: Collaborator; message: string }> {
		return this.collaboratorService.updateCollaborator(id, dto, request);
	}

	@Put('updateCollaboratorStatus/:id')
	updateCollaboratorStatus(
		@Param('id', ValidateUUID) id: string, 
		@Body() dto: UpdateCollaboratorStatusDto, 
		@Req() request
	): Promise<{ data: Collaborator; message: string }> {
		return this.collaboratorService.updateCollaboratorStatus(id, dto, request);
	}

	@Post('updateCollaboratorsStatus')
	@UseInterceptors(UpdateStatusCollaboratorsInterceptor)
	updateCollaboratorsStatus(
		@Body() dto: UpdateCollaboratorsStatusDto, 
		@Req() request
	): Promise<{ data: any; message: string }> {
		return this.collaboratorService.updateCollaboratorsStatus(dto, request);
	}

	@Post('exportCollaborators')
	@HttpCode(HttpStatus.OK)
	@UseInterceptors(ExportCollaboratorsInterceptor)
	async exportCollaborators(
		@Body() exportCollaboratorsDto: ExportCollaboratorsDto, 
		@Req() request
	): Promise<any> {
		const result = await this.collaboratorService.exportCollaborators(exportCollaboratorsDto, request);
		return result;
	}

	@Post('importCollaborators')
	@UseInterceptors(ImportCollaboratorsInterceptor)
	async importCollaborators(
		@Body() dto: ImportCollaboratorsDto, 
		@Req() request
	): Promise<any> {
		const result = await this.collaboratorService.importCollaborators(dto, request);
		return result;
	}
}
