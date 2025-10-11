import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { AttributeService } from '../attribute.service';
import { CreateAttributeValueDto } from '../dto/create-attribute-value.dto';


@Injectable()
export class CreateAttributeValueInterceptor extends BaseValidationInterceptor<CreateAttributeValueDto> {
  constructor(
      private readonly attributeService: AttributeService, 
      
  ) {
    super();
  }

  protected getDtoClass() {
    return CreateAttributeValueDto;
  }

  protected async validateBody(body: any): Promise<{ field: string, message: string }[]> {
    const customErrors: { field: string, message: string }[] = [];
    
    const fieldsErrors = await this.validateFieldsExist(body);
    fieldsErrors.forEach((item) => {
      customErrors.push({ field: item.field, message: item.msm });
    });

    return customErrors;
  }

  protected async validateFiles(files: any): Promise<{ field: string, message: string }[]> {
    return [];
  }

  private async validateFieldsExist(body: any): Promise<{msm:string, field:string}[]> {
    return [];
  }
}