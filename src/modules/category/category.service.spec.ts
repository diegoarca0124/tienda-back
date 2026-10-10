import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Category } from '@/entities/category.entity';
import { Product } from '@/entities/product.entity';
import { Subcategory } from '@/entities/subcategory.entity';
import { CategoryService } from './category.service';

const actor = { user: { id: 'actor' }, requestId: 'test' };

function createMoveFixture(categoryStatus: boolean, subcategoryStatus: boolean) {
	const updates = new Map<any, any>();
	const category = { id: 'destination', status: categoryStatus };
	const subcategory = { id: 'subcategory', name: 'Subcategory', categoryId: 'origin', status: subcategoryStatus };
	const manager = {
		findOne: jest.fn(async (entity: any) => entity === Category ? category : subcategory),
		createQueryBuilder: jest.fn(() => {
			let entity: any;
			const query: any = {
				update: jest.fn((value: any) => { entity = value; return query; }),
				set: jest.fn((value: any) => { updates.set(entity, value); return query; }),
				where: jest.fn(() => query),
				returning: jest.fn(() => query),
				execute: jest.fn(async () => entity === Subcategory
					? { affected: 1, raw: [{ ...subcategory, ...updates.get(Subcategory) }] }
					: { affected: 2 }),
			};
			return query;
		}),
	};
	const runner = {
		manager,
		isTransactionActive: false,
		isReleased: false,
		connect: jest.fn(async () => {}),
		startTransaction: jest.fn(async () => { runner.isTransactionActive = true; }),
		commitTransaction: jest.fn(async () => { runner.isTransactionActive = false; }),
		rollbackTransaction: jest.fn(async () => { runner.isTransactionActive = false; }),
		release: jest.fn(async () => { runner.isReleased = true; }),
	};
	const audit = { audit: jest.fn() };
	const service = new CategoryService({} as any, {} as any, {} as any, {} as any, { createQueryRunner: () => runner } as any, audit as any, {} as any);
	return { service, runner, manager, category, subcategory, updates, audit };
}

describe('CategoryService.moveSubcategory', () => {
	it.each([
		[true, true, true],
		[false, true, false],
		[true, false, false],
		[false, false, false],
	])('destination active=%s, subcategory active=%s yields active=%s', async (destinationStatus, initialStatus, expectedStatus) => {
		const fixture = createMoveFixture(destinationStatus, initialStatus);
		const response = await fixture.service.moveSubcategory('subcategory', { categoryId: 'destination' }, actor);
		expect(response.data).toMatchObject({ categoryId: 'destination', status: expectedStatus, affectedProducts: 2 });
		expect(fixture.updates.get(Product).categoryId).toBe('destination');
		if (expectedStatus) {
			// Published and draft products retain their state in an active subcategory.
			expect(fixture.updates.get(Product)).not.toHaveProperty('status');
		} else {
			// Also repairs published products under a previously inactive subcategory.
			expect(fixture.updates.get(Product).status).toBe('draft');
		}
		if (initialStatus !== expectedStatus) {
			expect(fixture.updates.get(Subcategory).statusAt).toBeDefined();
		} else {
			expect(fixture.updates.get(Subcategory)).not.toHaveProperty('statusAt');
		}
		expect(fixture.runner.commitTransaction).toHaveBeenCalledTimes(1);
		expect(fixture.runner.release).toHaveBeenCalledTimes(1);
	});

	it('rejects the current category without changing records', async () => {
		const fixture = createMoveFixture(true, true);
		fixture.subcategory.categoryId = 'destination';
		await expect(fixture.service.moveSubcategory('subcategory', { categoryId: 'destination' }, actor)).rejects.toBeInstanceOf(BadRequestException);
		expect(fixture.updates.size).toBe(0);
		expect(fixture.runner.rollbackTransaction).toHaveBeenCalledTimes(1);
	});

	it.each([Category, Subcategory])('rejects a missing %p and releases the transaction', async (missingEntity) => {
		const fixture = createMoveFixture(true, true);
		fixture.manager.findOne.mockImplementation(async (entity: any) => entity === missingEntity ? null as any : entity === Category ? fixture.category : fixture.subcategory);
		await expect(fixture.service.moveSubcategory('subcategory', { categoryId: 'destination' }, actor)).rejects.toBeInstanceOf(NotFoundException);
		expect(fixture.updates.size).toBe(0);
		expect(fixture.runner.rollbackTransaction).toHaveBeenCalledTimes(1);
		expect(fixture.runner.release).toHaveBeenCalledTimes(1);
	});

	it('rolls back when moving products fails and does not audit a successful move', async () => {
		const fixture = createMoveFixture(false, true);
		const createQueryBuilder = fixture.manager.createQueryBuilder.getMockImplementation()!;
		fixture.manager.createQueryBuilder.mockImplementation(() => {
			const query = createQueryBuilder();
			const update = query.update.getMockImplementation();
			query.update.mockImplementation((entity: any) => {
				if (entity === Product) query.execute.mockRejectedValue(new Error('Product update failed'));
				return update(entity);
			});
			return query;
		});
		await expect(fixture.service.moveSubcategory('subcategory', { categoryId: 'destination' }, actor)).rejects.toThrow('Ocurrió un problema en el servidor.');
		expect(fixture.runner.commitTransaction).not.toHaveBeenCalled();
		expect(fixture.runner.rollbackTransaction).toHaveBeenCalledTimes(1);
		expect(fixture.runner.release).toHaveBeenCalledTimes(1);
		expect(fixture.audit.audit).not.toHaveBeenCalled();
	});
});

describe('CategoryService concurrent uniqueness conflicts', () => {
	it.each([
		['createCategory', 'UQ_CATEGORIES_NAME_NORMALIZED'],
		['updateCategory', 'UQ_CATEGORIES_SLUG'],
		['createSubcategory', 'UQ_SUBCATEGORIES_NAME_NORMALIZED'],
		['updateSubcategory', 'UQ_SUBCATEGORIES_SLUG'],
	])('%s returns HTTP 409 on a database uniqueness conflict', async (method, constraint) => {
		const query: any = {};
		for (const name of ['insert', 'into', 'values', 'update', 'set', 'where', 'returning']) {
			query[name] = jest.fn(() => query);
		}
		query.execute = jest.fn().mockRejectedValue({ driverError: { code: '23505', constraint } });
		const repository = { findOne: jest.fn().mockResolvedValue({ id: 'id', name: 'Previous' }), createQueryBuilder: () => query };
		const audit = { audit: jest.fn() };
		const service = new CategoryService(repository as any, repository as any, {} as any, {} as any, {} as any, audit as any, { existsIdCategory: async () => true } as any);
		const dto: any = { name: 'New name', categoryId: 'category' };
		const operation = method.startsWith('create')
			? (service as any)[method](dto, actor)
			: (service as any)[method]('id', dto, actor);
		await expect(operation).rejects.toMatchObject({ status: 409 });
		expect(audit.audit).not.toHaveBeenCalled();
	});
});

describe('CategoryService.moveProductsToSubcategory', () => {
	const dto = { categoryId: 'destination', subcategoryId: 'subcategory', products: ['product', 'product'] };

	it('locks category and subcategory in order and commits before auditing', async () => {
		const fixture = createMoveFixture(true, true);
		fixture.subcategory.categoryId = 'destination';
		const response = await fixture.service.moveProductsToSubcategory(dto, actor);

		expect(response.data).toBe(2);
		expect(fixture.manager.findOne).toHaveBeenNthCalledWith(1, Category, expect.objectContaining({ lock: { mode: 'pessimistic_write' } }));
		expect(fixture.manager.findOne).toHaveBeenNthCalledWith(2, Subcategory, expect.objectContaining({ lock: { mode: 'pessimistic_write' } }));
		expect(fixture.runner.startTransaction.mock.invocationCallOrder[0]).toBeLessThan(fixture.manager.findOne.mock.invocationCallOrder[0]);
		expect(fixture.updates.get(Product)).toMatchObject({ categoryId: 'destination', subcategoryId: 'subcategory', status: 'draft' });
		const query = fixture.manager.createQueryBuilder.mock.results[0].value;
		expect(query.where).toHaveBeenCalledWith('id IN (:...productIds)', { productIds: ['product'] });
		expect(fixture.runner.commitTransaction.mock.invocationCallOrder[0]).toBeLessThan(fixture.audit.audit.mock.invocationCallOrder[0]);
		expect(fixture.runner.release).toHaveBeenCalledTimes(1);
	});

	it('waits for the locked read and rejects the changed parent before writing products', async () => {
		const fixture = createMoveFixture(true, true);
		let releaseRead!: (value: any) => void;
		let readStarted!: () => void;
		const started = new Promise<void>((resolve) => { readStarted = resolve; });
		const lockedRead = new Promise<any>((resolve) => { releaseRead = resolve; });
		fixture.manager.findOne.mockImplementation(async (entity: any) => {
			if (entity === Category) return fixture.category;
			readStarted();
			return lockedRead;
		});

		const operation = fixture.service.moveProductsToSubcategory(dto, actor);
		await started;
		expect(fixture.manager.createQueryBuilder).not.toHaveBeenCalled();
		// Simulates the row returned after a concurrent subcategory move commits.
		releaseRead({ ...fixture.subcategory, categoryId: 'new-parent' });
		await expect(operation).rejects.toBeInstanceOf(BadRequestException);
		expect(fixture.manager.createQueryBuilder).not.toHaveBeenCalled();
		expect(fixture.runner.rollbackTransaction).toHaveBeenCalledTimes(1);
		expect(fixture.runner.commitTransaction).not.toHaveBeenCalled();
		expect(fixture.audit.audit).not.toHaveBeenCalled();
		expect(fixture.runner.release).toHaveBeenCalledTimes(1);
	});

	it.each([Category, Subcategory])('rejects a missing %p without writing products', async (missingEntity) => {
		const fixture = createMoveFixture(true, true);
		fixture.manager.findOne.mockImplementation(async (entity: any) => entity === missingEntity ? null as any : fixture.category);
		await expect(fixture.service.moveProductsToSubcategory(dto, actor)).rejects.toBeInstanceOf(NotFoundException);
		expect(fixture.manager.createQueryBuilder).not.toHaveBeenCalled();
		expect(fixture.runner.rollbackTransaction).toHaveBeenCalledTimes(1);
		expect(fixture.runner.release).toHaveBeenCalledTimes(1);
	});

	it.each([0, 'failure'])('rolls back when the product update returns %s', async (outcome) => {
		const fixture = createMoveFixture(true, true);
		fixture.subcategory.categoryId = 'destination';
		const createQueryBuilder = fixture.manager.createQueryBuilder.getMockImplementation()!;
		fixture.manager.createQueryBuilder.mockImplementation(() => {
			const query = createQueryBuilder();
			if (outcome === 0) query.execute.mockResolvedValue({ affected: 0 });
			else query.execute.mockRejectedValue(new Error('Product update failed'));
			return query;
		});
		await expect(fixture.service.moveProductsToSubcategory(dto, actor)).rejects.toThrow();
		expect(fixture.runner.rollbackTransaction).toHaveBeenCalledTimes(1);
		expect(fixture.runner.commitTransaction).not.toHaveBeenCalled();
		expect(fixture.runner.release).toHaveBeenCalledTimes(1);
		expect(fixture.audit.audit).not.toHaveBeenCalled();
	});

	it('rejects empty selections before opening a transaction', async () => {
		const fixture = createMoveFixture(true, true);
		await expect(fixture.service.moveProductsToSubcategory({ ...dto, products: [] }, actor)).rejects.toBeInstanceOf(BadRequestException);
		expect(fixture.runner.connect).not.toHaveBeenCalled();
	});

	it('preserves a successful response if auditing fails after commit', async () => {
		const fixture = createMoveFixture(true, true);
		fixture.subcategory.categoryId = 'destination';
		fixture.audit.audit.mockRejectedValue(new Error('Audit unavailable'));
		const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
		try {
			await expect(fixture.service.moveProductsToSubcategory(dto, actor)).resolves.toMatchObject({ data: 2 });
			expect(fixture.runner.commitTransaction).toHaveBeenCalledTimes(1);
			expect(fixture.runner.rollbackTransaction).not.toHaveBeenCalled();
		} finally {
			errorLog.mockRestore();
		}
	});
});

describe('CategoryService.updateSubcategoriesStatus concurrent parent validation', () => {
	it('rejects an activation if the subcategory moves to an unvalidated parent before it is locked', async () => {
		const manager = {
			find: jest.fn()
				.mockResolvedValueOnce([{ id: 'subcategory', categoryId: 'origin' }])
				.mockResolvedValueOnce([{ id: 'origin' }])
				.mockResolvedValueOnce([{ id: 'subcategory', categoryId: 'destination' }]),
			createQueryBuilder: jest.fn(),
		};
		const service = new CategoryService({} as any, {} as any, {} as any, {} as any, { transaction: async (fn: any) => fn(manager) } as any, { audit: jest.fn() } as any, {} as any);
		await expect(service.updateSubcategoriesStatus({ ids: ['subcategory'], status: true }, actor)).rejects.toThrow('La categoría asignada cambió durante la operación. Inténtalo nuevamente.');
		expect(manager.createQueryBuilder).not.toHaveBeenCalled();
	});

	it('rejects activation under an inactive category before updating records', async () => {
		const manager = { find: jest.fn().mockResolvedValueOnce([{ id: 'subcategory', categoryId: 'origin' }]).mockResolvedValueOnce([]), createQueryBuilder: jest.fn() };
		const service = new CategoryService({} as any, {} as any, {} as any, {} as any, { transaction: async (fn: any) => fn(manager) } as any, { audit: jest.fn() } as any, {} as any);
		await expect(service.updateSubcategoriesStatus({ ids: ['subcategory'], status: true }, actor)).rejects.toThrow('No se pueden activar subcategorías cuya categoría se encuentra inactiva.');
		expect(manager.createQueryBuilder).not.toHaveBeenCalled();
	});
});
