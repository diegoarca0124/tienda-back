
import { SelectQueryBuilder } from 'typeorm';
import { escapeLikePattern } from '@/common/utils/escape-like-pattern.util';
import { Category } from '@/entities/category.entity';
import { FindCategoriesQueryDto } from '../dto/find-categories.dto';
import { ALLOWED_CONFIGURATION } from '../constants/allowed-configurations.constant';
export class FindCategoriesBuilder {
    
    static applyFilters(qb: SelectQueryBuilder<Category>,query: FindCategoriesQueryDto) {
        this.applySearch(qb, query.filter);
        this.applyStatus(qb, query.status);
        this.applyConfiguration(qb, query.configuration);
        this.applySort(qb, query.sort);
    }

    private static applySearch(qb: SelectQueryBuilder<Category>, filter: string): void {
        const search = filter?.trim();
        if (!search) return;
        const normalizedSearch = search.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const pattern = `%${escapeLikePattern(normalizedSearch)}%`;
        const normalizeField = (field: string) => `translate(lower(COALESCE(${field}, '')), 'áéíóúüñ', 'aeiouun')`;
        const fields = ['category.names'];
        const conditions = fields.map(field => `${normalizeField(field)} LIKE lower(:pattern) ESCAPE '\\'`).join(' OR ');
        qb.andWhere(`(${conditions})`, { pattern });
    }

    private static applyStatus(qb: SelectQueryBuilder<Category>, status: string): void {
        if (status === 'Todos') return;
        qb.andWhere('category.status = :status', { status: status === 'Activos' });
    }

    private static applyConfiguration(qb: SelectQueryBuilder<Category>, configuration: string): void {
        const value = configuration?.trim();
        if (!value || value === 'Predeterminado') return;
        if (!ALLOWED_CONFIGURATION.includes(value as typeof ALLOWED_CONFIGURATION[number])) return;
        qb.andWhere(`category.${value} = :configuration`, { configuration: true });
    }


    private static applySort(qb: SelectQueryBuilder<Category>, sort: string): void {
        if (!sort || sort === 'Predeterminado') {
            qb.orderBy('category.createdAt', 'DESC').addOrderBy('category.id', 'ASC');
            return;
        }

        const [field, direction] = sort.split(':');
        const order = direction === 'asc' ? 'ASC' : 'DESC';

        switch (field) {
            case 'names':
                qb.orderBy('category.names', order);
                break;
            default:
                qb.orderBy('category.createdAt', 'DESC');
        }

        qb.addOrderBy('category.id', 'ASC');
    }
}