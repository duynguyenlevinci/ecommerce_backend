import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus } from '../../../../../common/enums/order-status.enum';
import { User } from '../../../../auth/models/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusHistory } from './order-status-history.entity';

@Entity({ name: 'orders' })
export class Order {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'ORD-1717000000000-AB12' })
  @Index({ unique: true })
  @Column({ name: 'order_code', type: 'varchar', length: 64, unique: true })
  orderCode!: string;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ApiProperty()
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  @Index()
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @ApiProperty({ example: '199.98' })
  @Column({
    name: 'total_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount!: string;

  @ApiPropertyOptional()
  @Column({ name: 'shipping_address', type: 'text', nullable: true })
  shippingAddress!: string | null;

  @ApiPropertyOptional()
  @Column({ name: 'note', type: 'text', nullable: true })
  note!: string | null;

  // ---- Tracking / lifecycle timestamps -------------------------------

  @ApiPropertyOptional({
    description: 'Courier tracking number, set when shipped',
  })
  @Column({ name: 'tracking_number', type: 'varchar', length: 100, nullable: true })
  trackingNumber!: string | null;

  @ApiPropertyOptional({
    description: 'Shipping company name, e.g. "GHN", "GHTK", "VNPost"',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  courier!: string | null;

  @ApiPropertyOptional({ description: 'When the order was marked PAID' })
  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt!: Date | null;

  @ApiPropertyOptional({ description: 'When the order was handed off to courier' })
  @Column({ name: 'shipped_at', type: 'timestamptz', nullable: true })
  shippedAt!: Date | null;

  @ApiPropertyOptional({ description: 'When the order was delivered' })
  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt!: Date | null;

  @ApiPropertyOptional({ description: 'When the order was cancelled' })
  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  // ---- Relations ------------------------------------------------------

  @ApiProperty({ type: () => [OrderItem] })
  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items!: OrderItem[];

  @ApiPropertyOptional({ type: () => [OrderStatusHistory] })
  @OneToMany(() => OrderStatusHistory, (h) => h.order, { cascade: true })
  history!: OrderStatusHistory[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
