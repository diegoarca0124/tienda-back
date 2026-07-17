import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';

export class ValidateUUID extends ParseUUIDPipe {
	constructor() {
		super({
			version: '4',
			exceptionFactory: () => new BadRequestException('El ID proporcionado no es codigo válido'),
		});
	}
}
