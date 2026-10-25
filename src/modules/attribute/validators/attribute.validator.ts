import { AttributeGroup } from '@/entities/attribute-group.entity';
import { AttributeValue } from '@/entities/attribute-value.entity';
import { Attribute } from '@/entities/attribute.entity';
import { Category } from '@/entities/category.entity';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { capitalizeWords } from '@/common/utils/string.util';

@Injectable()
export class AttributeValidator {
	constructor(
		@InjectRepository(Attribute)
		private readonly attributeRepository: Repository<Attribute>,

		@InjectRepository(AttributeGroup)
		private readonly attributeGroupRepository: Repository<AttributeGroup>,

		@InjectRepository(Category)
		private readonly categoryRepository: Repository<Category>,

		@InjectRepository(AttributeValue)
		private readonly attributeValueRepository: Repository<AttributeValue>
	) {}

	async existsAttributeGroup(attributeGroupId: string): Promise<boolean> {
		return this.attributeGroupRepository.exists({ where: { id: attributeGroupId } });
	}

	async validateAttributeNameNotExists(name: string, attributeGroupId: string): Promise<boolean> {
		return this.attributeRepository
			.createQueryBuilder('attribute')
			.where('LOWER(TRIM(attribute.name)) = LOWER(TRIM(:name))', { name })
			.andWhere('attribute.attributeGroupId = :attributeGroupId', { attributeGroupId })
			.getExists();
	}

	async existsAllCategories(categoryIds: string[]): Promise<boolean> {
		if (!Array.isArray(categoryIds) || !categoryIds.every((id) => isUUID(id, '4'))) return false;
		const uniqueIds = [...new Set(categoryIds)];
		const count = await this.categoryRepository.count({ where: { id: In(uniqueIds) } });
		return count === uniqueIds.length;
	}

	async existsNameGroupAttribute(name: string, excludeId?: string): Promise<boolean> {
		const query = this.attributeGroupRepository
			.createQueryBuilder('attributeGroup')
			.where('LOWER(TRIM(attributeGroup.name)) = LOWER(TRIM(:name))', { name: capitalizeWords(name) });
		if (excludeId) query.andWhere('attributeGroup.id != :excludeId', { excludeId });
		return query.getExists();
	}

	async existsAttributeNameForUpdate(name: string, id: string): Promise<boolean> {
		return this.attributeRepository
			.createQueryBuilder('attribute')
			.innerJoin(Attribute, 'currentAttribute', 'currentAttribute.attributeGroupId = attribute.attributeGroupId')
			.where('currentAttribute.id = :id', { id })
			.andWhere('attribute.id != :id', { id })
			.andWhere('LOWER(TRIM(attribute.name)) = LOWER(TRIM(:name))', { name: capitalizeWords(name) })
			.getExists();
	}

	async existsValueInAttribute(value: string, attributeId: string): Promise<boolean> {
		return this.attributeValueRepository
			.createQueryBuilder('attributeValue')
			.where('LOWER(TRIM(attributeValue.value)) = LOWER(TRIM(:value))', { value })
			.andWhere('attributeValue.attributeId = :attributeId', { attributeId })
			.getExists();
	}

	async existNameAttribute(name: string): Promise<{ id: string } | null> {
		return this.attributeRepository.createQueryBuilder('attribute').select(['attribute.id']).where('LOWER(TRIM(attribute.name)) = LOWER(TRIM(:name))', { name }).getOne();
	}
}
