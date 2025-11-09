import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AttributeService } from './attribute.service';
import { CreateAttributeInterceptor } from './interceptor/create-attribute.interceptor';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { Attribute } from '@/entities/attribute.entity';
import { log } from 'console';
import { CreateAttributeValueInterceptor } from './interceptor/create-atribute-value.interceptor';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { EditAttributeDto } from './dto/edit-attribute.dto';
import { EditAttributeInterceptor } from './interceptor/edit-attribute.interceptor';
import { AuthGuard } from '@/common/guards/auth/auth.guard';
import { ValidateUUID } from '@/common/pipes/validate-uuid.pipe';

@Controller('attribute')
export class AttributeController {
	constructor(private attributeService: AttributeService) {}

	@Post('create_attribute')
	//@Permissions('create_attribute')
	@UseGuards(AuthGuard)
	@UseInterceptors(CreateAttributeInterceptor)
	create_attribute(@Body() createAttributeDto: CreateAttributeDto) {
		return this.attributeService.create_attribute(createAttributeDto);
	}

	@Get('get_attributes')
	@UseGuards(AuthGuard)
	get_attributes(@Query() query: { filter: string; page: number; limit: number; status: string; categories: string }) {
		return this.attributeService.get_attributes(query);
	}

	@Put('update_status_attribute/:id')
	@UseGuards(AuthGuard)
	update_status_attribute(@Param('id', ValidateUUID) id: string, @Body() data: { status: boolean }, @Req() request: any) {
		return this.attributeService.update_status_attribute(id, data.status);
	}

	@Get('get_attribute/:id')
	@UseGuards(AuthGuard)
	get_attribute(@Param('id') id) {
		return this.attributeService.get_attribute(id);
	}

	@Get('get_values_attribute/:id')
	@UseGuards(AuthGuard)
	get_values_attribute(@Param('id', ValidateUUID) id: string) {
		return this.attributeService.get_values_attribute(id);
	}

	@Post('add_value_attribute')
	@UseGuards(AuthGuard)
	@UseInterceptors(CreateAttributeValueInterceptor)
	add_value_attribute(@Body() createAttributeValueDto: CreateAttributeValueDto) {
		return this.attributeService.add_value_attribute(createAttributeValueDto);
	}

	@Put('update_attribute/:id')
	@UseGuards(AuthGuard)
	@UseInterceptors(EditAttributeInterceptor)
	update_attribute(@Param('id', ValidateUUID) id: string, @Body() editAttributeDto: EditAttributeDto) {
		return this.attributeService.update_attribute(id, editAttributeDto);
	}

	@Get('get_attributes_by_select')
	@UseGuards(AuthGuard)
	get_attributes_by_select() {
		return this.attributeService.get_attributes_by_select();
	}

	@Get('get_attributeValues_by_select/:id')
	@UseGuards(AuthGuard)
	get_attributeValues_by_select(@Param('id', ValidateUUID) id: string) {
		return this.attributeService.get_attributeValues_by_select(id);
	}
}
