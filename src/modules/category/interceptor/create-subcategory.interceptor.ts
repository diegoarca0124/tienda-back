import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CategoryService } from '../category.service';
import { validateSvg } from '@/common/utils/validate-svg.util';
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';


@Injectable()
export class CreateSubcategoryInterceptor extends BaseValidationInterceptor<CreateSubcategoryDto> {
  constructor(
      private readonly categoryService: CategoryService, 
      
  ) {
    super();
  }

  protected getDtoClass() {
    return CreateSubcategoryDto;
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

    if(body.icon){
      const resValidateIcon = validateSvg(body.icon);
      console.log('resValidateIcon',resValidateIcon);
      if(!resValidateIcon.valid){
        messages.push(
          {
            msm: resValidateIcon.reason || '',
            field: 'icon'
          }
        );
      }
    }

    if(body.name){
      const isNameTaken = await this.categoryService.validate_name_subcategory(body.categoryId,body.name);
      if(isNameTaken?.id != body.id){
        if (isNameTaken) {
          messages.push(
            {
              msm: 'El titulo no esta disponible, intente con otro.',
              field: 'name'
            }
          );
        }
      }
    }

    return messages;
  }
}