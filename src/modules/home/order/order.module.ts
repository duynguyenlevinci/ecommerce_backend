import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { ProductVariantModule } from '../product-variant/product-variant.module';
import { OrderController } from './controllers/order.controller';
import { OrderItem } from './models/entities/order-item.entity';
import { Order } from './models/entities/order.entity';
import { OrderService } from './services/order.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    AuthModule,
    ProductVariantModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService, TypeOrmModule],
})
export class OrderModule { }
