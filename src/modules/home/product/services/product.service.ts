import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MONEY } from '../../../../common/constants/money.constants';
import { PAGINATION } from '../../../../common/constants/pagination.constants';
import {
  PaginatedResult,
  buildPaginatedResult,
} from '../../../../common/dto/paginated-result.dto';
import { Category } from '../../category/models/entities/category.entity';
import { ProductVariant } from '../../product-variant/models/entities/product-variant.entity';
import {
  PRODUCT_SIMPLE_MAX_VARIANTS,
  PRODUCT_TYPE,
  ProductType,
} from '../constants/product.constants';
import { CreateProductDto } from '../models/dto/create-product.dto';
import { QueryProductDto } from '../models/dto/query-product.dto';
import { UpdateProductDto } from '../models/dto/update-product.dto';
import { Product } from '../models/entities/product.entity';

export type ProductListItem = Product & {
  type: ProductType;
  /** Present only when `type === 'simple'`. */
  price?: string;
  /** Present only when `type === 'configuration'`. */
  minPrice?: string;
  /** Present only when `type === 'configuration'`. */
  maxPrice?: string;
};

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) { }

  async create(dto: CreateProductDto): Promise<Product> {
    const slugExists = await this.productRepository.findOne({
      where: { slug: dto.slug },
    });
    if (slugExists) {
      throw new ConflictException(`Slug "${dto.slug}" is already used`);
    }

    const categoryId = await this.resolveCategoryId(dto.categoryId);

    const variants = dto.variants.map((v) => {
      const variant = new ProductVariant();
      variant.sku = v.sku;
      variant.name = v.name;
      variant.attributes = v.attributes ?? {};
      variant.price = v.price.toFixed(MONEY.DECIMAL_PLACES);
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
      categoryId,
      imageUrl: dto.imageUrl ?? null,
      isActive: dto.isActive ?? true,
      variants,
    });

    return this.productRepository.save(product);
  }

  async findAll(
    query: QueryProductDto,
  ): Promise<PaginatedResult<ProductListItem>> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;
    const includeSubs = query.includeSubcategories !== false;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :isActive', { isActive: true });

    const search = query.search?.trim();
    if (search) {
      qb.andWhere('product.name ILIKE :s', { s: `%${search}%` });
    }

    if (query.categoryId || query.categorySlug) {
      const categoryIds = await this.resolveCategoryFilterIds(
        query.categoryId,
        query.categorySlug,
        includeSubs,
      );
      if (categoryIds.length === 0) {
        // Category filter requested but no match → return empty page.
        return buildPaginatedResult<ProductListItem>([], 0, page, limit);
      }
      qb.andWhere('product.category_id IN (:...categoryIds)', { categoryIds });
    }

    if (query.brand) {
      qb.andWhere('product.brand = :brand', { brand: query.brand });
    }

    qb.orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResult(
      data.map((p) => this.toListItem(p)),
      total,
      page,
      limit,
    );
  }

  /**
   * Resolve the user-provided category filter (id or slug) into the set of
   * category ids products should match. When `includeSubcategories` is true,
   * the full descendant subtree is expanded so e.g. filtering by `Electronics`
   * also returns products in `Smartphones`, `Laptops`, etc.
   *
   * Returns `[]` when the filter was provided but didn't match any category
   * (lets the caller short-circuit to an empty result without throwing).
   */
  private async resolveCategoryFilterIds(
    categoryId: string | undefined,
    categorySlug: string | undefined,
    includeSubcategories: boolean,
  ): Promise<string[]> {
    let rootId: string | undefined = categoryId;

    if (!rootId && categorySlug) {
      const root = await this.categoryRepository.findOne({
        where: { slug: categorySlug },
        select: { id: true },
      });
      rootId = root?.id;
    }

    if (!rootId) return [];

    if (!includeSubcategories) return [rootId];

    return this.getCategorySubtreeIds(rootId);
  }

  /**
   * Walk the category tree starting at `rootId` and return every id in its
   * subtree (root included). Uses iterative BFS so it works on any database
   * without recursive CTE syntax.
   */
  private async getCategorySubtreeIds(rootId: string): Promise<string[]> {
    const all = new Set<string>([rootId]);
    let frontier: string[] = [rootId];

    while (frontier.length > 0) {
      const children = await this.categoryRepository.find({
        where: { parentId: In(frontier) },
        select: { id: true },
      });
      const nextFrontier: string[] = [];
      for (const child of children) {
        if (!all.has(child.id)) {
          all.add(child.id);
          nextFrontier.push(child.id);
        }
      }
      frontier = nextFrontier;
    }

    return [...all];
  }

  /**
   * Decide a product's storefront type and surface a price summary:
   *
   * - 0 or 1 variant  → `type: 'simple'`,        `price: <variant.price | '0.00'>`
   * - 2+ variants     → `type: 'configuration'`, `minPrice` & `maxPrice` across variants
   */
  private toListItem(product: Product): ProductListItem {
    const variants = product.variants ?? [];

    if (variants.length > PRODUCT_SIMPLE_MAX_VARIANTS) {
      const prices = variants.map((v) => Number(v.price));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      return Object.assign(product, {
        type: PRODUCT_TYPE.CONFIGURATION,
        minPrice: minPrice.toFixed(MONEY.DECIMAL_PLACES),
        maxPrice: maxPrice.toFixed(MONEY.DECIMAL_PLACES),
      });
    }

    const onlyPrice = variants[0]?.price ?? MONEY.ZERO_AMOUNT;
    return Object.assign(product, {
      type: PRODUCT_TYPE.SIMPLE,
      price: onlyPrice,
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: { category: true },
    });
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

    if (dto.categoryId !== undefined) {
      product.categoryId = await this.resolveCategoryId(dto.categoryId);
    }

    const { categoryId: _omit, ...rest } = dto;
    Object.assign(product, rest);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Product ${id} not found`);
    }
  }

  /**
   * Validate that a category exists (when an id is provided) and return its
   * id. Passing `undefined`/`null` clears the category and returns null.
   */
  private async resolveCategoryId(
    categoryId: string | null | undefined,
  ): Promise<string | null> {
    if (!categoryId) return null;
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }
    return category.id;
  }
}
