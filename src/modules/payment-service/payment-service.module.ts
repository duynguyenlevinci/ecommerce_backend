import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Order } from '../home/order/models/entities/order.entity';
import { OrderModule } from '../home/order/order.module';
import { PaymentController } from './controllers/payment.controller';
import { Payment } from './models/entities/payment.entity';
import { MomoService } from './services/momo.service';
import { PaymentService } from './services/payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order]),
    AuthModule,
    OrderModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, MomoService],
  exports: [PaymentService, MomoService],
})
export class PaymentServiceModule { }
