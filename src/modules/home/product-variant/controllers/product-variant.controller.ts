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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../common/decorators/public.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { CreateVariantDto } from '../models/dto/create-variant.dto';
import { UpdateVariantDto } from '../models/dto/update-variant.dto';
import { ProductVariantService } from '../services/product-variant.service';

@ApiTags('home / product variants')
@Controller('product-variants')
export class ProductVariantController {
  constructor(private readonly variantService: ProductVariantService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List variants of a product (public)' })
  findAll(@Query('productId', new ParseUUIDPipe()) productId: string) {
    return this.variantService.findAllForProduct(productId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a variant by id (public)' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.variantService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a variant to a product (admin)' })
  create(@Body() dto: CreateVariantDto) {
    return this.variantService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a variant (admin)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.variantService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a variant (admin)' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.variantService.remove(id);
  }
}
