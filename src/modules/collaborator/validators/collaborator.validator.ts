import { Collaborator } from '@/entities/collaborator.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CollaboratorValidator {
	constructor(
		@InjectRepository(Collaborator)
		private readonly collaboratorRepository: Repository<Collaborator>
	) {}

	async existsIdCollaborator(id: string): Promise<boolean> {
		return this.collaboratorRepository.exists({ where: { id } });
	}

	async existsEmailCollaborator(email: string): Promise<{ id: string } | null> {
		return this.collaboratorRepository
			.createQueryBuilder('collaborator')
			.select(['collaborator.id'])
			.where('LOWER(TRIM(collaborator.email)) = LOWER(TRIM(:email))', { email })
			.getOne();
	}

	async existsDocumentNumberCollaborator(number_document: string): Promise<{ id: string } | null> {
		return this.collaboratorRepository
			.createQueryBuilder('collaborator')
			.select(['collaborator.id'])
			.where('LOWER(TRIM(collaborator.number_document)) = LOWER(TRIM(:number_document))', { number_document })
			.getOne();
	}

	async existsPhoneCollaborator(phone: string): Promise<{ id: string } | null> {
		return this.collaboratorRepository
			.createQueryBuilder('collaborator')
			.select(['collaborator.id'])
			.where('LOWER(TRIM(collaborator.phone)) = LOWER(TRIM(:phone))', { phone })
			.getOne();
	}
}
