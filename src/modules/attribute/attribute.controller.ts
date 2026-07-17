import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AttributeService } from './attribute.service';
import { CreateAttributeInterceptor } from './interceptor/create-attribute.interceptor';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { Attribute } from '@/entities/attribute.entity';
import { log } from 'console';
import { CreateAttributeValueInterceptor } from './interceptor/create-atribute-value.interceptor';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { EditAttributeDto } from './dto/edit-attribute.dto';
import { EditAttributeInterceptor } from './interceptor/edit-attribute.interceptor';
import { ValidateUUID } from '@/common/pipes/validate-uuid.pipe';
import { UpdateStatusAttributesInterceptor } from './interceptor/update-status-attributes.interceptor';
import { UpdateStatusAttributesDto } from './dto/update-status-attributes.dto';
import { CreateGroupAttributeInterceptor } from './interceptor/create-group-attribute.interceptor';
import { CreateGroupAttributeDto } from './dto/create-group-attribute.dto';
import { EditAttributeGroupInterceptor } from './interceptor/edit-group-attribute.interceptor';
import { EditGroupAttributeDto } from './dto/edit-group-attribute.dto';
import { UpdateStatusGroupAttributesInterceptor } from './interceptor/update-status-group-attributes.interceptor';
import { UpdateStatusGroupAttributesDto } from './dto/update-status-group-attributes.dto';

@Controller('attribute')
export class AttributeController {
	constructor(private attributeService: AttributeService) {}

	@Post('create_attribute')
	@UseInterceptors(CreateAttributeInterceptor)
	create_attribute(@Body() createAttributeDto: CreateAttributeDto, @Req() request) {
		return this.attributeService.create_attribute(createAttributeDto, request);
	}

	@Post('create_group_attribute')
	@UseInterceptors(CreateGroupAttributeInterceptor)
	create_group_attribute(@Body() createGroupAttributeDto: CreateGroupAttributeDto, @Req() request) {
		return this.attributeService.create_group_attribute(createGroupAttributeDto, request);
	}

	@Get('get_attributes/:id')
	get_attributes(@Param('id', ValidateUUID) id: string, @Query() query: { filter: string; page: number; limit: number; status: string; sort: string }) {
		return this.attributeService.get_attributes(id, query);
	}

	@Get('get_attribute_and_categories/:id')
	get_attribute_and_categories(@Param('id', ValidateUUID) id: string) {
		return this.attributeService.get_attribute_and_categories(id);
	}

	@Get('get_groups_attributes')
	get_groups_attributes(@Query() query: { filter: string; page: number; limit: number; status: string; categories: string; sort: string }) {
		return this.attributeService.get_groups_attributes(query);
	}

	@Put('update_status_attribute/:id')
	update_status_attribute(@Param('id', ValidateUUID) id: string, @Body() data: { status: boolean }, @Req() request: any) {
		return this.attributeService.update_status_attribute(id, data.status, request);
	}

	@Put('update_status_group_attribute/:id')
	update_status_group_attribute(@Param('id', ValidateUUID) id: string, @Body() data: { status: boolean }, @Req() request: any) {
		return this.attributeService.update_status_group_attribute(id, data.status, request);
	}

	@Get('get_attribute/:id')
	get_attribute(@Param('id') id, @Req() request: any) {
		return this.attributeService.get_attribute(id, request);
	}

	@Get('get_attribute_group/:id')
	get_attribute_group(@Param('id') id) {
		return this.attributeService.get_attribute_group(id);
	}

	@Get('get_values_attribute/:id')
	get_values_attribute(@Param('id', ValidateUUID) id: string) {
		return this.attributeService.get_values_attribute(id);
	}

	@Post('add_value_attribute')
	@UseInterceptors(CreateAttributeValueInterceptor)
	add_value_attribute(@Body() createAttributeValueDto: CreateAttributeValueDto, @Req() request: any) {
		return this.attributeService.add_value_attribute(createAttributeValueDto, request);
	}

	@Delete('delete_value_attribute/:id')
	delete_value_attribute(@Param('id', ValidateUUID) id, @Req() request: any) {
		return this.attributeService.delete_value_attribute(id, request);
	}

	@Put('update_attribute/:id')
	@UseInterceptors(EditAttributeInterceptor)
	update_attribute(@Param('id', ValidateUUID) id: string, @Body() editAttributeDto: EditAttributeDto, @Req() request: any) {
		return this.attributeService.update_attribute(id, editAttributeDto, request);
	}

	@Put('update_attribute_group/:id')
	@UseInterceptors(EditAttributeGroupInterceptor)
	update_attribute_group(@Param('id', ValidateUUID) id: string, @Body() editGroupAttributeDto: EditGroupAttributeDto, @Req() request: any) {
		return this.attributeService.update_attribute_group(id, editGroupAttributeDto, request);
	}

	@Get('get_attributes_by_select')
	get_attributes_by_select() {
		return this.attributeService.get_attributes_by_select();
	}

	@Get('get_attributes_by_category/:id')
	get_attributes_by_category(@Param('id', ValidateUUID) id: string) {
		return this.attributeService.get_attributes_by_category(id);
	}

	@Post('update_status_attributes')
	@UseInterceptors(UpdateStatusAttributesInterceptor)
	update_status_attributes(@Body() updateStatusAttributesDto: UpdateStatusAttributesDto, @Req() request: any) {
		return this.attributeService.update_status_attributes(updateStatusAttributesDto, request);
	}

	@Post('update_status_group_attributes')
	@UseInterceptors(UpdateStatusGroupAttributesInterceptor)
	update_status_group_attributes(@Body() updateStatusGroupAttributesDto: UpdateStatusGroupAttributesDto, @Req() request: any) {
		return this.attributeService.update_status_group_attributes(updateStatusGroupAttributesDto, request);
	}
}
