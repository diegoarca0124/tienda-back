
import { SelectQueryBuilder } from 'typeorm';
import { escapeLikePattern } from '@/common/utils/escape-like-pattern.util';
import { FindCollaboratorsQueryDto } from '../dto/find-collaborators.dto';
import { Collaborator } from '@/entities/collaborator.entity';

export class FindCollaboratorsBuilder {
    static applyFilters(qb: SelectQueryBuilder<Collaborator>,query: FindCollaboratorsQueryDto) {
        this.applySearch(qb, query.filter);
        this.applyStatus(qb, query.status);
        this.applySort(qb, query.sort);
    }

    private static applySearch(qb: SelectQueryBuilder<Collaborator>, filter: string): void {
        const search = filter?.trim();
        if (!search) return;
        const normalizedSearch = search.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const pattern = `%${escapeLikePattern(normalizedSearch)}%`;
        const normalizeField = (field: string) => `translate(lower(COALESCE(${field}, '')), 'áéíóúüñ', 'aeiouun')`;
        const fields = ['collaborator.names', 'collaborator.surname', 'collaborator.fullnames', 'collaborator.email', 'collaborator.number_document', 'collaborator.phone'];
        const conditions = fields.map(field => `${normalizeField(field)} LIKE lower(:pattern) ESCAPE '\\'`).join(' OR ');
        qb.andWhere(`(${conditions})`, { pattern });
    }

    private static applyStatus(qb: SelectQueryBuilder<Collaborator>, status: string): void {
        if (status === 'Todos') return;
        qb.andWhere('collaborator.status = :status', { status: status === 'Activos' });
    }

    private static applySort(qb: SelectQueryBuilder<Collaborator>, sort: string): void {
        if (!sort || sort === 'Predeterminado') {
            qb.orderBy('collaborator.createdAt', 'DESC').addOrderBy('collaborator.id', 'ASC');
            return;
        }

        const [field, direction] = sort.split(':');
        const order = direction === 'asc' ? 'ASC' : 'DESC';

        switch (field) {
            case 'names':
                qb.orderBy('collaborator.names', order);
                break;
            case 'email':
                qb.orderBy('collaborator.email', order);
                break;
            case 'number_document':
                qb.orderBy('collaborator.number_document', order);
                break;
            default:
                qb.orderBy('collaborator.createdAt', 'DESC');
        }

        qb.addOrderBy('collaborator.id', 'ASC');
    }
}