import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { ProductService } from '../product.service';
import { CreateProductDescriptiomDto } from '../dto/create-product-description.dto';

@Injectable()
export class CreateProductDescriptionInterceptor extends BaseValidationInterceptor<CreateProductDescriptiomDto> {
	constructor(private readonly productService: ProductService) {
		super();
	}

	protected getDtoClass() {
		return CreateProductDescriptiomDto;
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
