import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  In,
  LessThan,
  Repository,
} from 'typeorm';
import { MONEY } from '../../../../common/constants/money.constants';
import { PAGINATION } from '../../../../common/constants/pagination.constants';
import {
  PaginatedResult,
  buildPaginatedResult,
} from '../../../../common/dto/paginated-result.dto';
import { OrderStatus } from '../../../../common/enums/order-status.enum';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { User } from '../../../auth/models/entities/user.entity';
import { ProductVariant } from '../../product-variant/models/entities/product-variant.entity';
import {
  ORDER_CHANGED_BY,
  ORDER_CODE,
  ORDER_STATUS_TRANSITIONS,
  OrderChangedBy,
} from '../constants/order.constants';
import {
  BulkCancelOrdersDto,
  BulkCancelResultDto,
  BulkCancelSkippedItem,
} from '../models/dto/bulk-cancel-orders.dto';
import { CancelOrderDto } from '../models/dto/cancel-order.dto';
import { CreateOrderDto } from '../models/dto/create-order.dto';
import { QueryOrderDto } from '../models/dto/query-order.dto';
import { UpdateOrderStatusDto } from '../models/dto/update-order-status.dto';
import { OrderItem } from '../models/entities/order-item.entity';
import { OrderStatusHistory } from '../models/entities/order-status-history.entity';
import { Order } from '../models/entities/order.entity';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderStatusHistory)
    private readonly historyRepository: Repository<OrderStatusHistory>,
    private readonly dataSource: DataSource,
  ) { }

  // ====================================================================
  //  CREATE
  // ====================================================================

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
        item.unitPrice = unitPrice.toFixed(MONEY.DECIMAL_PLACES);
        item.subtotal = subtotal.toFixed(MONEY.DECIMAL_PLACES);
        items.push(item);
      }

      const order = orderRepo.create({
        orderCode: this.generateOrderCode(),
        userId: user.id,
        status: OrderStatus.PENDING,
        totalAmount: total.toFixed(MONEY.DECIMAL_PLACES),
        shippingAddress: dto.shippingAddress ?? null,
        note: dto.note ?? null,
        items,
      });
      const saved = await orderRepo.save(order);

      await this.logHistory(manager, {
        orderId: saved.id,
        fromStatus: null,
        toStatus: OrderStatus.PENDING,
        changedByUserId: user.id,
        changedByRole: ORDER_CHANGED_BY.USER,
        note: 'Order placed',
      });

      return saved;
    });
  }

  // ====================================================================
  //  READ
  // ====================================================================

  async findAllForUser(
    userId: string,
    query: QueryOrderDto,
  ): Promise<PaginatedResult<Order>> {
    return this.paginatedQuery({ ...query, userId });
  }

  async findAll(query: QueryOrderDto): Promise<PaginatedResult<Order>> {
    return this.paginatedQuery(query);
  }

  async findOne(id: string, requester: User): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    this.ensureCanAccess(order, requester);
    return order;
  }

  async findByCode(orderCode: string, requester: User): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { orderCode } });
    if (!order) {
      throw new NotFoundException(`Order "${orderCode}" not found`);
    }
    this.ensureCanAccess(order, requester);
    return order;
  }

  async findHistory(
    id: string,
    requester: User,
  ): Promise<OrderStatusHistory[]> {
    await this.findOne(id, requester);
    return this.historyRepository.find({
      where: { orderId: id },
      order: { createdAt: 'ASC' },
    });
  }

  // ====================================================================
  //  STATUS TRANSITIONS
  // ====================================================================

  /**
   * Admin-driven status change. Validates the FSM, sets the relevant
   * lifecycle timestamp, accepts tracking metadata when shipping, and
   * refunds stock when cancelling. Every transition is appended to the
   * status history.
   */
  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    actor: User,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const order = await orderRepo.findOne({ where: { id } });
      if (!order) {
        throw new NotFoundException(`Order ${id} not found`);
      }

      this.assertTransitionAllowed(order.status, dto.status);

      const fromStatus = order.status;
      const now = new Date();

      switch (dto.status) {
        case OrderStatus.PAID:
          order.paidAt = order.paidAt ?? now;
          break;
        case OrderStatus.SHIPPED:
          order.shippedAt = now;
          if (dto.trackingNumber !== undefined) {
            order.trackingNumber = dto.trackingNumber;
          }
          if (dto.courier !== undefined) {
            order.courier = dto.courier;
          }
          break;
        case OrderStatus.DELIVERED:
          order.deliveredAt = now;
          break;
        case OrderStatus.CANCELLED:
          order.cancelledAt = now;
          await this.refundStock(manager, order);
          break;
      }

      order.status = dto.status;
      const saved = await orderRepo.save(order);

      await this.logHistory(manager, {
        orderId: order.id,
        fromStatus,
        toStatus: dto.status,
        changedByUserId: actor.id,
        changedByRole: ORDER_CHANGED_BY.ADMIN,
        note: dto.note ?? null,
      });

      return saved;
    });
  }

  /**
   * Owner-driven cancellation. Only legal while the order is still PENDING
   * (PAID orders must be cancelled via `updateStatus` by an admin to keep
   * refund handling explicit).
   */
  async cancel(id: string, requester: User, dto: CancelOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const order = await orderRepo.findOne({ where: { id } });
      if (!order) {
        throw new NotFoundException(`Order ${id} not found`);
      }
      this.ensureCanAccess(order, requester);

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          'Only pending orders can be cancelled by the customer',
        );
      }

      const fromStatus = order.status;
      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      await this.refundStock(manager, order);
      const saved = await orderRepo.save(order);

      await this.logHistory(manager, {
        orderId: order.id,
        fromStatus,
        toStatus: OrderStatus.CANCELLED,
        changedByUserId: requester.id,
        changedByRole:
          requester.role === UserRole.ADMIN
            ? ORDER_CHANGED_BY.ADMIN
            : ORDER_CHANGED_BY.USER,
        note: dto.reason ?? 'Cancelled by customer',
      });

      return saved;
    });
  }

  /**
   * Admin bulk cancellation. Resolves the target order set (either by
   * explicit `orderIds` or by filter), then cancels each order in its own
   * transaction so a single failure doesn't roll back the whole batch.
   * Orders whose current status doesn't allow CANCELLED (e.g. already
   * SHIPPED/DELIVERED/CANCELLED) are reported in `skipped` with a reason.
   */
  async bulkCancel(
    dto: BulkCancelOrdersDto,
    actor: User,
  ): Promise<BulkCancelResultDto> {
    const candidates = await this.resolveBulkCancelCandidates(dto);

    if (candidates.length === 0) {
      return { totalRequested: 0, cancelled: [], skipped: [] };
    }

    const cancelled: string[] = [];
    const skipped: BulkCancelSkippedItem[] = [];

    for (const order of candidates) {
      try {
        await this.cancelByAdmin(order.id, actor, dto.reason);
        cancelled.push(order.orderCode);
      } catch (err) {
        skipped.push({
          orderCode: order.orderCode,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    this.logger.log(
      `bulkCancel by ${actor.id}: ${cancelled.length}/${candidates.length} cancelled`,
    );

    return {
      totalRequested: candidates.length,
      cancelled,
      skipped,
    };
  }

  /**
   * Called by the MoMo IPN handler when a payment succeeds.
   * Transitions PENDING → PAID and records a system history entry.
   * No-op if the order is already PAID or moved further.
   */
  async markPaidByCode(orderCode: string): Promise<Order | null> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const order = await orderRepo.findOne({ where: { orderCode } });
      if (!order) return null;

      if (order.status !== OrderStatus.PENDING) {
        this.logger.warn(
          `markPaidByCode: order ${orderCode} is in ${order.status}, ignoring`,
        );
        return order;
      }

      const fromStatus = order.status;
      order.status = OrderStatus.PAID;
      order.paidAt = new Date();
      const saved = await orderRepo.save(order);

      await this.logHistory(manager, {
        orderId: order.id,
        fromStatus,
        toStatus: OrderStatus.PAID,
        changedByUserId: null,
        changedByRole: ORDER_CHANGED_BY.SYSTEM,
        note: 'Payment confirmed via MoMo IPN',
      });

      return saved;
    });
  }

  // ====================================================================
  //  HELPERS
  // ====================================================================

  /**
   * Resolve the set of orders a bulk-cancel request applies to.
   * Precedence: explicit `orderIds` wins; otherwise build a filter from
   * `status` + `createdBefore`. At least one criterion must be supplied.
   */
  private async resolveBulkCancelCandidates(
    dto: BulkCancelOrdersDto,
  ): Promise<Order[]> {
    if (dto.orderIds && dto.orderIds.length > 0) {
      return this.orderRepository.find({
        where: { id: In(dto.orderIds) },
        order: { createdAt: 'ASC' },
      });
    }

    const where: FindOptionsWhere<Order> = {};
    if (dto.status) {
      where.status = dto.status;
    }
    if (dto.createdBefore) {
      where.createdAt = LessThan(new Date(dto.createdBefore));
    }
    if (Object.keys(where).length === 0) {
      throw new BadRequestException(
        'Provide either orderIds, or at least one of: status, createdBefore',
      );
    }

    return this.orderRepository.find({
      where,
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Cancel a single order on behalf of an admin (refunds stock + logs
   * history). Wrapped in its own transaction so the caller can use it
   * inside a per-order loop (bulk cancel) without bringing down the whole
   * batch on a single failure.
   */
  private async cancelByAdmin(
    id: string,
    actor: User,
    reason: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const order = await orderRepo.findOne({ where: { id } });
      if (!order) {
        throw new NotFoundException(`Order ${id} not found`);
      }

      this.assertTransitionAllowed(order.status, OrderStatus.CANCELLED);

      const fromStatus = order.status;
      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      await this.refundStock(manager, order);
      await orderRepo.save(order);

      await this.logHistory(manager, {
        orderId: order.id,
        fromStatus,
        toStatus: OrderStatus.CANCELLED,
        changedByUserId: actor.id,
        changedByRole: ORDER_CHANGED_BY.ADMIN,
        note: reason,
      });
    });
  }

  private async paginatedQuery(
    params: QueryOrderDto & { userId?: string },
  ): Promise<PaginatedResult<Order>> {
    const page = params.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = params.limit ?? PAGINATION.DEFAULT_LIMIT;

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items');

    if (params.userId) {
      qb.andWhere('order.user_id = :userId', { userId: params.userId });
    }
    if (params.status) {
      qb.andWhere('order.status = :status', { status: params.status });
    }
    if (params.orderCode) {
      qb.andWhere('order.order_code = :code', { code: params.orderCode });
    }

    qb.orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResult(data, total, page, limit);
  }

  private ensureCanAccess(order: Order, requester: User): void {
    if (requester.role !== UserRole.ADMIN && order.userId !== requester.id) {
      throw new ForbiddenException('You cannot access this order');
    }
  }

  private assertTransitionAllowed(
    from: OrderStatus,
    to: OrderStatus,
  ): void {
    if (from === to) {
      throw new BadRequestException(`Order is already ${to}`);
    }
    const allowed = ORDER_STATUS_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Illegal status transition: ${from} → ${to}. Allowed: [${allowed.join(', ') || 'none'}]`,
      );
    }
  }

  /**
   * Restock every item of an order. Called when cancelling an order from
   * any pre-shipment state. Idempotent enough as long as it's only invoked
   * inside an FSM-guarded transition (the FSM prevents double-cancel).
   */
  private async refundStock(
    manager: EntityManager,
    order: Order,
  ): Promise<void> {
    const variantRepo = manager.getRepository(ProductVariant);
    const itemRepo = manager.getRepository(OrderItem);

    const items =
      order.items && order.items.length > 0
        ? order.items
        : await itemRepo.find({ where: { orderId: order.id } });

    if (items.length === 0) return;

    const variants = await variantRepo.find({
      where: { id: In(items.map((i) => i.variantId)) },
    });

    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) continue;
      variant.stock += item.quantity;
      await variantRepo.save(variant);
    }
  }

  private async logHistory(
    manager: EntityManager,
    entry: {
      orderId: string;
      fromStatus: OrderStatus | null;
      toStatus: OrderStatus;
      changedByUserId: string | null;
      changedByRole: OrderChangedBy;
      note: string | null;
    },
  ): Promise<void> {
    const repo = manager.getRepository(OrderStatusHistory);
    const history = repo.create(entry);
    await repo.save(history);
  }

  private generateOrderCode(): string {
    const ts = Date.now();
    const rand = Math.random()
      .toString(36)
      .slice(2, 2 + ORDER_CODE.RANDOM_SUFFIX_LENGTH)
      .toUpperCase();
    return `${ORDER_CODE.PREFIX}${ts}-${rand}`;
  }
}
