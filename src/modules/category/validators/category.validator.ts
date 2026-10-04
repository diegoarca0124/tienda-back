import { capitalizeWords } from '@/common/utils/string.util';
import { Category } from '@/entities/category.entity';
import { Subcategory } from '@/entities/subcategory.entity';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { In, Repository } from 'typeorm';

@Injectable()
export class CategoryValidator {
	constructor(
		@InjectRepository(Category)
		private readonly categoryRepository: Repository<Category>,

		@InjectRepository(Subcategory)
		private readonly subcategoryRepository: Repository<Subcategory>
	) {}

	async existsIdCategory(id: string): Promise<any> {
		return this.categoryRepository.exists({ where: { id } });
	}

	async existsNameCategory(name: string): Promise<any> {
		return this.categoryRepository.createQueryBuilder('category').select(['category.id']).where('LOWER(TRIM(category.name)) = LOWER(TRIM(:name))', { name }).getOne();
	}

	async existsPrefixCategory(prefix: string): Promise<any> {
		return this.categoryRepository.createQueryBuilder('category').select(['category.id']).where('LOWER(TRIM(category.prefix)) = LOWER(TRIM(:prefix))', { prefix }).getOne();
	}

	async existsNameSubcategory(name: string): Promise<any> {
		return this.subcategoryRepository
			.createQueryBuilder('subcategory')
			.select(['subcategory.id'])
			.where('LOWER(TRIM(subcategory.name)) = LOWER(TRIM(:name))', { name })
			.getOne();
	}

	async existsPrefixSubcategory(prefix: string): Promise<any> {
		return this.subcategoryRepository
			.createQueryBuilder('subcategory')
			.select(['subcategory.id', 'subcategory.prefix'])
			.where('LOWER(TRIM(subcategory.prefix)) = LOWER(TRIM(:prefix))', { prefix })
			.getOne();
	}

	async existsSlugCategory(name: string, excludeCategoryId?: string): Promise<boolean> {
		const slug = slugify(capitalizeWords(name), {
			lower: true,
			strict: true,
			trim: true,
		});

		const queryBuilder = this.categoryRepository.createQueryBuilder('category').where('category.slug = :slug', { slug });

		if (excludeCategoryId) {
			queryBuilder.andWhere('category.id != :excludeCategoryId', { excludeCategoryId });
		}

		return queryBuilder.getExists();
	}

	async existsSlugSubcategory(name: string, excludeSubcategoryId?: string): Promise<boolean> {
		const slug = slugify(capitalizeWords(name), {
			lower: true,
			strict: true,
			trim: true,
		});

		const queryBuilder = this.subcategoryRepository.createQueryBuilder('subcategory').where('subcategory.slug = :slug', { slug });

		if (excludeSubcategoryId) {
			queryBuilder.andWhere('subcategory.id != :excludeSubcategoryId', { excludeSubcategoryId });
		}

		return queryBuilder.getExists();
	}
}
