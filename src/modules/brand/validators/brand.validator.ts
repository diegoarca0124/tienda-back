import { Brand } from '@/entities/brand.entity';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class BrandValidator {
	constructor(
		@InjectRepository(Brand)
		private readonly brandRepository: Repository<Brand>
	) {}

	async existsNameBrand(name: string): Promise<any> {
		return this.brandRepository.createQueryBuilder('brand').select(['brand.id']).where('LOWER(TRIM(brand.name)) = LOWER(TRIM(:name))', { name }).getOne();
	}

	async existsPrefixBrand(prefix: string): Promise<any> {
		return this.brandRepository.createQueryBuilder('brand').select(['brand.id']).where('LOWER(TRIM(brand.prefix)) = LOWER(TRIM(:prefix))', { prefix }).getOne();
	}
}
