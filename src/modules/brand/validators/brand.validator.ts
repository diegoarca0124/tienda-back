import { Brand } from '@/entities/brand.entity';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import slugify from 'slugify';
import { capitalizeWords } from '@/common/utils/string.util';

@Injectable()
export class BrandValidator {
	constructor(
		@InjectRepository(Brand)
		private readonly brandRepository: Repository<Brand>
	) {}

	async existsNameBrand(name: string, excludeBrandId?: string): Promise<boolean> {
		const queryBuilder = this.brandRepository.createQueryBuilder('brand').select(['brand.id']).where('LOWER(TRIM(brand.name)) = LOWER(TRIM(:name))', { name });

		if (excludeBrandId) {
			queryBuilder.andWhere('brand.id != :excludeBrandId', { excludeBrandId });
		}

		return queryBuilder.getExists();
	}

	async existsPrefixBrand(prefix: string, excludeBrandId?: string): Promise<boolean> {
		const queryBuilder = this.brandRepository.createQueryBuilder('brand').select(['brand.id']).where('LOWER(TRIM(brand.prefix)) = LOWER(TRIM(:prefix))', { prefix });

		if (excludeBrandId) {
			queryBuilder.andWhere('brand.id != :excludeBrandId', { excludeBrandId });
		}

		return queryBuilder.getExists();
	}

	async existsSlugBrand(name: string, excludeBrandId?: string): Promise<boolean> {
		const slug = slugify(capitalizeWords(name), {
			lower: true,
			strict: true,
			trim: true,
		});

		const queryBuilder = this.brandRepository.createQueryBuilder('brand').where('brand.slug = :slug', { slug });

		if (excludeBrandId) {
			queryBuilder.andWhere('brand.id != :excludeBrandId', { excludeBrandId });
		}

		return queryBuilder.getExists();
	}
}
