import { Brand } from '@/entities/brand.entity';
import { Category } from '@/entities/category.entity';
import { ProductGroup } from '@/entities/product-group.entity';
import { Product } from '@/entities/product.entity';
import { Subcategory } from '@/entities/subcategory.entity';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class ProductValidator {
	constructor(
		@InjectRepository(Product)
		private readonly productRepository: Repository<Product>,

		@InjectRepository(Brand)
		private readonly brandRepository: Repository<Brand>,

		@InjectRepository(Category)
		private readonly categoryRepository: Repository<Category>,

		@InjectRepository(Subcategory)
		private readonly subcategoryRepository: Repository<Subcategory>,

		@InjectRepository(ProductGroup)
		private readonly productGroupRepository: Repository<ProductGroup>
	) {}

	async existsNameProduct(name: string): Promise<any> {
		return this.productRepository.createQueryBuilder('product')
		.select(['product.id'])
		.where('LOWER(TRIM(product.name)) = LOWER(TRIM(:name))', { name })
		.getOne();
	}

	async existsBrand(brandId: string): Promise<any> {
		return this.brandRepository
			.createQueryBuilder('brand')
			.select(['brand.id'])
			.where('brand.id = :brandId', { brandId })
			.getOne();
	}

	async existsCategory(categoryId: string): Promise<any> {
		return this.categoryRepository
			.createQueryBuilder('category')
			.select(['category.id'])
			.where('category.id = :categoryId', { categoryId })
			.getOne();
	}

	async existsSubcategory(subcategoryId: string): Promise<any> {
		return this.subcategoryRepository
			.createQueryBuilder('subcategory')
			.select(['subcategory.id'])
			.where('subcategory.id = :subcategoryId', { subcategoryId })
			.getOne();
	}

	async existsProductGroup(productGroupId: string): Promise<any> {
		return this.productGroupRepository
			.createQueryBuilder('productGroup')
			.select(['productGroup.id'])
			.where('productGroup.id = :productGroupId', { productGroupId })
			.getOne();
	}
}
