import { SelectQueryBuilder } from 'typeorm';
import { AttributeGroup } from '@/entities/attribute-group.entity';
import { escapeLikePattern } from '@/common/utils/escape-like-pattern.util';
import { FindAttributesGroupsQueryDto } from '../dto/find-attributes-groups.dto';

export class FindAttributesGroupsBuilder {
	static applyFilters(qb: SelectQueryBuilder<AttributeGroup>, query: FindAttributesGroupsQueryDto): void {
		this.applySearch(qb, query.filter);
		this.applyStatus(qb, query.status);
		this.applyCategories(qb, query.categories);
		this.applySort(qb, query.sort);
	}

	private static applySearch(qb: SelectQueryBuilder<AttributeGroup>, filter: string): void {
		const search = filter?.trim();
		if (!search) return;

		const terms = search
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.split(/\s+/);
		const normalizedName = "translate(lower(COALESCE(attributeGroup.name, '')), 'áéíóúüñ', 'aeiouun')";

		terms.forEach((term, index) => {
			const parameterName = `searchTerm${index}`;
			qb.andWhere(`${normalizedName} LIKE :${parameterName} ESCAPE '\\'`, { [parameterName]: `%${escapeLikePattern(term)}%` });
		});
	}

	private static applyStatus(qb: SelectQueryBuilder<AttributeGroup>, status: string): void {
		if (status === 'Todos') return;
		qb.andWhere('attributeGroup.status = :status', { status: status === 'Activos' });
	}

	private static applyCategories(qb: SelectQueryBuilder<AttributeGroup>, categories: string): void {
		if (categories === 'Todos') return;
		const categoryIds = categories.split(',');
		qb.innerJoin('attributeGroup.attributeCategories', 'filterAttributeCategory', 'filterAttributeCategory.categoryId IN (:...categoryIds)', { categoryIds });
	}

	private static applySort(qb: SelectQueryBuilder<AttributeGroup>, sort: string): void {
		if (!sort || sort === 'Predeterminado') {
			qb.orderBy('attributeGroup.createdAt', 'DESC').addOrderBy('attributeGroup.id', 'ASC');
			return;
		}

		const [field, direction] = sort.split(':');
		const order = direction === 'asc' ? 'ASC' : 'DESC';
		switch (field) {
			case 'name':
				qb.orderBy('attributeGroup.name', order);
				break;
			case 'createdAt':
				qb.orderBy('attributeGroup.createdAt', order);
				break;
			default:
				qb.orderBy('attributeGroup.createdAt', 'DESC');
		}
		qb.addOrderBy('attributeGroup.id', 'ASC');
	}
}
