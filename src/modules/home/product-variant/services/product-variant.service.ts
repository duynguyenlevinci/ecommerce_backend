import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../product/models/entities/product.entity';
import { CreateVariantDto } from '../models/dto/create-variant.dto';
import { UpdateVariantDto } from '../models/dto/update-variant.dto';
import { ProductVariant } from '../models/entities/product-variant.entity';

@Injectable()
export class ProductVariantService {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) { }

  async create(dto: CreateVariantDto): Promise<ProductVariant> {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found`);
    }
    const skuExists = await this.variantRepository.findOne({
      where: { sku: dto.sku },
    });
    if (skuExists) {
      throw new ConflictException(`SKU "${dto.sku}" is already used`);
    }
    const variant = this.variantRepository.create({
      productId: dto.productId,
      sku: dto.sku,
      name: dto.name,
      attributes: dto.attributes ?? {},
      price: dto.price.toFixed(2),
      stock: dto.stock,
      imageUrl: dto.imageUrl ?? null,
      isActive: dto.isActive ?? true,
    });
    return this.variantRepository.save(variant);
  }

  findAllForProduct(productId: string): Promise<ProductVariant[]> {
    return this.variantRepository.find({
      where: { productId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ProductVariant> {
    const variant = await this.variantRepository.findOne({ where: { id } });
    if (!variant) {
      throw new NotFoundException(`Variant ${id} not found`);
    }
    return variant;
  }

  async update(id: string, dto: UpdateVariantDto): Promise<ProductVariant> {
    const variant = await this.findOne(id);
    if (dto.sku && dto.sku !== variant.sku) {
      const exists = await this.variantRepository.findOne({
        where: { sku: dto.sku },
      });
      if (exists) {
        throw new ConflictException(`SKU "${dto.sku}" is already used`);
      }
    }
    Object.assign(variant, {
      ...dto,
      price: dto.price !== undefined ? dto.price.toFixed(2) : variant.price,
    });
    return this.variantRepository.save(variant);
  }

  async remove(id: string): Promise<void> {
    const result = await this.variantRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Variant ${id} not found`);
    }
  }
}
