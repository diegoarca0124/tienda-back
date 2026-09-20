import { SelectQueryBuilder } from 'typeorm';
import { escapeLikePattern } from '@/common/utils/escape-like-pattern.util';
import { Brand } from '@/entities/brand.entity';
import { FindBrandsQueryDto } from '../dto/find-brands.dto';
export class FindBrandsBuilder {
    static applyFilters(qb: SelectQueryBuilder<Brand>, query: FindBrandsQueryDto) {
        this.applySearch(qb, query.filter);
        this.applyStatus(qb, query.status);
        this.applyCountries(qb, query.countries);
        this.applySort(qb, query.sort);
    }

    private static applySearch(qb: SelectQueryBuilder<Brand>, filter: string): void {
        const search = filter?.trim();
        if (!search) return;
        const normalizedSearch = search.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const pattern = `%${escapeLikePattern(normalizedSearch)}%`;
        const normalizeField = (field: string) => `translate(lower(COALESCE(${field}, '')), 'áéíóúüñ', 'aeiouun')`;
        const fields = ['brand.name'];
        const conditions = fields.map((field) => `${normalizeField(field)} LIKE lower(:pattern) ESCAPE '\\'`).join(' OR ');
        qb.andWhere(`(${conditions})`, { pattern });
    }

    private static applyStatus(qb: SelectQueryBuilder<Brand>, status: string): void {
        if (status === 'Todos') return;
        qb.andWhere('brand.status = :status', { status: status === 'Activos' });
    }

    private static applyCountries(qb: SelectQueryBuilder<Brand>, countries?: string): void {
        if (!countries || countries === 'Todos') return;

        const countryCodes = countries.split(',');
        qb.andWhere("brand.country ->> 'code' IN (:...countryCodes)", { countryCodes });
    }

    private static applySort(qb: SelectQueryBuilder<Brand>, sort: string): void {
        if (!sort || sort === 'Predeterminado') {
            qb.orderBy('brand.createdAt', 'DESC').addOrderBy('brand.id', 'ASC');
            return;
        }

        const [field, direction] = sort.split(':');
        const order = direction === 'asc' ? 'ASC' : 'DESC';

        switch (field) {
            case 'name':
                qb.orderBy('brand.name', order);
                break;
            default:
                qb.orderBy('brand.createdAt', 'DESC');
        }

        qb.addOrderBy('brand.id', 'ASC');
    }
}
