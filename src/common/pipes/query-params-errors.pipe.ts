import {
    ArgumentMetadata,
    BadRequestException,
    PipeTransform,
    Type,
    ValidationPipe,
} from '@nestjs/common';

export class QueryParamsErrorsPipe implements PipeTransform {
    private readonly validationPipe: ValidationPipe;

    constructor(private readonly dto: Type<unknown>) {
        this.validationPipe = new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            exceptionFactory: () =>
                new BadRequestException({
                    code: 'INVALID_QUERY_PARAMS',
                    message: 'Los parámetros de la URL no son válidos.',
                }),
        });
    }

    transform(value: unknown, metadata: ArgumentMetadata) {
        return this.validationPipe.transform(value, {
            ...metadata,
            metatype: this.dto,
        });
    }
}