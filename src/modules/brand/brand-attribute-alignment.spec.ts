import { ConflictException, InternalServerErrorException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { CreateAttributeDto } from '@/modules/attribute/dto/create-attribute.dto';
import { EditAttributeDto } from '@/modules/attribute/dto/edit-attribute.dto';
import { BrandService } from './brand.service';
import { AttributeService } from '@/modules/attribute/attribute.service';
import { Product } from '@/entities/product.entity';

const id = '11111111-1111-4111-8111-111111111111';
const request = { user: { id }, requestId: 'alignment-test' };

function builder(result: object) {
	const query: any = {};
	for (const method of ['update', 'set', 'where', 'andWhere', 'returning']) query[method] = jest.fn().mockReturnValue(query);
	query.execute = jest.fn().mockResolvedValue(result);
	return query;
}

describe('brand and attribute alignment', () => {
	it('normalizes an attribute and its values through the same global validation pipe used by collaborator', async () => {
		const pipe = new ValidationPipe({ transform: true, whitelist: true });
		const dto = await pipe.transform({ name: '  color  ', attributeGroupId: id, values: [{ value: '  Azul  ' }] }, { type: 'body', metatype: CreateAttributeDto });
		expect(dto.name).toBe('Color');
		expect(dto.values).toEqual([{ value: 'Azul' }]);
	});

	it('clears optional attribute fields through DTO transforms without a frontend request builder', async () => {
		const pipe = new ValidationPipe({ transform: true, whitelist: true });
		const dto = await pipe.transform({ name: 'Color', unit: '  ', description: '' }, { type: 'body', metatype: EditAttributeDto });
		expect(dto.unit).toBeNull();
		expect(dto.description).toBeNull();
	});

	it.each([
		['updateAttributeStatus', 'attributeRepository'],
		['updateAttributeGroupStatus', 'attributeGroupRepository'],
	])('returns the current state when %s is repeated', async (method, repository) => {
		const row = { id, name: 'Nombre', status: true };
		const service = Object.assign(Object.create(AttributeService.prototype), {
			[repository]: { createQueryBuilder: () => builder({ affected: 0, raw: [] }), findOne: async () => row },
			kibanaService: { audit: jest.fn() },
		});
		await expect(service[method](id, { status: true }, request)).resolves.toMatchObject({ data: row });
	});

	it.each([
		['updateAttributesStatus', 'attributeRepository'],
		['updateAttributeGroupsStatus', 'attributeGroupRepository'],
	])('returns all matching selected records when %s includes unchanged records', async (method, repository) => {
		const rows = [
			{ id, status: true },
			{ id: 'unchanged', status: true },
		];
		const service = Object.assign(Object.create(AttributeService.prototype), {
			[repository]: { createQueryBuilder: () => builder({ affected: 1, raw: [{ id }] }), find: async () => rows },
			kibanaService: { audit: jest.fn() },
		});
		await expect(service[method]({ ids: rows.map((row) => row.id), status: true }, request)).resolves.toMatchObject({ data: [id, 'unchanged'] });
	});

	it('keeps a missing attribute as 404', async () => {
		const service: AttributeService = Object.assign(Object.create(AttributeService.prototype), {
			attributeRepository: { createQueryBuilder: () => builder({ affected: 0, raw: [] }), findOne: async () => null },
		});
		await expect(service.updateAttributeStatus(id, { status: true }, request)).rejects.toBeInstanceOf(NotFoundException);
	});

	it('does not report success when the database omits the updated row', async () => {
		const audit = jest.fn();
		const service: AttributeService = Object.assign(Object.create(AttributeService.prototype), {
			attributeRepository: { createQueryBuilder: () => builder({ affected: 1, raw: [] }) },
			kibanaService: { audit },
		});
		await expect(service.updateAttributeStatus(id, { status: true }, request)).rejects.toBeInstanceOf(InternalServerErrorException);
		expect(audit).not.toHaveBeenCalled();
	});

	it('reports a concurrent status change as a conflict', async () => {
		const service: AttributeService = Object.assign(Object.create(AttributeService.prototype), {
			attributeRepository: { createQueryBuilder: () => builder({ affected: 0, raw: [] }), findOne: async () => ({ id, status: false }) },
		});
		await expect(service.updateAttributeStatus(id, { status: true }, request)).rejects.toBeInstanceOf(ConflictException);
	});

	it('keeps the product cascade when deactivating an already inactive brand', async () => {
		const brandQuery = builder({ affected: 0, raw: [] });
		const productQuery = builder({ affected: 2 });
		const manager = {
			createQueryBuilder: jest.fn().mockReturnValueOnce(brandQuery).mockReturnValueOnce(productQuery),
			findOne: async () => ({ id, name: 'Marca', status: false }),
		};
		const service: BrandService = Object.assign(Object.create(BrandService.prototype), {
			brandRepository: { manager: { transaction: (action) => action(manager) } },
			kibanaService: { audit: jest.fn() },
		});
		await expect(service.updateBrandStatus(id, { status: false }, request)).resolves.toMatchObject({ data: { id, status: false } });
		expect(productQuery.update).toHaveBeenCalledWith(Product);
		expect(productQuery.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft' }));
	});
});
