import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';

import { validateSvg } from '@/common/utils/validate-svg.util';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { AttributeService } from '../attribute.service';


@Injectable()
export class CreateAttributeInterceptor extends BaseValidationInterceptor<CreateAttributeDto> {
  constructor(
      private readonly attributeService: AttributeService, 
      
  ) {
    super();
  }

  protected getDtoClass() {
    return CreateAttributeDto;
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
    const messages : {msm:string, field:string}[] = [];

    if(body.name){
      const isNameTaken = await this.attributeService.validate_name_attribute(body.name);
      if(isNameTaken?.id != body.id){
        if (isNameTaken) {
          messages.push(
            {
              msm: 'El nombre no esta disponible, intente con otro.',
              field: 'name'
            }
          );
        }
      }
    }

    return messages;
  }
}