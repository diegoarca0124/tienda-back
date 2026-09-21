import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { ALLOWED_STATUS } from '../constants/allowed-status.constant';
import { ALLOWED_SORT } from '../constants/allowed-sort.constant';
import { ALLOWED_COUNTRIES } from '../constants/allowed-contries.contant';

const configuredMaxLimit = Number(process.env.MAX_LIMIT_QUERY);
const MAX_LIMIT = Number.isSafeInteger(configuredMaxLimit) && configuredMaxLimit > 0 ? configuredMaxLimit : 100;
const ALLOWED_COUNTRY_CODES = ALLOWED_COUNTRIES.map((country) => country.code);
const COUNTRY_CODES_PATTERN = ALLOWED_COUNTRY_CODES.join('|');
const COUNTRIES_PATTERN = new RegExp(`^(?:Todos|(?:${COUNTRY_CODES_PATTERN})(?:,(?:${COUNTRY_CODES_PATTERN}))*)$`);

const rejectRepeatedParameter = (value: unknown, parameter: string): unknown => {
	if (Array.isArray(value)) {
		throw new BadRequestException({
			code: 'INVALID_QUERY_PARAMS',
			message: 'Los parámetros de la URL no son válidos.',
		});
	}
	return value;
};

const transformPositiveInteger = (value: unknown, parameter: string, defaultValue: number): number => {
	value = rejectRepeatedParameter(value, parameter);
	if (value === undefined) return defaultValue;
	if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return Number.NaN;
	return Number(value);
};

export class FindBrandsQueryDto {
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
	status: (typeof ALLOWED_STATUS)[number] = 'Todos';

	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'sort');
		return value === undefined ? 'Predeterminado' : value;
	})
	@IsString()
	@IsIn(ALLOWED_SORT)
	sort: (typeof ALLOWED_SORT)[number] = 'Predeterminado';

	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value, 'countries');

		if (value === undefined || value === '') {
			return undefined;
		}

		if (typeof value !== 'string') return value;

		const normalizedValue = value.trim();
		if (normalizedValue.toLowerCase() === 'todos') return 'Todos';

		return normalizedValue
			.split(',')
			.map((country) => country.trim().toUpperCase())
			.join(',');
	})
	@IsOptional()
	@IsString()
	@Matches(COUNTRIES_PATTERN)
	countries?: string;
}
