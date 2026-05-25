import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductVariant } from '../../../product-variant/models/entities/product-variant.entity';
import { Order } from './order.entity';

@Entity({ name: 'order_items' })
export class OrderItem {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => ProductVariant, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'variant_id' })
  variant!: ProductVariant;

  @ApiProperty()
  @Column({ name: 'variant_id', type: 'uuid' })
  variantId!: string;

  @ApiProperty({ example: 'iPhone 16 Pro - 256GB Black' })
  @Column({ name: 'product_name', type: 'varchar', length: 255 })
  productName!: string;

  @ApiProperty({ example: 2 })
  @Column({ type: 'int' })
  quantity!: number;

  @ApiProperty({ example: '1299.99' })
  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
  unitPrice!: string;

  @ApiProperty({ example: '2599.98' })
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  subtotal!: string;
}
