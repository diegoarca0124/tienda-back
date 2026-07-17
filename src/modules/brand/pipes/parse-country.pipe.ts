import { ArgumentMetadata, Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseCountryPipe implements PipeTransform {
	transform(value: any, metadata: ArgumentMetadata) {
		if (metadata.type === 'body' && typeof value?.country === 'string') {
			try {
				value.country = JSON.parse(value.country);
			} catch {
				throw new BadRequestException('El campo country debe ser un JSON válido');
			}
		}
		return value;
	}
}
