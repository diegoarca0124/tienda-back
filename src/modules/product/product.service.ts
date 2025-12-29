import { Product } from '@/entities/product.entity';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { capitalizeStr } from '@/common/utils/capitalize-str.util';
import slugify from 'slugify';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { logHelper } from '@/common/utils/logger-helper.util';
import { ProductPhisycal } from '@/entities/product-phisycal.entity';
import { ProductShipping } from '@/entities/product-shipping.entity';
import { ProductPhoto } from '@/entities/product-photo.entity';
import { ProductDescription } from '@/entities/product-description.entity';
import { ProductVariant } from '@/entities/product-variants.entity';
import { ProductGroup } from '@/entities/product-group.entity';
import { ProductGroupItem } from '@/entities/product-group-item.entity';

@Injectable()
export class ProductService {

    private readonly logger = new Logger('AuthService');

    constructor(
        @InjectRepository(Product) private productRepository: Repository<Product>,
        @InjectRepository(ProductPhisycal) private productPhisycalRepository: Repository<ProductPhisycal>,
        @InjectRepository(ProductShipping) private productShippingRepository: Repository<ProductShipping>,
        @InjectRepository(ProductPhoto) private productPhotoRepository: Repository<ProductPhoto>,
        @InjectRepository(ProductDescription) private productDescriptionRepository: Repository<ProductDescription>,
        @InjectRepository(ProductVariant) private productVariantRepository: Repository<ProductVariant>,
        @InjectRepository(ProductGroup) private productGroupRepository: Repository<ProductGroup>,
        @InjectRepository(ProductGroupItem) private productGroupItemRepository: Repository<ProductGroupItem>,
        private readonly dataSource: DataSource
    ){

    }

    async create_product(createProductDto : CreateProductDto){
        try {
             return await this.dataSource.transaction(async (manager) => {
                console.log('ProductService - productGroupId',createProductDto.productGroupId);
                
                const data = { ...createProductDto };
                const randomNumber = Math.floor(10000 + Math.random() * 99999);
                // Normalizaciones
                data.name = capitalizeStr(data.name.toUpperCase());
                data.slug = `${slugify(data.name, {
                    lower: true,
                    strict: true,
                    trim: true,
                })}-${randomNumber}`;
                data.type = 'Fisico';

                // === 1) Crear producto ===
                const product = manager.getRepository(Product).create({
                    ...data,
                    name: data.name,
                    slug: data.slug,
                    type: 'Fisico'
                });

                console.log('product',product);
                
                
                const savedProduct = await manager.getRepository(Product).save(product);

                const productId = savedProduct.id;

                // === 2) Crear información física ===
                await manager.getRepository(ProductPhisycal).save({
                    ...data,
                    productId,
                });

                // === 3) Crear shipping ===
                await manager.getRepository(ProductShipping).save({
                    ...data,
                    productId,
                });

                // === 4) Guardar galería ===
                if (Array.isArray(data.gallery) && data.gallery.length > 0) {
                    const photos = data.gallery.map((url) => ({
                        url,
                        productId,
                    }));

                    await manager.getRepository(ProductPhoto).save(photos);
                }

                // === 5) Guardar descripciones/atributos ===
                if (Array.isArray(data.attributes) && data.attributes.length > 0) {
                    const attributes = data.attributes.map((attr) => ({
                        ...attr,
                        productId,
                    }));
                    await manager.getRepository(ProductDescription).save(attributes);
                }

                // === 6) Guardar variaciones ===
                if (Array.isArray(data.variations) && data.variations.length > 0) {
                    const variations : any = data.variations.map((item) => ({
                        name: item.name,
                        skuPattern: item.skuPattern,
                        sku: 'DEFAULT',
                        productId,
                    }));

                    await manager.getRepository(ProductVariant).save(variations);
                }

                if (!createProductDto.productGroupId) {
                    const group = await manager
                        .getRepository(ProductGroup)
                        .save({});
                    await manager
                    .getRepository(ProductGroupItem)
                    .save({
                        productGroupId: group.id, 
                        productId,   
                    });
                }else{
                    await manager
                    .getRepository(ProductGroupItem)
                    .save({
                        productGroupId: createProductDto.productGroupId, 
                        productId,   
                    });
                }

                // === Log ===
                logHelper(
                    this.logger,
                    'log',
                    'Modulo Producto',
                    'create_product',
                    'Producto creado correctamente',
                    savedProduct
                );

                return savedProduct;
                return {}
            });

        } catch (error) {
            console.log(error);
            
            logHelper(this.logger, 'error', 'Modulo Producto', 'create_product()', 'Error al crear la marca.', error.message);
            throw new InternalServerErrorException('Error al crear el producto.');
        }
    }

    async get_products(query: { filter: string, page: number, limit: number, status: string, visibility: string, categories: string, brands: string, countries: string, minPrice: number|string, maxPrice: number|string }) {
		try {
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			const page = Number(query.page) || 0;
			const MAX_LIMIT = process.env.MAX_LIMIT_QUERY ? Number(process.env.MAX_LIMIT_QUERY) : 100;
			const limit = Math.min(Number(query.limit) || 0, MAX_LIMIT);
            const minPrice = query.minPrice ?? '';
            const maxPrice = query.maxPrice ?? '';

            console.log('categories',query.categories);
            
            
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
			const queryBuilder = this.productRepository.createQueryBuilder('product')
            .leftJoin('product.category', 'category')
            .leftJoin('product.subcategory', 'subcategory')
            .leftJoin('product.brand', 'brand')
            .addSelect([
                'category.id',
                'category.name',
                'subcategory.id',
                'subcategory.name',
                'brand.id',
                'brand.name',
                'brand.logoUrl',
            ]);

            console.log('minPrice,maxPrice',minPrice,maxPrice);
            

            if(minPrice && maxPrice){
                queryBuilder.andWhere(`
                (
                    (
                        product.priceDiscount IS NOT NULL
                        AND product.priceDiscount BETWEEN :minPrice AND :maxPrice
                    )
                OR
                    (
                        product.priceDiscount IS NULL
                        AND product.priceRegular BETWEEN :minPrice AND :maxPrice
                    )
                )`, { minPrice, maxPrice });
            }

            

			if (query.filter?.trim()) {
				const searchTerms = query.filter
					.trim()
					.split(/\s+/)
					.slice(0, 5) // Limitar términos si quieres
					.map((t) => t.toLowerCase());

				const columns = ['product.name'];

				searchTerms.forEach((term, idx) => {
					const conditions = columns.map((c) => `${c} ILIKE :term${idx}`).join(' OR ');
					const params = { [`term${idx}`]: `%${term}%` };
					idx === 0 ? queryBuilder.where(`(${conditions})`, params) : queryBuilder.andWhere(`(${conditions})`, params);
				});
			}

			if (query.status && query.status !== 'Todos') {
                queryBuilder.andWhere('product.status = :status', {
                    status: query.status,
                })
			}

            if (query.visibility && query.visibility !== 'Todos') {
                queryBuilder.andWhere('product.visibility = :visibility', {
                    visibility: query.visibility,
                })
			}

            if (query.categories && query.categories !== 'Todos') {
				const categoryIds = query.categories.split(',');
				const validCategoryIds = categoryIds.filter((id) => uuidRegex.test(id));
                console.log('validCategoryIds',validCategoryIds);
                
				if (validCategoryIds.length > 0) {
					queryBuilder.andWhere('product.category.id IN (:...validCategoryIds)', {
						validCategoryIds,
					});
				}
			}

            if (query.brands && query.brands !== 'Todos') {
                const brandIds = query.brands.split(',');
                const validBrandIds = brandIds.filter((id) => uuidRegex.test(id));

                if (validBrandIds.length > 0) {
                    queryBuilder.andWhere('product.brand.id IN (:...validBrandIds)', {
                        validBrandIds,
                    });
                }
            }

            if (query.countries && query.countries !== 'Todos') {
                const countriesCode = query.countries.split(',');

                if (countriesCode.length > 0) {
                    queryBuilder.andWhere(
                        "product.countryOfOrigin ->> 'code' IN (:...countries)",
                        { countries: countriesCode }
                    );
                }
            }


			let [products, totalProducts]: any = await queryBuilder
            .orderBy('product.createdAt', 'DESC')
            .skip(skip)
            .take(query.limit)
            .getManyAndCount();

            
            products = products.map((attr) => {
				return {
					id: attr.id,
					name: attr.name,
                    category: attr.category,
                    subcategory: attr.subcategory,
                    brand: attr.brand,
                    averageRaiting: attr.averageRaiting,
                    salesCount: attr.salesCount,
                    unitOfMeasure: attr.unitOfMeasure,
                    priceRegular: attr.priceRegular,
                    priceDiscount: attr.priceDiscount,
                    cover: attr.cover,
                    extract: attr.extract,
                    miniature: attr.miniature,
                    status: attr.status,
					createdAt: attr.createdAt,
					updatedAt: attr.updatedAt
				};
			});

			return {
				products,
				totalProducts,
				totalPages: Math.ceil(totalProducts / query.limit),
				currentPage: query.page,
			};
		} catch (error) {
            console.log(error);
            
			logHelper(
				this.logger,
				'error',
				'Modulo Producto',
				'get_products()',
				'Error al obtener los productos.',
				query,
				error.message
			);

			throw new InternalServerErrorException('Error al obtener los productos.');
		}
	}

    async get_groups_for_create_product(query: { filter?: string }) {
        try {
            console.log('query.filter',query.filter);
            
            const qb = this.productGroupRepository
            .createQueryBuilder('group')
            .leftJoinAndSelect('group.productGroupItems', 'item')
            .leftJoinAndSelect('item.product', 'product')
            .select([
                'group.id',
                'group.code',
                'group.createdAt',

                'item.id',
                'item.productId',

                'product.id',
                'product.name',
                'product.cover',
            ])
            .orderBy('group.createdAt', 'DESC');

            // 👇 filtro CONDICIONAL
            if (query.filter && query.filter.trim() !== '') {
            qb.andWhere('CAST(group.code AS TEXT) ILIKE :filter', {
                filter: `%${query.filter.trim()}%`,
            });
            }

            return await qb.getMany();

        } catch (error) {
            console.log(error);
            
            logHelper(
            this.logger,
            'error',
            'Modulo Producto',
            'get_groups_for_create_product()',
            'Error al obtener los grupos.',
            query,
            error.message
            );

            throw new InternalServerErrorException('Error al obtener los grupos.');
        }
    }


    async import_product_for_group(productGroupId : string){
        try {
            
            let groupItem = await this.productGroupItemRepository.createQueryBuilder('groupItem')
            .where('groupItem.productGroupId = :productGroupId', { productGroupId })
            .getOne();

            console.log('groupItem',groupItem);

            let product = await this.productRepository.createQueryBuilder('product')
            .select([
                'product.id',
                'product.name',
                'product.description',
                'product.extract',
                'product.mainAttribute',
                'product.mainAttributeValue',
                'product.unitOfMeasure',
                'product.condition',
                'product.warranty',
                'product.countryOfOrigin',
                'product.tags',
                'product.brandId',
                'product.categoryId',
                'product.subcategoryId',
                'product.priceRegular',
                'product.priceDiscount',
            ])
            .where('product.id = :id', { id : groupItem!.productId})
            .getOne();

            let physical = await this.productPhisycalRepository.createQueryBuilder('physical')
            .select([
                'physical.id',
                'physical.weight',
                'physical.weightUnit',
                'physical.height',
                'physical.width',
                'physical.length',
                'physical.dimensionUnit',
                'physical.material',
                'physical.storageTempUnit',
                'physical.maxStorageTemp',
                'physical.minStorageTemp',
                'physical.isRequiresAssembly',
                'physical.isFlammable',
                'physical.isRequiresRefrigeration',
                'physical.isHazardous',
                'physical.isBiodegradable',
                'physical.isEcoFriendly',
                'physical.isPerishable',
                'physical.isFragile'
            ])
            .where('physical.productId = :productId', { productId : groupItem!.productId})
            .getOne();

            return {
                product,
                physical
            }
        } catch (error) {
            logHelper(
				this.logger,
				'error',
				'Modulo Producto',
				'import_product_for_group()',
				'Error al importar el producto.',
				{productGroupId},
				error.message
			);

			throw new InternalServerErrorException('Error al importar el producto.');
        }
    }

    async validate_name_product(name: string) {
		const product = await this.productRepository.findOneBy({ name });
		return product;
	}
}
