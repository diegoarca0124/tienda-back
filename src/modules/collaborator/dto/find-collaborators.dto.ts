import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';

const ALLOWED_STATUS = ['Todos', 'Activos','Inactivos'] as const;
const ALLOWED_SORT = ['Predeterminado', 'names:asc', 'names:desc', 'email:asc', 'email:desc', 'number_document:asc', 'number_document:desc'] as const;

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

const transformPositiveInteger = (value: unknown, parameter: string, defaultValue: number): number => {
    value = rejectRepeatedParameter(value, parameter);
    if (value === undefined) return defaultValue;
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return Number.NaN;
    return Number(value);
};

export class FindCollaboratorsQueryDto {
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
}