import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { OrderStatus } from '../../../../common/enums/order-status.enum';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { User } from '../../../auth/models/entities/user.entity';
import { ProductVariant } from '../../product-variant/models/entities/product-variant.entity';
import { CreateOrderDto } from '../models/dto/create-order.dto';
import { UpdateOrderStatusDto } from '../models/dto/update-order-status.dto';
import { OrderItem } from '../models/entities/order-item.entity';
import { Order } from '../models/entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) { }

  async create(user: User, dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const variantRepo = manager.getRepository(ProductVariant);
      const orderRepo = manager.getRepository(Order);

      const variantIds = dto.items.map((i) => i.variantId);
      const variants = await variantRepo.find({
        where: { id: In(variantIds) },
        relations: { product: true },
      });
      if (variants.length !== variantIds.length) {
        throw new NotFoundException('One or more variants not found');
      }

      const items: OrderItem[] = [];
      let total = 0;

      for (const line of dto.items) {
        const variant = variants.find((v) => v.id === line.variantId);
        if (!variant) {
          throw new NotFoundException(`Variant ${line.variantId} not found`);
        }
        if (!variant.isActive) {
          throw new BadRequestException(
            `Variant "${variant.name}" is not available`,
          );
        }
        if (variant.stock < line.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${variant.name}" (available: ${variant.stock})`,
          );
        }

        variant.stock -= line.quantity;
        await variantRepo.save(variant);

        const unitPrice = Number(variant.price);
        const subtotal = unitPrice * line.quantity;
        total += subtotal;

        const item = new OrderItem();
        item.variantId = variant.id;
        item.productName = `${variant.product.name} - ${variant.name}`;
        item.quantity = line.quantity;
        item.unitPrice = unitPrice.toFixed(2);
        item.subtotal = subtotal.toFixed(2);
        items.push(item);
      }

      const order = orderRepo.create({
        orderCode: this.generateOrderCode(),
        userId: user.id,
        totalAmount: total.toFixed(2),
        shippingAddress: dto.shippingAddress ?? null,
        note: dto.note ?? null,
        items,
      });
      return orderRepo.save(order);
    });
  }

  findAllForUser(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  findAll(): Promise<Order[]> {
    return this.orderRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, requester: User): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    if (requester.role !== UserRole.ADMIN && order.userId !== requester.id) {
      throw new ForbiddenException('You cannot access this order');
    }
    return order;
  }

  async findByCode(orderCode: string): Promise<Order | null> {
    return this.orderRepository.findOne({ where: { orderCode } });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    order.status = dto.status;
    return this.orderRepository.save(order);
  }

  async markPaidByCode(orderCode: string): Promise<Order | null> {
    const order = await this.findByCode(orderCode);
    if (!order) return null;
    order.status = OrderStatus.PAID;
    return this.orderRepository.save(order);
  }

  async cancel(id: string, requester: User): Promise<Order> {
    const order = await this.findOne(id, requester);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }
    order.status = OrderStatus.CANCELLED;
    return this.orderRepository.save(order);
  }

  private generateOrderCode(): string {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `ORD-${ts}-${rand}`;
  }
}
