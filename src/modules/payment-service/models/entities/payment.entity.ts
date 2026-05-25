import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  PaymentProvider,
  PaymentStatus,
} from '../../../../common/enums/payment-status.enum';
import { Order } from '../../../home/order/models/entities/order.entity';

@Entity({ name: 'payments' })
export class Payment {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ApiProperty()
  @Index()
  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ApiProperty({ example: 'ORD-1717000000000-AB12' })
  @Index()
  @Column({ name: 'order_code', type: 'varchar', length: 64 })
  orderCode!: string;

  @ApiProperty({ example: 'REQ-1717000000000-XYZ1' })
  @Index({ unique: true })
  @Column({ name: 'request_id', type: 'varchar', length: 64, unique: true })
  requestId!: string;

  @ApiProperty({ enum: PaymentProvider, example: PaymentProvider.MOMO })
  @Column({ type: 'enum', enum: PaymentProvider, default: PaymentProvider.MOMO })
  provider!: PaymentProvider;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @ApiProperty({ example: '199.98' })
  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount!: string;

  @ApiProperty({ example: 'VND' })
  @Column({ type: 'varchar', length: 8, default: 'VND' })
  currency!: string;

  @ApiProperty({ required: false })
  @Column({ name: 'pay_url', type: 'text', nullable: true })
  payUrl!: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'qr_code_url', type: 'text', nullable: true })
  qrCodeUrl!: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'transaction_id', type: 'varchar', length: 100, nullable: true })
  transactionId!: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'raw_response', type: 'jsonb', nullable: true })
  rawResponse!: Record<string, unknown> | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
