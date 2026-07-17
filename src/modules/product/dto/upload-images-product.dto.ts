import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadImagesProductProductDto {
	@IsUUID('4', { message: 'El producto debe ser un UUID válido.' })
	@IsNotEmpty({ message: 'El producto es requerida.' })
	productId: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	gallery?: string[];
}
