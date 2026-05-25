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
import { Product } from '../../../product/models/entities/product.entity';

@Entity({ name: 'product_variants' })
export class ProductVariant {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ApiProperty()
  @Index()
  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ApiProperty({ example: 'IP16PRO-256-BLK' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  sku!: string;

  @ApiProperty({ example: '256GB Black Titanium' })
  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @ApiProperty({
    example: { storage: '256GB', color: 'Black' },
    description: 'Attributes describing the variant (size, color, ...)',
  })
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  attributes!: Record<string, string>;

  @ApiProperty({ example: '1299.99' })
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: string;

  @ApiProperty({ example: 50 })
  @Column({ type: 'int', default: 0 })
  stock!: number;

  @ApiProperty({ required: false })
  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
