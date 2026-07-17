import { Collaborator } from '@/entities/collaborator.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class CollaboratorValidator {
	constructor(
		@InjectRepository(Collaborator)
		private readonly collaboratorRepository: Repository<Collaborator>
	) {}

	async existsIdCollaborator(id: string): Promise<any> {
		return this.collaboratorRepository.exists({ where: { id } });
	}

	async existsEmailCollaborator(email): Promise<any> {
		return this.collaboratorRepository
			.createQueryBuilder('collaborator')
			.select(['collaborator.id'])
			.where('LOWER(TRIM(collaborator.email)) = LOWER(TRIM(:email))', { email })
			.getOne();
	}

	async existsDocumentNumberCollaborator(number_document): Promise<any> {
		return this.collaboratorRepository
			.createQueryBuilder('collaborator')
			.select(['collaborator.id'])
			.where('LOWER(TRIM(collaborator.number_document)) = LOWER(TRIM(:number_document))', { number_document })
			.getOne();
	}

	async existsPhoneCollaborator(phone): Promise<any> {
		return this.collaboratorRepository
			.createQueryBuilder('collaborator')
			.select(['collaborator.id'])
			.where('LOWER(TRIM(collaborator.phone)) = LOWER(TRIM(:phone))', { phone })
			.getOne();
	}
}
