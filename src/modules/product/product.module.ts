import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from '@/entities/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RedisTokenService } from '@/common/services/redis-token/redis-token.service';
import { ProductDescription } from '@/entities/product-description.entity';
import { ProductPhisycal } from '@/entities/product-phisycal.entity';
import { ProductPhoto } from '@/entities/product-photo.entity';
import { ProductSeo } from '@/entities/product-seo.entity';
import { ProductShipping } from '@/entities/product-shipping.entity';
import { ProductVariant } from '@/entities/product-variants.entity';
import { ProductGroup } from '@/entities/product-group.entity';
import { ProductGroupItem } from '@/entities/product-group-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductDescription, ProductPhisycal, ProductPhoto, ProductSeo, ProductShipping, ProductVariant, ProductGroup, ProductGroupItem]),
    JwtModule.register({
      secret: 'praxis',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [ProductService, RedisTokenService],
  controllers: [ProductController]
})
export class ProductModule {}
