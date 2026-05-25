import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PAGINATION } from '../../../../common/constants/pagination.constants';
import {
  PaginatedResult,
  buildPaginatedResult,
} from '../../../../common/dto/paginated-result.dto';
import { CreateCategoryDto } from '../models/dto/create-category.dto';
import { QueryCategoryDto } from '../models/dto/query-category.dto';
import { UpdateCategoryDto } from '../models/dto/update-category.dto';
import { Category } from '../models/entities/category.entity';

/** Pass this as `parentId` on `QueryCategoryDto` to retrieve only roots. */
export const ROOT_PARENT_TOKEN = 'root';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) { }

  async create(dto: CreateCategoryDto): Promise<Category> {
    await this.ensureSlugUnique(dto.slug);
    const parent = await this.resolveParent(dto.parentId ?? null);

    const category = this.categoryRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      imageUrl: dto.imageUrl ?? null,
      isActive: dto.isActive ?? true,
      parentId: parent?.id ?? null,
    });
    return this.categoryRepository.save(category);
  }

  async findAll(query: QueryCategoryDto): Promise<PaginatedResult<Category>> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;

    const qb = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent');

    if (query.search) {
      qb.andWhere('category.name ILIKE :s', { s: `%${query.search}%` });
    }
    if (query.id) {
      qb.andWhere('category.id = :id', { id: query.id });
    }
    if (query.parentId) {
      if (query.parentId === ROOT_PARENT_TOKEN) {
        qb.andWhere('category.parent_id IS NULL');
      } else {
        qb.andWhere('category.parent_id = :parentId', {
          parentId: query.parentId,
        });
      }
    }
    if (query.parentSlug) {
      qb.andWhere('parent.slug = :parentSlug', {
        parentSlug: query.parentSlug,
      });
    }
    if (typeof query.isActive === 'boolean') {
      qb.andWhere('category.isActive = :isActive', { isActive: query.isActive });
    }

    qb.orderBy('category.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResult(data, total, page, limit);
  }

  async findRoots(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { parentId: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: { parent: true, children: true },
    });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug },
      relations: { parent: true, children: true },
    });
    if (!category) {
      throw new NotFoundException(`Category "${slug}" not found`);
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.slug && dto.slug !== category.slug) {
      await this.ensureSlugUnique(dto.slug);
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }
      const parent = await this.resolveParent(dto.parentId ?? null);
      if (parent) {
        await this.ensureNoCycle(id, parent);
      }
      category.parentId = parent?.id ?? null;
    }

    Object.assign(category, {
      name: dto.name ?? category.name,
      slug: dto.slug ?? category.slug,
      description: dto.description ?? category.description,
      imageUrl: dto.imageUrl ?? category.imageUrl,
      isActive: dto.isActive ?? category.isActive,
    });

    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoryRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Category ${id} not found`);
    }
  }

  /**
   * Resolve a parent id to a parent entity. Returns null when no parent was
   * provided; throws when the id was provided but no such category exists.
   */
  private async resolveParent(
    parentId: string | null,
  ): Promise<Category | null> {
    if (!parentId) return null;
    const parent = await this.categoryRepository.findOne({
      where: { id: parentId },
    });
    if (!parent) {
      throw new NotFoundException(`Parent category ${parentId} not found`);
    }
    return parent;
  }

  private async ensureSlugUnique(slug: string): Promise<void> {
    const exists = await this.categoryRepository.findOne({ where: { slug } });
    if (exists) {
      throw new ConflictException(`Slug "${slug}" is already used`);
    }
  }

  /**
   * Walk up the parent chain to make sure assigning `newParent` to category
   * `categoryId` doesn't create a cycle (e.g. A → B → A).
   */
  private async ensureNoCycle(
    categoryId: string,
    newParent: Category,
  ): Promise<void> {
    let cursor: Category | null = newParent;
    while (cursor) {
      if (cursor.id === categoryId) {
        throw new BadRequestException(
          'Cannot move a category under one of its descendants',
        );
      }
      if (!cursor.parentId) break;
      cursor = await this.categoryRepository.findOne({
        where: { id: cursor.parentId },
      });
    }
  }
}
