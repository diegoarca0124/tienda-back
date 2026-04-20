import { Brand } from '@/entities/brand.entity';
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBrandDto } from './dto/create-brand.dto';
import { capitalizeStr } from '@/common/utils/capitalize-str.util';
import slugify from 'slugify';
import { EditBrandDto } from './dto/edit-brand-dto';
import { logHelper } from '@/common/utils/logger-helper.util';

@Injectable()
export class BrandService {
	private readonly logger = new Logger('AuthService');

	constructor(@InjectRepository(Brand) private brandRepository: Repository<Brand>) {}

	async create_brand(createBrandDto: CreateBrandDto) {
		try {
			const data = { ...createBrandDto };
			data.name = capitalizeStr(data.name.toUpperCase());
			data.slug = slugify(data.name, {
				lower: true,
				strict: true,
				trim: true,
			});
			let saver = await this.brandRepository.save(data);
			logHelper(this.logger, 'log', 'Modulo Brand', 'create_brand', 'Marca creada correctamente', saver);
			return saver;
		} catch (error) {
			logHelper(this.logger, 'error', 'Modulo Brand', 'create_brand()', 'Error al crear la marca.', error.message);

			throw new InternalServerErrorException('Error al crear la marca.');
		}
	}

	async get_brands(query: { filter: string; page: number; limit: number; status: string, sort: any }) {
		try {
			const page = Number(query.page) || 0;
			const MAX_LIMIT = process.env.MAX_LIMIT_QUERY
				? Number(process.env.MAX_LIMIT_QUERY)
				: 100;

			const limit = Math.min(Number(query.limit) || 0, MAX_LIMIT);

			// ✅ Si page o limit son <= 0, no se consulta nada
			if (page <= 0 || limit <= 0) {
				return {
					brands: [],
					totalBrands: 0,
					totalPages: 0,
					currentPage: page <= 0 ? 0 : page,
				};
			}

			const skip = (page - 1) * limit;
			const queryBuilder = this.brandRepository.createQueryBuilder('brand');

			if (query.filter?.trim()) {
				const searchTerms = query.filter
					.trim()
					.split(/\s+/)
					.slice(0, 5)
					.map((t) => t.toLowerCase());

				const columns = ['brand.name', 'brand.description'];

				searchTerms.forEach((term, idx) => {
					const conditions = columns.map((c) => `${c} ILIKE :term${idx}`).join(' OR ');
					const params = { [`term${idx}`]: `%${term}%` };

					idx === 0
						? queryBuilder.where(`(${conditions})`, params)
						: queryBuilder.andWhere(`(${conditions})`, params);
				});
			}

			if (query.status && query.status !== 'Todos') {
				const statusBool = query.status === 'Activos';

				queryBuilder.andWhere('brand.status = :status', {
					status: statusBool,
				});
			}

			// ORDENAMIENTO
			if (query.sort?.trim()) {
				const [field, direction] = query.sort.split(':');

				const allowedFields = ['name', 'description'];
				const allowedDirections = ['asc', 'desc'];

				if (
					allowedFields.includes(field) &&
					allowedDirections.includes(direction?.toLowerCase())
				) {
					const fieldMap = {
						name: 'brand.name',
						description: 'brand.description',
					};

					queryBuilder.orderBy(
						fieldMap[field],
						direction.toUpperCase() as 'ASC' | 'DESC',
					);
				} else {
					queryBuilder.orderBy('brand.createdAt', 'DESC');
				}
			} else {
				queryBuilder.orderBy('brand.createdAt', 'DESC');
			}

			let [brands, totalBrands] = await queryBuilder
				.skip(skip)
				.take(limit)
				.getManyAndCount();

			brands = brands.map((prev) => ({
				...prev,
				logoUrl: prev?.logoUrl + '?v=' + Date.now(),
				bannerUrl: prev?.bannerUrl + '?v=' + Date.now(),
			}));

			return {
				brands,
				totalBrands,
				totalPages: Math.ceil(totalBrands / limit),
				currentPage: page,
			};
		} catch (error) {
			logHelper(
				this.logger,
				'error',
				'Modulo Marca',
				'get_brands()',
				'Error al obtener las marcas.',
				query,
				error.message
			);

			throw new InternalServerErrorException('Error al obtener las marcas.');
		}
	}

	async update_status_brand(id: string, status: boolean) {
		try {
			const result = await this.brandRepository
				.createQueryBuilder()
				.update(Brand)
				.set({
					status: !status,
					statusAt: new Date(),
				})
				.where('id = :id', { id })
				.returning('*')
				.execute();

			logHelper(
				this.logger,
				'log',
				'Modulo Brand',
				'update_status_brand',
				'Estado de la marca actualizada correctamente.',
				{
					status: !status,
					statusAt: new Date(),
					id,
				}
			);
			return result.raw[0];
		} catch (err) {
			logHelper(
				this.logger,
				'error',
				'Modulo Brand',
				'update_status_brand()',
				'No se pudo actualizar el estado la marca.',
				{
					id,
					status,
				},
				err.message
			);
			throw new InternalServerErrorException('Error al actualizar el estado la marca.');
		}
	}

	async get_brand(id: string) {
		try {
			let brand: any = await this.brandRepository.createQueryBuilder('brand').where('brand.id = :id', { id }).getOne();

			if (!brand) {
				throw new NotFoundException('Marca no encontrada.');
			}

			brand.logoUrl = brand?.logoUrl + '?v=' + Date.now();
			brand.bannerUrl = brand?.bannerUrl + '?v=' + Date.now();

			return brand;
		} catch (error) {
			logHelper(this.logger, 'error', 'Modulo Brand', 'get_brand()', 'Error al obtener la marca.', error.message);
			throw new InternalServerErrorException('Error al obtener la marca.');
		}
	}

	async update_brand(id: string, editBrandDto: EditBrandDto) {
		const data = { ...editBrandDto };

		data.name = capitalizeStr(data.name.toUpperCase());
		data.updatedAt = new Date();
		let result;

		try {
			result = await this.brandRepository
				.createQueryBuilder()
				.update(Brand)
				.set(editBrandDto)
				.where('id = :id', { id })
				.returning('*')
				.execute();

			logHelper(this.logger, 'log', 'Modulo Marca', 'update_brand', 'Marca actualizada correctamente.', {
				...data,
				id,
			});
		} catch (err) {
			logHelper(
				this.logger,
				'error',
				'Modulo Brand',
				'update_brand()',
				'Error al actualizar la marca.',
				{ ...data, id },
				err.message
			);
			throw new InternalServerErrorException('Error al actualizar la marca.');
		}

		if (result.raw[0]?.logoUrl) {
			result.raw[0].logoUrl += `?v=${Date.now()}`;
		}
		if (result.raw[0]?.bannerUrl) {
			result.raw[0].bannerUrl += `?v=${Date.now()}`;
		}

		return result.raw[0];
	}

	async validate_name_brand(name: string) {
		const brand = await this.brandRepository.findOneBy({ name });
		return brand;
	}

	async get_brand_logo_filename_by_id(id: string) {
		try {
			let brand: any = await this.brandRepository
				.createQueryBuilder('brand')
				.select(['brand.id', 'brand.logoUrl'])
				.where('brand.id = :id', { id })
				.getOne();

			return brand.logoUrl;
		} catch (error) {
			console.log(error);
		}
	}

	async get_brand_banner_filename_by_id(id: string) {
		try {
			let brand: any = await this.brandRepository
				.createQueryBuilder('brand')
				.select(['brand.id', 'brand.bannerUrl'])
				.where('brand.id = :id', { id })
				.getOne();

			return brand.bannerUrl;
		} catch (error) {
			console.log(error);
		}
	}

	async get_brands_by_select() {
		try {
			const brands = await this.brandRepository
				.createQueryBuilder('brand')
				.select(['brand.id', 'brand.name', 'brand.status', 'brand.logoUrl'])
				.where('brand.status = :status', { status: true })
				.orderBy('brand.name', 'ASC')
				.getMany();
			return brands;
		} catch (error) {
			logHelper(
				this.logger,
				'error',
				'Modulo Brand',
				'get_brands_by_select()',
				'Error al obtener las marcas.',
				{},
				error.message
			);
			throw new InternalServerErrorException('Error al obtener las marcas.');
		}
	}
}
