import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductVariant } from '../../../product-variant/models/entities/product-variant.entity';

@Entity({ name: 'products' })
export class Product {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'iPhone 16 Pro' })
  @Index()
  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @ApiProperty({ example: 'iphone-16-pro' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 220, unique: true })
  slug!: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiProperty({ required: false, example: 'Apple' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  brand!: string | null;

  @ApiProperty({ required: false, example: 'Smartphones' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  category!: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @ApiProperty({ type: () => [ProductVariant] })
  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
    eager: true,
  })
  variants!: ProductVariant[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
