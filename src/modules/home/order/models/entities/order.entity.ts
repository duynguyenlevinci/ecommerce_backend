import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus } from '../../../../../common/enums/order-status.enum';
import { User } from '../../../../auth/models/entities/user.entity';
import { OrderItem } from './order-item.entity';

@Entity({ name: 'orders' })
export class Order {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'ORD-1717000000000-AB12' })
  @Column({ name: 'order_code', type: 'varchar', length: 64, unique: true })
  orderCode!: string;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ApiProperty()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
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

  @ApiProperty({ required: false })
  @Column({ name: 'shipping_address', type: 'text', nullable: true })
  shippingAddress!: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'note', type: 'text', nullable: true })
  note!: string | null;

  @ApiProperty({ type: () => [OrderItem] })
  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items!: OrderItem[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
