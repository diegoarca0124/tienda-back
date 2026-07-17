import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { validateSvg } from '@/common/utils/validate-svg.util';
import { validateUrl } from '@/common/utils/validate-url.util';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductService } from '../product.service';
import { ProductValidator } from '../validators/product.validator';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class UpdateProductInterceptor extends BaseValidationInterceptor<UpdateProductDto> {
    constructor(private readonly productValidator: ProductValidator) {
        super();
    }

    protected getDtoClass() {
        return UpdateProductDto;
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
        const customErrors: { field: string; message: string }[] = [];
        const imageImages = await this.validateImages(files);
        imageImages.forEach((item) => {
            customErrors.push({ field: item.field, message: item.msm });
        });

        return customErrors;
    }

    private async validateImages(files?: { [key: string]: Express.Multer.File[] }): Promise<{ msm: string; field: string }[]> {
        return [];
    }

    private async validateFieldsExist(body: any): Promise<{ msm: string; field: string }[]> {
        const messages: { msm: string; field: string }[] = [];

        if (body.name) {
            const isNameExist = await this.productValidator.existsNameProduct(body.name);
            if (isNameExist && isNameExist.id != body.id) {
                messages.push({
                    msm: 'Ya existe un producto con ese nombre.',
                    field: 'name',
                });
            }
        }

        if (body.brandId) {
            const isBrandExist = await this.productValidator.existsBrand(body.brandId);
            if (!isBrandExist && isBrandExist.id != body.id) {
                messages.push({
                    msm: 'La marca seleccionada no fue encontrada.',
                    field: 'brandId',
                });
            }
        }

        if (body.categoryId) {
            const isCategoryExist = await this.productValidator.existsCategory(body.categoryId);
            if (!isCategoryExist && isCategoryExist.id != body.id) {
                messages.push({
                    msm: 'La categoría seleccionada no fue encontrada.',
                    field: 'categoryId',
                });
            }
        }

        if (body.subcategoryId) {
            const isSubcategoryExist = await this.productValidator.existsSubcategory(body.subcategoryId);
            if (!isSubcategoryExist && isSubcategoryExist.id != body.id) {
                messages.push({
                    msm: 'La subcategoría seleccionada no fue encontrada.',
                    field: 'subcategoryId',
                });
            }
        }

        return messages;
    }
}
