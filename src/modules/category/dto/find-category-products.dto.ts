import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, isUUID } from 'class-validator';

const ALLOWED_STATUS = ['Todos', 'draft', 'published'] as const;
const ALLOWED_SORT = [
    'Predeterminado',
    'name:asc',
    'name:desc',
    'priceRegular:asc',
    'priceRegular:desc',
    'quality:asc',
    'quality:desc',
    'stockQuantity:asc',
    'stockQuantity:desc',
] as const;
const MAX_LIMIT = Number(process.env.MAX_LIMIT_QUERY || 100);
const ALLOWED_QUALITY = ['Todos', 'low', 'high', 'medium'] as const;
const ALLOWED_VISIBILITY = ['Todos', 'public', 'private'] as const;

export class FindCategoryProductsQueryDto {
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim() ?? '')
    filter: string = '';

    @IsInt()
    @Transform(({ value }) => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : 1)
    page: number = 1;

    @IsInt()
    @Transform(({ value }) => Math.min(Math.max(1, Number(value) || 10), MAX_LIMIT))
    limit: number = 10;

    @IsString()
    @Transform(({ value }) => typeof value === 'string' && ALLOWED_STATUS.includes(value as any) ? value : 'Todos')
    status: string = 'Todos';

    @IsString()
    @Transform(({ value }) => typeof value === 'string' && ALLOWED_SORT.includes(value as any) ? value : 'Predeterminado')
    sort: string = 'Predeterminado';

    @IsString()
    @Transform(({ value }) => {
        if (typeof value !== 'string' || !value.trim()) return 'Todos';

        const ids = value
            .split(',')
            .map(id => id.trim())
            .filter(id => isUUID(id));

        return ids.length ? ids.join(',') : 'Todos';
    })
    subcategoryIds: string = 'Todos';

    @IsString()
    @Transform(({ value }) => typeof value === 'string' && ALLOWED_QUALITY.includes(value as any) ? value : 'Todos')
    quality: string = 'Todos';

    @IsString()
    @Transform(({ value }) => typeof value === 'string' && ALLOWED_VISIBILITY.includes(value as any) ? value : 'Todos')
    visibility: string = 'Todos';

    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }

        const price = Number(value);
        return Number.isFinite(price) ? price : NaN;
    })
    minPrice?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }

        const price = Number(value);
        return Number.isFinite(price) ? price : NaN;
    })
    maxPrice?: string;
}