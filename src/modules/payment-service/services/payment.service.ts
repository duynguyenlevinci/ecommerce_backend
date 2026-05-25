import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaymentProvider,
  PaymentStatus,
} from '../../../common/enums/payment-status.enum';
import { UserRole } from '../../../common/enums/user-role.enum';
import { User } from '../../auth/models/entities/user.entity';
import { Order } from '../../home/order/models/entities/order.entity';
import { OrderService } from '../../home/order/services/order.service';
import { CreatePaymentDto } from '../models/dto/create-payment.dto';
import { MomoIpnDto } from '../models/dto/momo-ipn.dto';
import { Payment } from '../models/entities/payment.entity';
import { MomoService } from './momo.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly orderService: OrderService,
    private readonly momoService: MomoService,
  ) { }

  /**
   * Create a MoMo payment for an order and return the pay URL/QR code.
   */
  async createMomoPayment(
    user: User,
    dto: CreatePaymentDto,
  ): Promise<Payment> {
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId },
    });
    if (!order) {
      throw new NotFoundException(`Order ${dto.orderId} not found`);
    }
    if (user.role !== UserRole.ADMIN && order.userId !== user.id) {
      throw new ForbiddenException('You cannot pay for this order');
    }

    const amount = Math.round(Number(order.totalAmount));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException(
        `Invalid order amount: ${order.totalAmount}`,
      );
    }

    const requestId = this.generateRequestId();
    const orderInfo = dto.orderInfo ?? `Payment for ${order.orderCode}`;

    const payment = this.paymentRepository.create({
      orderId: order.id,
      orderCode: order.orderCode,
      requestId,
      provider: PaymentProvider.MOMO,
      status: PaymentStatus.PENDING,
      amount: amount.toFixed(2),
      currency: 'VND',
    });
    const saved = await this.paymentRepository.save(payment);

    try {
      const momoResponse = await this.momoService.createPayment({
        orderId: order.orderCode,
        requestId,
        amount,
        orderInfo,
      });

      saved.payUrl = momoResponse.payUrl ?? null;
      saved.qrCodeUrl = momoResponse.qrCodeUrl ?? null;
      saved.rawResponse = momoResponse as unknown as Record<string, unknown>;

      if (momoResponse.resultCode !== 0) {
        saved.status = PaymentStatus.FAILED;
      }
      return this.paymentRepository.save(saved);
    } catch (error) {
      saved.status = PaymentStatus.FAILED;
      saved.rawResponse = {
        error: error instanceof Error ? error.message : String(error),
      };
      await this.paymentRepository.save(saved);
      throw error;
    }
  }

  /**
   * Handle MoMo IPN callback. Verifies signature, updates payment status and
   * marks the corresponding order as PAID when successful.
   */
  async handleMomoIpn(payload: MomoIpnDto): Promise<{
    partnerCode: string;
    requestId: string;
    orderId: string;
    resultCode: number;
    message: string;
    responseTime: number;
  }> {
    const verified = this.momoService.verifyIpnSignature(payload);
    if (!verified) {
      this.logger.warn(
        `Invalid MoMo IPN signature for orderId=${payload.orderId}`,
      );
      throw new BadRequestException('Invalid signature');
    }

    const payment = await this.paymentRepository.findOne({
      where: { requestId: payload.requestId },
    });
    if (!payment) {
      this.logger.warn(
        `MoMo IPN for unknown requestId=${payload.requestId}`,
      );
      throw new NotFoundException('Payment not found');
    }

    payment.transactionId = String(payload.transId);
    payment.rawResponse = payload as unknown as Record<string, unknown>;

    if (payload.resultCode === 0) {
      payment.status = PaymentStatus.SUCCESS;
      await this.orderService.markPaidByCode(payment.orderCode);
    } else {
      payment.status = PaymentStatus.FAILED;
    }
    await this.paymentRepository.save(payment);

    return {
      partnerCode: payload.partnerCode,
      requestId: payload.requestId,
      orderId: payload.orderId,
      resultCode: 0,
      message: 'Acknowledged',
      responseTime: Date.now(),
    };
  }

  async findOne(id: string, requester: User): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    const order = await this.orderRepository.findOne({
      where: { id: payment.orderId },
    });
    if (
      requester.role !== UserRole.ADMIN &&
      order &&
      order.userId !== requester.id
    ) {
      throw new ForbiddenException('You cannot access this payment');
    }
    return payment;
  }

  findAllForOrder(orderId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  private generateRequestId(): string {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `REQ-${ts}-${rand}`;
  }
}
