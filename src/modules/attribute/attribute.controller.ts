import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AttributeService } from './attribute.service';
import { CreateAttributeInterceptor } from './interceptor/create-attribute.interceptor';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { Attribute } from '@/entities/attribute.entity';
import { log } from 'console';
import { CreateAttributeValueInterceptor } from './interceptor/create-attribute-value.interceptor';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { EditAttributeDto } from './dto/edit-attribute.dto';
import { EditAttributeInterceptor } from './interceptor/edit-attribute.interceptor';
import { ValidateUUID } from '@/common/pipes/validate-uuid.pipe';
import { UpdateStatusAttributesInterceptor } from './interceptor/update-status-attributes.interceptor';
import { UpdateStatusAttributeInterceptor } from './interceptor/update-status-attribute.interceptor';
import { UpdateAttributeStatusDto } from './dto/update-attribute-status.dto';
import { UpdateAttributesStatusDto } from './dto/update-attributes-status.dto';
import { CreateGroupAttributeInterceptor } from './interceptor/create-group-attribute.interceptor';
import { CreateGroupAttributeDto } from './dto/create-group-attribute.dto';
import { EditAttributeGroupInterceptor } from './interceptor/edit-group-attribute.interceptor';
import { EditGroupAttributeDto } from './dto/edit-group-attribute.dto';
import { UpdateStatusGroupAttributeInterceptor } from './interceptor/update-status-group-attribute.interceptor';
import { UpdateStatusGroupAttributesInterceptor } from './interceptor/update-status-group-attributes.interceptor';
import { UpdateAttributeGroupStatusDto } from './dto/update-attribute-group-status.dto';
import { UpdateAttributeGroupsStatusDto } from './dto/update-attribute-groups-status.dto';
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
import { QueryParamsErrorsPipe } from '@/common/pipes/query-params-errors.pipe';
import { FindAttributesQueryDto } from './dto/find-attributes.dto';
import { FindAttributesGroupsQueryDto } from './dto/find-attributes-groups.dto';

@Controller('attribute')
export class AttributeController {
	constructor(private attributeService: AttributeService) {}

	@Post('createAttribute')
	@UseInterceptors(CreateAttributeInterceptor)
	createAttribute(@Body() dto: CreateAttributeDto, @Req() request): Promise<CreateAttributeRes> {
		return this.attributeService.createAttribute(dto, request);
	}

	@Post('createGroupAttribute')
	@UseInterceptors(CreateGroupAttributeInterceptor)
	createGroupAttribute(@Body() dto: CreateGroupAttributeDto, @Req() request): Promise<CreateGroupAttributeRes> {
		return this.attributeService.createGroupAttribute(dto, request);
	}

	@Get('getAttributes/:id')
	getAttributes(@Param('id', ValidateUUID) id: string, @Query(new QueryParamsErrorsPipe(FindAttributesQueryDto)) query: unknown): Promise<GetAttributesRes> {
		return this.attributeService.getAttributes(id, query as FindAttributesQueryDto);
	}

	@Get('getCategoriesByAttributeGroup/:id')
	getCategoriesByAttributeGroup(@Param('id', ValidateUUID) id: string): Promise<GetCategoriesByAttributeGroupRes> {
		return this.attributeService.getCategoriesByAttributeGroup(id);
	}

	@Get('getAttributesGroups')
	getAttributesGroups(@Query(new QueryParamsErrorsPipe(FindAttributesGroupsQueryDto)) query: unknown): Promise<GetAttributesGroupsRes> {
		return this.attributeService.getAttributesGroups(query as FindAttributesGroupsQueryDto);
	}

	@Put('updateAttributeStatus/:id')
	@UseInterceptors(UpdateStatusAttributeInterceptor)
	updateAttributeStatus(@Param('id', ValidateUUID) id: string, @Body() dto: UpdateAttributeStatusDto, @Req() request): Promise<UpdateAttributeStatusRes> {
		return this.attributeService.updateAttributeStatus(id, dto, request);
	}

	@Post('updateAttributesStatus')
	@UseInterceptors(UpdateStatusAttributesInterceptor)
	updateAttributesStatus(@Body() dto: UpdateAttributesStatusDto, @Req() request): Promise<UpdateAttributesStatusRes> {
		return this.attributeService.updateAttributesStatus(dto, request);
	}

	@Put('updateAttributeGroupStatus/:id')
	@UseInterceptors(UpdateStatusGroupAttributeInterceptor)
	updateAttributeGroupStatus(@Param('id', ValidateUUID) id: string, @Body() dto: UpdateAttributeGroupStatusDto, @Req() request): Promise<UpdateAttributeGroupStatusRes> {
		return this.attributeService.updateAttributeGroupStatus(id, dto, request);
	}

	@Post('updateAttributeGroupsStatus')
	@UseInterceptors(UpdateStatusGroupAttributesInterceptor)
	updateAttributeGroupsStatus(@Body() dto: UpdateAttributeGroupsStatusDto, @Req() request): Promise<UpdateAttributeGroupsStatusRes> {
		return this.attributeService.updateAttributeGroupsStatus(dto, request);
	}

	@Get('getAttribute/:id')
	getAttribute(@Param('id', ValidateUUID) id: string): Promise<GetAttributeRes> {
		return this.attributeService.getAttribute(id);
	}

	@Get('getAttributeGroup/:id')
	getAttributeGroup(@Param('id', ValidateUUID) id: string): Promise<GetAttributeGroupRes> {
		return this.attributeService.getAttributeGroup(id);
	}

	@Get('getAttributeValues/:id')
	getAttributeValues(@Param('id', ValidateUUID) id: string): Promise<GetAttributeValuesRes> {
		return this.attributeService.getAttributeValues(id);
	}

	@Post('createAttributeValue')
	@UseInterceptors(CreateAttributeValueInterceptor)
	createAttributeValue(@Body() dto: CreateAttributeValueDto, @Req() request): Promise<CreateAttributeValueRes> {
		return this.attributeService.createAttributeValue(dto, request);
	}

	@Delete('deleteAttributeValue/:id')
	deleteAttributeValue(@Param('id', ValidateUUID) id: string, @Req() request): Promise<DeleteAttributeValueRes> {
		return this.attributeService.deleteAttributeValue(id, request);
	}

	@Put('updateAttribute/:id')
	@UseInterceptors(EditAttributeInterceptor)
	updateAttribute(@Param('id', ValidateUUID) id: string, @Body() dto: EditAttributeDto, @Req() request): Promise<UpdateAttributeRes> {
		return this.attributeService.updateAttribute(id, dto, request);
	}

	@Put('updateAttributeGroup/:id')
	@UseInterceptors(EditAttributeGroupInterceptor)
	updateAttributeGroup(@Param('id', ValidateUUID) id: string, @Body() dto: EditGroupAttributeDto, @Req() request): Promise<UpdateAttributeGroupRes> {
		return this.attributeService.updateAttributeGroup(id, dto, request);
	}

	@Get('getAttributesByCategory/:id')
	getAttributesByCategory(@Param('id', ValidateUUID) id: string): Promise<GetAttributesByCategoryRes> {
		return this.attributeService.getAttributesByCategory(id);
	}
}
