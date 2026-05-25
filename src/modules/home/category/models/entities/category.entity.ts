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
import { Product } from '../../../product/models/entities/product.entity';

/**
 * Product category. Self-referencing so categories can be nested
 * (e.g. `Electronics > Smartphones > Foldable`). Products are grouped
 * by a single category via `Product.categoryId`.
 */
@Entity({ name: 'categories' })
export class Category {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'Smartphones' })
  @Index()
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @ApiProperty({ example: 'smartphones' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 170, unique: true })
  slug!: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ description: 'Cover image of the category' })
  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @ApiPropertyOptional({
    description: 'Parent category id (null for top-level categories)',
    nullable: true,
  })
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @ApiPropertyOptional({ type: () => Category, nullable: true })
  @ManyToOne(() => Category, (category) => category.children, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent!: Category | null;

  @ApiProperty({ type: () => [Category] })
  @OneToMany(() => Category, (category) => category.parent)
  children!: Category[];

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
