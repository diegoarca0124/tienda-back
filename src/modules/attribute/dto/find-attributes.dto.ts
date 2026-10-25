import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import { ALLOWED_STATUS } from '../constants/allowed-status.constant';
import { ALLOWED_SORT } from '../constants/allowed-sort.constant';

const configuredMaxLimit = Number(process.env.MAX_LIMIT_QUERY);
const MAX_LIMIT = Number.isSafeInteger(configuredMaxLimit) && configuredMaxLimit > 0 ? configuredMaxLimit : 100;

const rejectRepeatedParameter = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		throw new BadRequestException({ code: 'INVALID_QUERY_PARAMS', message: 'Los parámetros de la URL no son válidos.' });
	}
	return value;
};

const transformPositiveInteger = (value: unknown, defaultValue: number): number => {
	value = rejectRepeatedParameter(value);
	if (value === undefined) return defaultValue;
	if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return Number.NaN;
	return Number(value);
};

export class FindAttributesQueryDto {
	@Transform(({ value }) => {
		value = rejectRepeatedParameter(value);
		return value === undefined ? '' : typeof value === 'string' ? value.trim() : value;
	})
	@IsString()
	@MaxLength(150)
	filter: string = '';

	@Transform(({ value }) => transformPositiveInteger(value, 1))
	@IsInt()
	@Min(1)
	@Max(100_000)
	page: number = 1;

	@Transform(({ value }) => transformPositiveInteger(value, 10))
	@IsInt()
	@Min(1)
	@Max(MAX_LIMIT)
	limit: number = 10;

	@Transform(({ value }) => rejectRepeatedParameter(value) ?? 'Todos')
	@IsString()
	@IsIn(ALLOWED_STATUS)
	status: (typeof ALLOWED_STATUS)[number] = 'Todos';

	@Transform(({ value }) => rejectRepeatedParameter(value) ?? 'Predeterminado')
	@IsString()
	@IsIn(ALLOWED_SORT)
	sort: (typeof ALLOWED_SORT)[number] = 'Predeterminado';
}
