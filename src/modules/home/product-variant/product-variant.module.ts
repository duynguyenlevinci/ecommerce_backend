import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { ProductModule } from '../product/product.module';
import { ProductVariantController } from './controllers/product-variant.controller';
import { ProductVariant } from './models/entities/product-variant.entity';
import { ProductVariantService } from './services/product-variant.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductVariant]),
    AuthModule,
    ProductModule,
  ],
  controllers: [ProductVariantController],
  providers: [ProductVariantService],
  exports: [ProductVariantService, TypeOrmModule],
})
export class ProductVariantModule { }
