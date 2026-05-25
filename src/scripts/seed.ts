/* eslint-disable no-console */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CreateCategoryDto } from '../modules/home/category/models/dto/create-category.dto';
import { Category } from '../modules/home/category/models/entities/category.entity';
import { CategoryService } from '../modules/home/category/services/category.service';
import { CreateProductDto } from '../modules/home/product/models/dto/create-product.dto';
import { Product } from '../modules/home/product/models/entities/product.entity';
import { ProductService } from '../modules/home/product/services/product.service';

/**
 * Idempotent demo-data seeder. Run with:
 *
 *   npm run seed
 *
 * Re-running is safe: existing categories/products are detected by their
 * `slug` and left untouched.
 */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const log = new Logger('Seed');

  try {
    const categoryService = app.get(CategoryService);
    const productService = app.get(ProductService);

    log.log('Seeding categories…');
    const cats = await seedCategories(categoryService, log);

    log.log('Seeding products…');
    await seedProducts(productService, cats, log);

    log.log('Seed complete.');
  } catch (err) {
    log.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

// ====================================================================
//  CATEGORIES
// ====================================================================

interface CategorySeed extends Omit<CreateCategoryDto, 'parentId'> {
  parentSlug?: string;
}

const CATEGORY_TREE: CategorySeed[] = [
  // Roots
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Phones, laptops, headphones and more.',
    imageUrl: 'https://picsum.photos/seed/cat-electronics/600/400',
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Apparel for men, women and kids.',
    imageUrl: 'https://picsum.photos/seed/cat-fashion/600/400',
  },
  {
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Kitchen, decor and household essentials.',
    imageUrl: 'https://picsum.photos/seed/cat-home/600/400',
  },

  // Electronics children
  {
    name: 'Smartphones',
    slug: 'smartphones',
    parentSlug: 'electronics',
    imageUrl: 'https://picsum.photos/seed/cat-smartphones/600/400',
  },
  {
    name: 'Laptops',
    slug: 'laptops',
    parentSlug: 'electronics',
    imageUrl: 'https://picsum.photos/seed/cat-laptops/600/400',
  },
  {
    name: 'Audio',
    slug: 'audio',
    parentSlug: 'electronics',
    imageUrl: 'https://picsum.photos/seed/cat-audio/600/400',
  },

  // Fashion children
  {
    name: "Men's Wear",
    slug: 'mens-wear',
    parentSlug: 'fashion',
    imageUrl: 'https://picsum.photos/seed/cat-mens/600/400',
  },
  {
    name: "Women's Wear",
    slug: 'womens-wear',
    parentSlug: 'fashion',
    imageUrl: 'https://picsum.photos/seed/cat-womens/600/400',
  },

  // Home children
  {
    name: 'Kitchen',
    slug: 'kitchen',
    parentSlug: 'home-living',
    imageUrl: 'https://picsum.photos/seed/cat-kitchen/600/400',
  },
];

async function seedCategories(
  service: CategoryService,
  log: Logger,
): Promise<Map<string, Category>> {
  const bySlug = new Map<string, Category>();

  for (const seed of CATEGORY_TREE) {
    const existing = await tryFindCategoryBySlug(service, seed.slug);
    if (existing) {
      bySlug.set(seed.slug, existing);
      log.log(`  · category "${seed.slug}" already exists, skipped`);
      continue;
    }

    const parentId = seed.parentSlug
      ? bySlug.get(seed.parentSlug)?.id
      : undefined;

    if (seed.parentSlug && !parentId) {
      throw new Error(
        `Category "${seed.slug}" references unknown parent "${seed.parentSlug}". ` +
          'Check CATEGORY_TREE ordering (parents must come before children).',
      );
    }

    const created = await service.create({
      name: seed.name,
      slug: seed.slug,
      description: seed.description,
      imageUrl: seed.imageUrl,
      parentId,
    });
    bySlug.set(seed.slug, created);
    log.log(`  ✓ category "${seed.slug}" created`);
  }

  return bySlug;
}

async function tryFindCategoryBySlug(
  service: CategoryService,
  slug: string,
): Promise<Category | null> {
  try {
    return await service.findBySlug(slug);
  } catch {
    return null;
  }
}

// ====================================================================
//  PRODUCTS
// ====================================================================

interface ProductSeed extends Omit<CreateProductDto, 'categoryId'> {
  categorySlug: string;
}

const PRODUCT_CATALOG: ProductSeed[] = [
  // ---------- SIMPLE PRODUCTS (1 variant) ---------------------------
  {
    name: 'Apple 20W USB-C Power Adapter',
    slug: 'apple-20w-power-adapter',
    description:
      'Fast, efficient charging at home, in the office, or on the go. ' +
      'Power adapter with USB-C connector.',
    brand: 'Apple',
    categorySlug: 'smartphones',
    imageUrl: 'https://picsum.photos/seed/p-apple-20w/800/600',
    variants: [
      {
        sku: 'APL-20W-USBC',
        name: 'Apple 20W USB-C Power Adapter',
        price: 19.0,
        stock: 100,
      },
    ],
  },
  {
    name: 'Logitech MX Master 3S',
    slug: 'logitech-mx-master-3s',
    description:
      'Performance wireless mouse with quiet clicks, 8K DPI Darkfield sensor, ' +
      'and MagSpeed scrolling.',
    brand: 'Logitech',
    categorySlug: 'laptops',
    imageUrl: 'https://picsum.photos/seed/p-mx-master/800/600',
    variants: [
      {
        sku: 'LOG-MX3S-GRAPHITE',
        name: 'MX Master 3S — Graphite',
        price: 99.0,
        stock: 50,
      },
    ],
  },
  {
    name: 'JBL Tune 510BT',
    slug: 'jbl-tune-510bt',
    description: 'Wireless on-ear headphones with Pure Bass sound, 40h battery.',
    brand: 'JBL',
    categorySlug: 'audio',
    imageUrl: 'https://picsum.photos/seed/p-jbl-510/800/600',
    variants: [
      {
        sku: 'JBL-510BT-BLK',
        name: 'JBL Tune 510BT — Black',
        price: 39.0,
        stock: 80,
      },
    ],
  },
  {
    name: 'Áo thun cotton trắng nam',
    slug: 'ao-thun-cotton-trang-nam',
    description: 'Áo thun cotton 100% basic, dáng regular fit, màu trắng size M.',
    brand: 'Local Brand',
    categorySlug: 'mens-wear',
    imageUrl: 'https://picsum.photos/seed/p-tee-white/800/600',
    variants: [
      {
        sku: 'TEE-COT-WHT-M',
        name: 'Áo thun cotton trắng — M',
        attributes: { size: 'M', color: 'Trắng' },
        price: 9.0,
        stock: 200,
      },
    ],
  },
  {
    name: 'Nồi cơm điện Sharp 1.8L',
    slug: 'noi-com-dien-sharp-18l',
    description: 'Nồi cơm điện nắp gài 1.8L, chống dính, giữ ấm tự động.',
    brand: 'Sharp',
    categorySlug: 'kitchen',
    imageUrl: 'https://picsum.photos/seed/p-sharp-rice/800/600',
    variants: [
      {
        sku: 'SHARP-RC18L',
        name: 'Sharp Rice Cooker 1.8L',
        price: 45.0,
        stock: 30,
      },
    ],
  },

  // ---------- CONFIGURATION PRODUCTS (multi variants) ---------------
  {
    name: 'iPhone 16 Pro',
    slug: 'iphone-16-pro',
    description:
      'A18 Pro chip, titanium design, Camera Control, and the most advanced ' +
      'iPhone camera system ever.',
    brand: 'Apple',
    categorySlug: 'smartphones',
    imageUrl: 'https://picsum.photos/seed/p-iphone-16-pro/800/600',
    variants: [
      {
        sku: 'IP16P-128-BLK',
        name: '128GB · Black Titanium',
        attributes: { storage: '128GB', color: 'Black Titanium' },
        price: 999.0,
        stock: 20,
      },
      {
        sku: 'IP16P-256-BLK',
        name: '256GB · Black Titanium',
        attributes: { storage: '256GB', color: 'Black Titanium' },
        price: 1099.0,
        stock: 18,
      },
      {
        sku: 'IP16P-512-BLK',
        name: '512GB · Black Titanium',
        attributes: { storage: '512GB', color: 'Black Titanium' },
        price: 1299.0,
        stock: 10,
      },
      {
        sku: 'IP16P-128-WHT',
        name: '128GB · White Titanium',
        attributes: { storage: '128GB', color: 'White Titanium' },
        price: 999.0,
        stock: 22,
      },
      {
        sku: 'IP16P-256-WHT',
        name: '256GB · White Titanium',
        attributes: { storage: '256GB', color: 'White Titanium' },
        price: 1099.0,
        stock: 15,
      },
    ],
  },
  {
    name: 'MacBook Pro 14" M3',
    slug: 'macbook-pro-14-m3',
    description:
      'Supercharged by M3, M3 Pro, or M3 Max chips. Up to 22 hours of battery life.',
    brand: 'Apple',
    categorySlug: 'laptops',
    imageUrl: 'https://picsum.photos/seed/p-mbp14-m3/800/600',
    variants: [
      {
        sku: 'MBP14-M3-16-512-SG',
        name: 'M3 · 16GB · 512GB · Space Gray',
        attributes: { chip: 'M3', ram: '16GB', storage: '512GB', color: 'Space Gray' },
        price: 1599.0,
        stock: 8,
      },
      {
        sku: 'MBP14-M3-16-1T-SG',
        name: 'M3 · 16GB · 1TB · Space Gray',
        attributes: { chip: 'M3', ram: '16GB', storage: '1TB', color: 'Space Gray' },
        price: 1799.0,
        stock: 5,
      },
      {
        sku: 'MBP14-M3P-32-1T-SLV',
        name: 'M3 Pro · 32GB · 1TB · Silver',
        attributes: { chip: 'M3 Pro', ram: '32GB', storage: '1TB', color: 'Silver' },
        price: 2299.0,
        stock: 3,
      },
    ],
  },
  {
    name: 'Sony WH-1000XM5',
    slug: 'sony-wh-1000xm5',
    description:
      'Industry-leading noise canceling, crystal clear hands-free calling, ' +
      'up to 30h battery.',
    brand: 'Sony',
    categorySlug: 'audio',
    imageUrl: 'https://picsum.photos/seed/p-sony-xm5/800/600',
    variants: [
      {
        sku: 'SNY-XM5-BLK',
        name: 'WH-1000XM5 — Black',
        attributes: { color: 'Black' },
        price: 399.0,
        stock: 15,
      },
      {
        sku: 'SNY-XM5-SLV',
        name: 'WH-1000XM5 — Silver',
        attributes: { color: 'Silver' },
        price: 399.0,
        stock: 12,
      },
      {
        sku: 'SNY-XM5-BLU',
        name: 'WH-1000XM5 — Midnight Blue',
        attributes: { color: 'Midnight Blue' },
        price: 399.0,
        stock: 10,
      },
    ],
  },
  {
    name: 'Áo polo nam Uniqlo Dry-Ex',
    slug: 'ao-polo-nam-uniqlo-dry-ex',
    description: 'Áo polo nam thấm hút mồ hôi, kháng khuẩn, co giãn.',
    brand: 'Uniqlo',
    categorySlug: 'mens-wear',
    imageUrl: 'https://picsum.photos/seed/p-polo-uniqlo/800/600',
    variants: [
      {
        sku: 'UNQ-POLO-DRYEX-S-BLK',
        name: 'Polo Dry-Ex — Đen — S',
        attributes: { size: 'S', color: 'Đen' },
        price: 25.0,
        stock: 50,
      },
      {
        sku: 'UNQ-POLO-DRYEX-M-BLK',
        name: 'Polo Dry-Ex — Đen — M',
        attributes: { size: 'M', color: 'Đen' },
        price: 25.0,
        stock: 60,
      },
      {
        sku: 'UNQ-POLO-DRYEX-L-BLK',
        name: 'Polo Dry-Ex — Đen — L',
        attributes: { size: 'L', color: 'Đen' },
        price: 25.0,
        stock: 55,
      },
      {
        sku: 'UNQ-POLO-DRYEX-S-WHT',
        name: 'Polo Dry-Ex — Trắng — S',
        attributes: { size: 'S', color: 'Trắng' },
        price: 25.0,
        stock: 40,
      },
      {
        sku: 'UNQ-POLO-DRYEX-M-WHT',
        name: 'Polo Dry-Ex — Trắng — M',
        attributes: { size: 'M', color: 'Trắng' },
        price: 25.0,
        stock: 50,
      },
      {
        sku: 'UNQ-POLO-DRYEX-L-WHT',
        name: 'Polo Dry-Ex — Trắng — L',
        attributes: { size: 'L', color: 'Trắng' },
        price: 25.0,
        stock: 45,
      },
    ],
  },
  {
    name: 'Đầm dạ hội nữ',
    slug: 'dam-da-hoi-nu',
    description: 'Đầm dạ hội nữ kiểu dáng quyến rũ, chất liệu lụa cao cấp.',
    brand: 'Local Brand',
    categorySlug: 'womens-wear',
    imageUrl: 'https://picsum.photos/seed/p-dam-da-hoi/800/600',
    variants: [
      {
        sku: 'DRESS-EVE-S-RED',
        name: 'Đầm dạ hội — Đỏ — S',
        attributes: { size: 'S', color: 'Đỏ' },
        price: 89.0,
        stock: 10,
      },
      {
        sku: 'DRESS-EVE-M-RED',
        name: 'Đầm dạ hội — Đỏ — M',
        attributes: { size: 'M', color: 'Đỏ' },
        price: 89.0,
        stock: 12,
      },
      {
        sku: 'DRESS-EVE-L-RED',
        name: 'Đầm dạ hội — Đỏ — L',
        attributes: { size: 'L', color: 'Đỏ' },
        price: 89.0,
        stock: 8,
      },
      {
        sku: 'DRESS-EVE-S-BLK',
        name: 'Đầm dạ hội — Đen — S',
        attributes: { size: 'S', color: 'Đen' },
        price: 89.0,
        stock: 15,
      },
      {
        sku: 'DRESS-EVE-M-BLK',
        name: 'Đầm dạ hội — Đen — M',
        attributes: { size: 'M', color: 'Đen' },
        price: 89.0,
        stock: 18,
      },
      {
        sku: 'DRESS-EVE-L-BLK',
        name: 'Đầm dạ hội — Đen — L',
        attributes: { size: 'L', color: 'Đen' },
        price: 89.0,
        stock: 12,
      },
    ],
  },
];

async function seedProducts(
  service: ProductService,
  categoriesBySlug: Map<string, Category>,
  log: Logger,
): Promise<void> {
  let simpleCount = 0;
  let configCount = 0;

  for (const seed of PRODUCT_CATALOG) {
    const existing = await tryFindProductBySlug(service, seed.slug);
    if (existing) {
      log.log(`  · product "${seed.slug}" already exists, skipped`);
      continue;
    }

    const category = categoriesBySlug.get(seed.categorySlug);
    if (!category) {
      throw new Error(
        `Product "${seed.slug}" references unknown category "${seed.categorySlug}"`,
      );
    }

    const { categorySlug: _omit, ...rest } = seed;
    await service.create({
      ...rest,
      categoryId: category.id,
    });

    const isConfig = seed.variants.length > 1;
    if (isConfig) configCount += 1;
    else simpleCount += 1;
    log.log(
      `  ✓ product "${seed.slug}" created (${isConfig ? 'configuration' : 'simple'}, ${seed.variants.length} variant${seed.variants.length > 1 ? 's' : ''})`,
    );
  }

  log.log(
    `Products: ${simpleCount} simple + ${configCount} configuration (out of ${PRODUCT_CATALOG.length} total)`,
  );
}

async function tryFindProductBySlug(
  service: ProductService,
  slug: string,
): Promise<Product | null> {
  try {
    return await service.findBySlug(slug);
  } catch {
    return null;
  }
}

void main();
