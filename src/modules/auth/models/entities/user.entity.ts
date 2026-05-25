import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { Order } from '../../../home/order/models/entities/order.entity';

@Entity({ name: 'users' })
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'john@example.com' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @ApiProperty({ example: 'John Doe' })
  @Column({ type: 'varchar', length: 120 })
  fullName!: string;

  @ApiProperty({ example: '0987654321', required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role!: UserRole;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
