import { plainToInstance } from 'class-transformer';
import { getMetadataArgsStorage, Raw } from 'typeorm';
import { Collaborator } from '@/entities/collaborator.entity';
import { AuthService } from '@/auth/auth.service';
import { CollaboratorService } from './collaborator.service';
import { CreateCollaboratorDto } from './dto/create-collaborator.dto';
import { EditCollaboratorDto } from './dto/edit-collaborator.dto';
import { ValidateImportCollaboratorDto } from './dto/import-collaborators.dto';
import { LoginDto } from './dto/login.dto';

describe('collaborator bug fixes', () => {
	it('allows both complete names and their separating space', () => {
		const column = getMetadataArgsStorage().columns.find((item) => item.target === Collaborator && item.propertyName === 'fullnames');
		expect(column?.options.length).toBe(201);
	});

	it('normalizes email in every input DTO', () => {
		for (const dto of [CreateCollaboratorDto, EditCollaboratorDto, ValidateImportCollaboratorDto, LoginDto]) {
			expect(plainToInstance<{ email: string }, { email: string }>(dto, { email: ' Ana@Example.com ' }).email).toBe('ana@example.com');
		}
	});

	it('looks up existing emails without case sensitivity at login', async () => {
		const findOne = jest.fn().mockResolvedValue(null);
		const service: CollaboratorService = Object.assign(Object.create(CollaboratorService.prototype), { collaboratorRepository: { findOne } });
		await expect(service.login({ email: 'ANA@example.com', password: 'password' })).rejects.toThrow();
		expect(findOne.mock.calls[0][0].where.email.getSql('email')).toBe('LOWER(TRIM(email)) = :email');
		expect(findOne.mock.calls[0][0].where.email.objectLiteralParameters).toEqual({ email: 'ana@example.com' });
	});

	it('matches a legacy mixed-case email without overwriting its current password during import', async () => {
		const existing = { id: 'user', email: 'Ana@Example.com', password: 'old-hash', status: true };
		const update = jest.fn().mockResolvedValue({ affected: 1 });
		const save = jest.fn();
		const find = jest.fn().mockResolvedValue([existing]);
		const service: CollaboratorService = Object.assign(Object.create(CollaboratorService.prototype), {
			collaboratorRepository: { find, manager: { transaction: (action) => action({ update, save }) } },
			kibanaService: { audit: jest.fn() },
		});
		const result = await service.importCollaborators(
			{
				mode: 'upsert',
				identifyBy: 'email',
				data: [{ email: 'ANA@example.com', names: 'Ana', surname: 'Perez', status: true }],
			},
			{ user: { id: 'admin' }, requestId: 'test' } as any
		);
		expect(result).toMatchObject({ created: 0, updated: 1 });
		expect(find.mock.calls[0][0].where.email.type).toBe(Raw(() => '').type);
		expect(find.mock.calls[0][0].where.email.getSql('email')).toContain('LOWER(TRIM(email))');
		expect(update).toHaveBeenCalledWith(Collaborator, 'user', expect.objectContaining({ email: 'ana@example.com', fullnames: 'Ana Perez' }));
		expect(update.mock.calls[0][2]).not.toHaveProperty('password');
		expect(save).not.toHaveBeenCalled();
	});

	it('keeps a newly opened session tracked during revocation', async () => {
		const oldToken = JSON.stringify({ jti: 'old', exp: 9999999999 });
		const newToken = JSON.stringify({ jti: 'new', exp: 9999999999 });
		const tracked = new Set([oldToken]);
		const redis = {
			getSetMembers: jest.fn(async () => [...tracked]),
			set: jest.fn(async () => {
				tracked.add(newToken);
			}),
			removeSetMembers: jest.fn(async (_key: string, members: string[]) => {
				members.forEach((member) => tracked.delete(member));
			}),
		};
		const service = new AuthService({} as any, redis as any, {} as any);
		await expect(service.revokeUserTokens('user')).resolves.toBe(1);
		expect([...tracked]).toEqual([newToken]);
		await service.revokeUserTokens('user');
		expect(redis.set).toHaveBeenCalledWith('revoked:new', 'true', expect.any(Number));
	});

	it('keeps session tracking available for retry if revocation fails', async () => {
		const removeSetMembers = jest.fn();
		const service = new AuthService(
			{} as any,
			{
				getSetMembers: async () => [JSON.stringify({ jti: 'old' })],
				set: async () => {
					throw new Error('Redis unavailable');
				},
				removeSetMembers,
			} as any,
			{} as any
		);
		await expect(service.revokeUserTokens('user')).rejects.toThrow('Redis unavailable');
		expect(removeSetMembers).not.toHaveBeenCalled();
	});
});
