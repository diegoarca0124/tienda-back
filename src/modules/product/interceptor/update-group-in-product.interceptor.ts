import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { ProductService } from '../product.service';
import { CreateProductDescriptiomDto } from '../dto/create-product-description.dto';
import { UpdateNameVariationDto } from '../dto/update-name-variation.dto';
import { UpdateGroupInProductDto } from '../dto/update-group-in-product.dto';

@Injectable()
export class UpdateGroupInProductInterceptor extends BaseValidationInterceptor<UpdateGroupInProductDto> {
	constructor(private readonly productService: ProductService) {
		super();
	}

	protected getDtoClass() {
		return UpdateGroupInProductDto;
	}

	protected async validateBody(body: any): Promise<{ field: string; message: string }[]> {
		const customErrors: { field: string; message: string }[] = [];

		const fieldsErrors = await this.validateFieldsExist(body);
		fieldsErrors.forEach((item) => {
			customErrors.push({ field: item.field, message: item.msm });
		});

		return customErrors;
	}

	protected async validateFiles(files: any): Promise<{ field: string; message: string }[]> {
		return [];
	}

	private async validateFieldsExist(body: any): Promise<{ msm: string; field: string }[]> {
		return [];
	}
}
