import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderStatus } from '../../../../../common/enums/order-status.enum';
import { Order } from './order.entity';

/**
 * Append-only audit log of every status change an order goes through.
 * Used to render the order timeline for end-users and audit trail for admins.
 */
@Entity({ name: 'order_status_history' })
export class OrderStatusHistory {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (order) => order.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ApiProperty()
  @Index()
  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ApiPropertyOptional({
    enum: OrderStatus,
    nullable: true,
    description: 'Null when the row records the initial creation of the order',
  })
  @Column({ name: 'from_status', type: 'enum', enum: OrderStatus, nullable: true })
  fromStatus!: OrderStatus | null;

  @ApiProperty({ enum: OrderStatus })
  @Column({ name: 'to_status', type: 'enum', enum: OrderStatus })
  toStatus!: OrderStatus;

  @ApiPropertyOptional({
    description: 'Actor user id. Null for system-driven transitions (IPN).',
    nullable: true,
  })
  @Column({ name: 'changed_by_user_id', type: 'uuid', nullable: true })
  changedByUserId!: string | null;

  @ApiPropertyOptional({
    description: 'Actor role label: "system" | "user" | "admin"',
  })
  @Column({ name: 'changed_by_role', type: 'varchar', length: 20, nullable: true })
  changedByRole!: string | null;

  @ApiPropertyOptional({ description: 'Free-form note explaining the change' })
  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
