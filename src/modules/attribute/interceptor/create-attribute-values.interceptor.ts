import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { CreateAttributeValuesDto } from '../dto/create-attribute-values.dto';

@Injectable()
export class CreateAttributeValuesInterceptor extends BaseValidationInterceptor<CreateAttributeValuesDto> {
	protected getDtoClass() {
		return CreateAttributeValuesDto;
	}
	protected async validateBody(): Promise<{ field: string; message: string }[]> {
		return [];
	}
	protected async validateFiles(): Promise<{ field: string; message: string }[]> {
		return [];
	}
}
