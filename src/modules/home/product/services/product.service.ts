import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../../product-variant/models/entities/product-variant.entity';
import { CreateProductDto } from '../models/dto/create-product.dto';
import { QueryProductDto } from '../models/dto/query-product.dto';
import { UpdateProductDto } from '../models/dto/update-product.dto';
import { Product } from '../models/entities/product.entity';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) { }

  async create(dto: CreateProductDto): Promise<Product> {
    const slugExists = await this.productRepository.findOne({
      where: { slug: dto.slug },
    });
    if (slugExists) {
      throw new ConflictException(`Slug "${dto.slug}" is already used`);
    }

    const variants = dto.variants.map((v) => {
      const variant = new ProductVariant();
      variant.sku = v.sku;
      variant.name = v.name;
      variant.attributes = v.attributes ?? {};
      variant.price = v.price.toFixed(2);
      variant.stock = v.stock;
      variant.imageUrl = v.imageUrl ?? null;
      variant.isActive = v.isActive ?? true;
      return variant;
    });

    const product = this.productRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      brand: dto.brand ?? null,
      category: dto.category ?? null,
      imageUrl: dto.imageUrl ?? null,
      isActive: dto.isActive ?? true,
      variants,
    });

    return this.productRepository.save(product);
  }

  async findAll(query: QueryProductDto): Promise<PaginatedResult<Product>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .where('product.isActive = :isActive', { isActive: true });

    if (query.search) {
      qb.andWhere(
        '(product.name ILIKE :s OR product.brand ILIKE :s OR product.category ILIKE :s)',
        { s: `%${query.search}%` },
      );
    }
    if (query.category) {
      qb.andWhere('product.category = :category', { category: query.category });
    }
    if (query.brand) {
      qb.andWhere('product.brand = :brand', { brand: query.brand });
    }

    qb.orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { slug } });
    if (!product) {
      throw new NotFoundException(`Product "${slug}" not found`);
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    if (dto.slug && dto.slug !== product.slug) {
      const exists = await this.productRepository.findOne({
        where: { slug: dto.slug },
      });
      if (exists) {
        throw new ConflictException(`Slug "${dto.slug}" is already used`);
      }
    }
    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Product ${id} not found`);
    }
  }
}
