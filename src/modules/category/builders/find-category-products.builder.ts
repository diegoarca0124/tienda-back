import { Product } from '@/entities/product.entity';
import { SelectQueryBuilder } from 'typeorm';
import { FindCategoryProductsQueryDto } from '../dto/find-category-products.dto';
import { escapeLikePattern } from '@/common/utils/escape-like-pattern.util';

const PRICE_EXPRESSION = `COALESCE(NULLIF(product."priceDiscount", 0), product."priceRegular")`;

export class FindCategoryProductsBuilder {
	static applyFilters(
		qb: SelectQueryBuilder<Product>,
		query: FindCategoryProductsQueryDto,
	) {
		this.applySubcategory(qb, query.subcategoryIds);
		this.applySearch(qb, query.filter);
		this.applyStatus(qb, query.status);
		this.applyVisibility(qb, query.visibility);
		this.applyPrice(qb, query.minPrice, query.maxPrice);
		this.applyQuality(qb, query.quality);
		this.applySort(qb, query.sort);
	}

	private static applySubcategory(qb: SelectQueryBuilder<Product>, subcategoryIds?: string[]): void {
		if (!subcategoryIds?.length) return;
		qb.andWhere('product.subcategoryId IN (:...subcategoryIds)', { subcategoryIds });
	}

	private static applySearch(qb: SelectQueryBuilder<Product>, filter: string) {
		if (!filter?.trim()) return;

		const columns = [
			'product.name',
			'product.description',
			'product.extract',
			'brand.name',
			'subcategory.name',
		];

		const terms = filter
			.trim()
			.split(/\s+/)
			.map(term => escapeLikePattern(term.toLowerCase()));

		terms.forEach((term, index) => {
			const conditions = columns
				.map(column => `${column} ILIKE :term${index} ESCAPE '\\'`)
				.join(' OR ');

			qb.andWhere(`(${conditions})`, {
				[`term${index}`]: `%${term}%`,
			});
		});
	}

	private static applyStatus(qb: SelectQueryBuilder<Product>, status: string) {
		if (!status || status === 'Todos') {
			return;
		}

		qb.andWhere('product.status = :status', { status });
	}

	private static applyVisibility(qb: SelectQueryBuilder<Product>, visibility: string) {
		if (!visibility || visibility === 'Todos') return;
		qb.andWhere('product.visibility = :visibility', { visibility });
	}

	private static applyPrice(qb: SelectQueryBuilder<Product>,minPrice?: number,maxPrice?: number,) {
	if (minPrice !== undefined) {
		qb.andWhere(`${PRICE_EXPRESSION} >= :minPrice`, {
		minPrice,
		});
	}

	if (maxPrice !== undefined) {
		qb.andWhere(`${PRICE_EXPRESSION} <= :maxPrice`, {
		maxPrice,
		});
	}
	}

	private static applyQuality(qb: SelectQueryBuilder<Product>, quality: string) {
		switch (quality) {
			case 'low':
				qb.andWhere('product.quality <= :score', { score: 39 });
				break;

			case 'medium':
				qb.andWhere('product.quality > 39 AND product.quality <= 64');
				break;

			case 'high':
				qb.andWhere('product.quality > 64');
				break;
		}
	}

	private static applySort(qb: SelectQueryBuilder<Product>, sort: string): void {
		if (!sort || sort === 'Predeterminado') {
			qb.orderBy('product.createdAt', 'DESC').addOrderBy('product.id', 'ASC');
			return;
		}

		const [field, direction] = sort.split(':');
		const order = direction === 'asc' ? 'ASC' : 'DESC';

		switch (field) {
			case 'name':
				qb.orderBy('product.name', order);
				break;
			case 'quality':
				qb.orderBy('product.quality', order);
				break;
			case 'stockQuantity':
				qb.orderBy('product.stockQuantity', order);
				break;
			case 'priceRegular':
				qb.addSelect(PRICE_EXPRESSION, 'sort_price').orderBy('sort_price', order);
				break;
			default:
				qb.orderBy('product.createdAt', 'DESC');
		}

		qb.addOrderBy('product.id', 'ASC');
	}
}