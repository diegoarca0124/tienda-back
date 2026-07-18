import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, isUUID } from 'class-validator';

const ALLOWED_STATUS = ['Todos', 'draft', 'published'] as const;
const ALLOWED_SORT = ['Predeterminado', 'name:asc', 'name:desc', 'priceRegular:asc', 'priceRegular:desc', 'quality:asc', 'quality:desc', 'stockQuantity:asc', 'stockQuantity:desc'] as const;
const MAX_LIMIT = Number(process.env.MAX_LIMIT_QUERY || 100);
const ALLOWED_QUALITY = ['Todos', 'low', 'high', 'medium'] as const;
const ALLOWED_VISIBILITY = ['Todos', 'public', 'private'] as const;

const rejectRepeatedParameter = (value: unknown, parameter: string) => {
    console.log('rejectRepeatedParameter',value);
    
	if (Array.isArray(value)) {
		throw new BadRequestException(`El parámetro "${parameter}" no puede enviarse más de una vez.`);
	}

	return value;
};

export class FindCategoryProductsQueryDto {
	@IsOptional()
	@IsString()
	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'filter');
		return typeof value === 'string' ? value.trim() : '';
	})
	filter: string = '';

	@IsInt()
	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'page');
		const page = Number(value);
		return Number.isSafeInteger(page) && page > 0 && page <= 100000 ? page : 1;
	})
	page: number = 1;

	@IsInt()
	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'limit');
		const limit = Number(value);
		return Number.isSafeInteger(limit) && limit > 0 ? Math.min(limit, MAX_LIMIT) : 10;
	})
	limit: number = 10;

	@IsString()
	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'status');
		return typeof value === 'string' && ALLOWED_STATUS.includes(value as any) ? value : 'Todos';
	})
	status: string = 'Todos';

	@IsString()
	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'sort');
		return typeof value === 'string' && ALLOWED_SORT.includes(value as any) ? value : 'Predeterminado';
	})
	sort: string = 'Predeterminado';

	@IsString()
	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'subcategoryIds');

		if (typeof value !== 'string' || !value.trim()) return 'Todos';

		const ids = value.split(',').map(id => id.trim()).filter(id => isUUID(id));

		return ids.length ? ids.join(',') : 'Todos';
	})
	subcategoryIds: string = 'Todos';

	@IsString()
	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'quality');
		return typeof value === 'string' && ALLOWED_QUALITY.includes(value as any) ? value : 'Todos';
	})
	quality: string = 'Todos';

	@IsString()
	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'visibility');
		return typeof value === 'string' && ALLOWED_VISIBILITY.includes(value as any) ? value : 'Todos';
	})
	visibility: string = 'Todos';

	@IsOptional()
	@IsNumber({ allowNaN: false, allowInfinity: false })
	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'minPrice');

		if (value === undefined || value === null || value === '') return undefined;

		return Number(value);
	})
	minPrice?: string;

	@IsOptional()
	@IsNumber({ allowNaN: false, allowInfinity: false })
	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'maxPrice');

		if (value === undefined || value === null || value === '') return undefined;

		return Number(value);
	})
	maxPrice?: string;
}