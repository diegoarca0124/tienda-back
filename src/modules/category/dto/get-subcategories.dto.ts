import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';

export class GetSubcategoriesQueryDto {
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	@IsString()
	@MaxLength(150)
	filter: string = '';
}
