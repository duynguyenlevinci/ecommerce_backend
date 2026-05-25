import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../../../common/decorators/public.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { CreateProductDto } from '../models/dto/create-product.dto';
import { QueryProductDto } from '../models/dto/query-product.dto';
import { UpdateProductDto } from '../models/dto/update-product.dto';
import { Product } from '../models/entities/product.entity';
import { ProductService } from '../services/product.service';

@ApiTags('home / products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse products (paginated, filter, search)' })
  findAll(@Query() query: QueryProductDto) {
    return this.productService.findAll(query);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug (product detail page)' })
  @ApiResponse({ status: 200, type: Product })
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a product with variants (admin only)' })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a product (admin only)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product (admin only)' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productService.remove(id);
  }
}
