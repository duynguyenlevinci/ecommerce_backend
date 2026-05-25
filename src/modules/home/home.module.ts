import { Module } from '@nestjs/common';
import { CategoryModule } from './category/category.module';
import { OrderModule } from './order/order.module';
import { ProductVariantModule } from './product-variant/product-variant.module';
import { ProductModule } from './product/product.module';

/**
 * The home module is an aggregator that wires up every customer-facing
 * sub-feature of the storefront: Category tree, Product catalog, Product
 * variants and customer Orders. Each sub-feature is a self-contained MVC
 * module (controllers / services / models).
 */
@Module({
  imports: [CategoryModule, ProductModule, ProductVariantModule, OrderModule],
  exports: [CategoryModule, ProductModule, ProductVariantModule, OrderModule],
})
export class HomeModule { }
