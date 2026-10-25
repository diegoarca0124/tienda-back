import { SelectQueryBuilder } from 'typeorm';
import { Attribute } from '@/entities/attribute.entity';
import { escapeLikePattern } from '@/common/utils/escape-like-pattern.util';
import { FindAttributesQueryDto } from '../dto/find-attributes.dto';

export class FindAttributesBuilder {
	static applyFilters(qb: SelectQueryBuilder<Attribute>, query: FindAttributesQueryDto): void {
		this.applySearch(qb, query.filter);
		this.applyStatus(qb, query.status);
		this.applySort(qb, query.sort);
	}

	private static applySearch(qb: SelectQueryBuilder<Attribute>, filter: string): void {
		const search = filter?.trim();
		if (!search) return;

		const terms = search
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.split(/\s+/);
		const normalizedName = "translate(lower(COALESCE(attribute.name, '')), 'áéíóúüñ', 'aeiouun')";

		terms.forEach((term, index) => {
			const parameterName = `searchTerm${index}`;
			qb.andWhere(`${normalizedName} LIKE :${parameterName} ESCAPE '\\'`, { [parameterName]: `%${escapeLikePattern(term)}%` });
		});
	}

	private static applyStatus(qb: SelectQueryBuilder<Attribute>, status: string): void {
		if (status === 'Todos') return;
		qb.andWhere('attribute.status = :status', { status: status === 'Activos' });
	}

	private static applySort(qb: SelectQueryBuilder<Attribute>, sort: string): void {
		if (!sort || sort === 'Predeterminado') {
			qb.orderBy('attribute.createdAt', 'DESC').addOrderBy('attribute.id', 'ASC');
			return;
		}

		const [field, direction] = sort.split(':');
		const order = direction === 'asc' ? 'ASC' : 'DESC';
		switch (field) {
			case 'name':
				qb.orderBy('attribute.name', order);
				break;
			case 'createdAt':
				qb.orderBy('attribute.createdAt', order);
				break;
			default:
				qb.orderBy('attribute.createdAt', 'DESC');
		}
		qb.addOrderBy('attribute.id', 'ASC');
	}
}
