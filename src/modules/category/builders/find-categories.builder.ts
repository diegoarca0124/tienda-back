
import { SelectQueryBuilder } from 'typeorm';
import { escapeLikePattern } from '@/common/utils/escape-like-pattern.util';
import { Category } from '@/entities/category.entity';
import { FindCategoriesQueryDto } from '../dto/find-categories.dto';
import { AllowedConfiguration } from '../constants/allowed-configurations.constant';
export class FindCategoriesBuilder {
    
    static applyFilters(qb: SelectQueryBuilder<Category>,query: FindCategoriesQueryDto) {
        this.applySearch(qb, query.filter);
        this.applyStatus(qb, query.status);
        this.applyConfigurations(qb, query.configurations);
        this.applySort(qb, query.sort);
    }

    private static applySearch(qb: SelectQueryBuilder<Category>, filter: string): void {
        const search = filter?.trim();
        if (!search) return;
        const normalizedSearch = search.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const pattern = `%${escapeLikePattern(normalizedSearch)}%`;
        const normalizeField = (field: string) => `translate(lower(COALESCE(${field}, '')), 'áéíóúüñ', 'aeiouun')`;
        const fields = ['category.name'];
        const conditions = fields.map(field => `${normalizeField(field)} LIKE lower(:pattern) ESCAPE '\\'`).join(' OR ');
        qb.andWhere(`(${conditions})`, { pattern });
    }

    private static applyStatus(qb: SelectQueryBuilder<Category>, status: string): void {
        if (status === 'Todos') return;
        qb.andWhere('category.status = :status', { status: status === 'Activos' });
    }

    private static applyConfigurations(
        qb: SelectQueryBuilder<Category>,
        configurations: AllowedConfiguration[],
    ): void {
        if (!configurations?.length || configurations.includes('Predeterminado')) return;

        const conditions: string[] = [];

        if (configurations.includes('isDimensions')) {
            conditions.push('"category"."isDimensions" = true');
        }

        if (configurations.includes('isCharacteristics')) {
            conditions.push('"category"."isCharacteristics" = true');
        }

        if (configurations.includes('isCondition')) {
            conditions.push('"category"."isCondition" = true');
        }

        if (configurations.includes('isWarranty')) {
            conditions.push('"category"."isWarranty" = true');
        }

        if (configurations.includes('isCountryOfOrigin')) {
            conditions.push('"category"."isCountryOfOrigin" = true');
        }

        if (configurations.includes('isMaterial')) {
            conditions.push('"category"."isMaterial" = true');
        }

        if (configurations.includes('isTemperature')) {
            conditions.push('"category"."isTemperature" = true');
        }

        if (conditions.length) {
            qb.andWhere(`(${conditions.join(' OR ')})`);
        }
    }


    private static applySort(qb: SelectQueryBuilder<Category>, sort: string): void {
        if (!sort || sort === 'Predeterminado') {
            qb.orderBy('category.createdAt', 'DESC').addOrderBy('category.id', 'ASC');
            return;
        }

        const [field, direction] = sort.split(':');
        const order = direction === 'asc' ? 'ASC' : 'DESC';

        switch (field) {
            case 'name':
                qb.orderBy('category.name', order);
                break;
            default:
                qb.orderBy('category.createdAt', 'DESC');
        }

        qb.addOrderBy('category.id', 'ASC');
    }
}