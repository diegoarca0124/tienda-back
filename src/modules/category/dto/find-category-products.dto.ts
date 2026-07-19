import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';

const ALLOWED_STATUS = ['Todos', 'draft', 'published'] as const;
const ALLOWED_SORT = ['Predeterminado', 'name:asc', 'name:desc', 'priceRegular:asc', 'priceRegular:desc', 'quality:asc', 'quality:desc', 'stockQuantity:asc', 'stockQuantity:desc'] as const;
const ALLOWED_QUALITY = ['Todos', 'low', 'medium', 'high'] as const;
const ALLOWED_VISIBILITY = ['Todos', 'public', 'private'] as const;

const configuredMaxLimit = Number(process.env.MAX_LIMIT_QUERY);
const MAX_LIMIT = Number.isSafeInteger(configuredMaxLimit) && configuredMaxLimit > 0 ? configuredMaxLimit : 100;

const rejectRepeatedParameter = (value: unknown, parameter: string): unknown => {
	if (Array.isArray(value)) {
		throw new BadRequestException({
			code: 'INVALID_QUERY_PARAMS',
			message: 'Los parámetros de la URL no son válidos.',
		});
	}
	return value;
};

const transformOptionalPrice = (value: unknown, parameter: string): number | undefined => {
	value = rejectRepeatedParameter(value, parameter);
	if (value === undefined) return undefined;
	if (typeof value !== 'string' || value.trim() === '') return Number.NaN;
	if (!/^\d+(\.\d+)?$/.test(value.trim())) return Number.NaN;
	return Number(value);
};

const transformPositiveInteger = (value: unknown, parameter: string, defaultValue: number): number => {
	value = rejectRepeatedParameter(value, parameter);
	if (value === undefined) return defaultValue;
	if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return Number.NaN;
	return Number(value);
};

export class FindCategoryProductsQueryDto {
	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'filter');
		return value === undefined ? '' : typeof value === 'string' ? value.trim() : value;
	})
	@IsString()
	@MaxLength(150)
	filter: string = '';

	@Transform(({ value }) => transformPositiveInteger(value, 'page', 1))
	@IsInt()
	@Min(1)
	@Max(100_000)
	page: number = 1;

	@Transform(({ value }) => transformPositiveInteger(value, 'limit', 10))
	@IsInt()
	@Min(1)
	@Max(MAX_LIMIT)
	limit: number = 10;

	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'status');
		return value === undefined ? 'Todos' : value;
	})
	@IsString()
	@IsIn(ALLOWED_STATUS)
	status: typeof ALLOWED_STATUS[number] = 'Todos';

	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'sort');
		return value === undefined ? 'Predeterminado' : value;
	})
	@IsString()
	@IsIn(ALLOWED_SORT)
	sort: typeof ALLOWED_SORT[number] = 'Predeterminado';

	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'subcategoryIds');
		if (value === undefined || value === 'Todos') return undefined;
		if (typeof value !== 'string') return value;
		return [...new Set(value.split(',').map(id => id.trim().toLowerCase()))];
	})
	@IsOptional()
	@IsUUID('4', { each: true })
	subcategoryIds?: string[];

	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'quality');
		return value === undefined ? 'Todos' : value;
	})
	@IsString()
	@IsIn(ALLOWED_QUALITY)
	quality: typeof ALLOWED_QUALITY[number] = 'Todos';

	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'visibility');
		return value === undefined ? 'Todos' : value;
	})
	@IsString()
	@IsIn(ALLOWED_VISIBILITY)
	visibility: typeof ALLOWED_VISIBILITY[number] = 'Todos';

	@Transform(({ value }) => transformOptionalPrice(value, 'minPrice'))
	@IsOptional()
	@IsNumber({ allowNaN: false, allowInfinity: false })
	@Min(0)
	minPrice?: number;

	@Transform(({ value }) => transformOptionalPrice(value, 'maxPrice'))
	@IsOptional()
	@IsNumber({ allowNaN: false, allowInfinity: false })
	@Min(0)
	maxPrice?: number;
}