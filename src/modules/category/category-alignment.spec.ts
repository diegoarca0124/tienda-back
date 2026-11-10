import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CategoryService } from './category.service';
import { Category } from '@/entities/category.entity';
import { Subcategory } from '@/entities/subcategory.entity';
import { Product } from '@/entities/product.entity';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { EditCategoryInterceptor } from './interceptor/edit-category.interceptor';

const id = '11111111-1111-4111-8111-111111111111';
const request = { user: { id }, requestId: 'category-alignment-test' };

function builder(result: object) {
	const query: any = {};
	for (const method of ['update', 'set', 'where', 'andWhere', 'returning']) query[method] = jest.fn().mockReturnValue(query);
	query.execute = jest.fn().mockResolvedValue(result);
	return query;
}

function serviceWith(dependencies: object): CategoryService {
	return Object.assign(Object.create(CategoryService.prototype), { kibanaService: { audit: jest.fn() } }, dependencies);
}

describe('category alignment contracts', () => {
	it('retrieves a single subcategory without fetching the parent list', async () => {
		const row = { id, name: 'Nombre', categoryId: id };
		const findOne = jest.fn().mockResolvedValue(row);
		const service = serviceWith({ subcategoryRepository: { findOne } });
		await expect(service.getSubcategory(id)).resolves.toMatchObject({ data: row });
		expect(findOne).toHaveBeenCalledWith({ where: { id } });
	});

	it('returns 404 for a missing subcategory', async () => {
		const service = serviceWith({ subcategoryRepository: { findOne: jest.fn().mockResolvedValue(null) } });
		await expect(service.getSubcategory(id)).rejects.toBeInstanceOf(NotFoundException);
	});

	it('requires a valid category ID when creating a subcategory', async () => {
		const errors = await validate(plainToInstance(CreateSubcategoryDto, { name: 'Nombre', prefix: 'NOM' }));
		expect(errors.some((error) => error.property === 'categoryId')).toBe(true);
	});

	it('rejects an invalid route ID before checking uniqueness in the database', async () => {
		const existsNameCategory = jest.fn();
		const interceptor = new EditCategoryInterceptor({ existsNameCategory } as any);
		const context = { switchToHttp: () => ({ getRequest: () => ({ params: { id: 'invalid' }, body: { name: 'Nombre' } }) }) };
		await expect(interceptor.intercept(context as any, {} as any)).rejects.toBeInstanceOf(BadRequestException);
		expect(existsNameCategory).not.toHaveBeenCalled();
	});

	it('does not audit or report success when an edit returns no updated row', async () => {
		const query = builder({ affected: 0, raw: [] });
		const audit = jest.fn();
		const service = serviceWith({ categoryRepository: { exists: jest.fn().mockResolvedValue(true), createQueryBuilder: () => query }, kibanaService: { audit } });
		await expect(service.updateCategory(id, { name: 'Nombre' } as any, request)).rejects.toBeInstanceOf(InternalServerErrorException);
		expect(audit).not.toHaveBeenCalled();
	});

	it('returns the current category state when it is already active', async () => {
		const row = { id, name: 'Nombre', status: true, statusAt: null };
		const query = builder({ affected: 0, raw: [] });
		const manager = { createQueryBuilder: () => query, findOne: jest.fn().mockResolvedValue(row) };
		const service = serviceWith({ dataSource: { transaction: (action: Function) => action(manager) } });
		await expect(service.updateCategoryStatus(id, { status: true }, request)).resolves.toMatchObject({ data: row });
	});

	it('keeps the subcategory and product cascade when deactivating a category', async () => {
		const category = builder({ affected: 1, raw: [{ id, name: 'Nombre', status: false, statusAt: new Date() }] });
		const subcategories = builder({ affected: 2, raw: [] });
		const products = builder({ affected: 3, raw: [] });
		const createQueryBuilder = jest.fn().mockReturnValueOnce(category).mockReturnValueOnce(subcategories).mockReturnValueOnce(products);
		const service = serviceWith({ dataSource: { transaction: (action: Function) => action({ createQueryBuilder }) } });
		await expect(service.updateCategoryStatus(id, { status: false }, request)).resolves.toMatchObject({ data: { id, status: false } });
		expect(category.update).toHaveBeenCalledWith(Category);
		expect(subcategories.update).toHaveBeenCalledWith(Subcategory);
		expect(subcategories.set).toHaveBeenCalledWith(expect.objectContaining({ status: false }));
		expect(products.update).toHaveBeenCalledWith(Product);
		expect(products.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft' }));
	});

	it('still rejects activating a subcategory under an inactive parent', async () => {
		const manager = { findOne: jest.fn().mockResolvedValueOnce({ id, categoryId: id }).mockResolvedValueOnce({ id, status: false }) };
		const service = serviceWith({ dataSource: { transaction: (action: Function) => action(manager) } });
		await expect(service.updateSubcategoryStatus(id, { status: true }, request)).rejects.toBeInstanceOf(BadRequestException);
	});

	it.each(['updateCategoriesStatus', 'updateSubcategoriesStatus'] as const)('accepts an already inactive batch in %s', async (method) => {
		const query = builder({ affected: 0, raw: [] });
		const manager = { createQueryBuilder: () => query, find: jest.fn().mockResolvedValue([{ id, status: false }]) };
		const service = serviceWith({ dataSource: { transaction: (action: Function) => action(manager) } });
		await expect(service[method]({ ids: [id], status: false }, request)).resolves.toMatchObject({ data: [id] });
	});
});
