import { Brand } from '@/entities/brand.entity';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBrandDto } from './dto/create-brand.dto';
import { capitalizeStr } from '@/common/utils/capitalize-str.util';
import slugify from 'slugify';
import { EditBrandDto } from './dto/edit-brand-dto';

@Injectable()
export class BrandService {
	constructor(@InjectRepository(Brand) private brandRepository: Repository<Brand>) {}

	async create_brand(createBrandDto: CreateBrandDto) {
		const data = { ...createBrandDto };
		data.name = capitalizeStr(data.name.toUpperCase());
		data.slug = slugify(data.name, {
			lower: true,
			strict: true,
			trim: true,
		});
		let brand = await this.brandRepository.save(data);
		return brand;
	}

	async get_brands(query: { filter: string; page: number; limit: number; status: string }) {
		const page = Number(query.page) || 0;
		const MAX_LIMIT = process.env.MAX_LIMIT_QUERY ? Number(process.env.MAX_LIMIT_QUERY) : 100;
		const limit = Math.min(Number(query.limit) || 0, MAX_LIMIT);

		// ✅ Si page o limit son <= 0, no se consulta nada
		if (page <= 0 || limit <= 0) {
			return {
				collaborators: [],
				totalCollaborators: 0,
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
				.slice(0, 5) // Limitar términos si quieres
				.map((t) => t.toLowerCase());

			const columns = ['brand.name', 'brand.description'];

			searchTerms.forEach((term, idx) => {
				const conditions = columns.map((c) => `${c} ILIKE :term${idx}`).join(' OR ');
				const params = { [`term${idx}`]: `%${term}%` };
				idx === 0 ? queryBuilder.where(`(${conditions})`, params) : queryBuilder.andWhere(`(${conditions})`, params);
			});
		}

		if (query.status && query.status !== 'Todos') {
			const statusBool = query.status === 'Activos';
			queryBuilder.andWhere('brand.status = :status', { status: statusBool });
		}

		let [brands, totalBrands] = await queryBuilder
			.orderBy('brand.createdAt', 'DESC')
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
	}

	async update_status_brand(id: string, status: boolean) {
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

		if (result.affected === 0) {
			throw new NotFoundException(`No se encontró el marca.`);
		}

		return result.raw[0];
	}

	async get_brand(id: string) {
		let brand: any = await this.brandRepository.createQueryBuilder('brand').where('brand.id = :id', { id }).getOne();

		brand.logoUrl = brand?.logoUrl + '?v=' + Date.now();
		brand.bannerUrl = brand?.bannerUrl + '?v=' + Date.now();

		if (!brand) throw new NotFoundException('No se encontró la marca.');
		return brand;
	}

	async update_brand(id: string, editBrandDto: EditBrandDto) {
		const data = { ...editBrandDto };

		data.name = capitalizeStr(data.name.toUpperCase());
		data.updatedAt = new Date();
		const result = await this.brandRepository
			.createQueryBuilder()
			.update(Brand)
			.set(editBrandDto)
			.where('id = :id', { id })
			.returning('*')
			.execute();

		if (result.affected === 0) {
			throw new NotFoundException('No se encontró la marca para actualizar');
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
}
