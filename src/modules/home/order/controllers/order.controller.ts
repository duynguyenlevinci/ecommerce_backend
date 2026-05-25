import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { User } from '../../../auth/models/entities/user.entity';
import { CreateOrderDto } from '../models/dto/create-order.dto';
import { UpdateOrderStatusDto } from '../models/dto/update-order-status.dto';
import { OrderService } from '../services/order.service';

@ApiTags('home / orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post()
  @ApiOperation({ summary: 'Place a new order for the current user' })
  create(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.orderService.create(user, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'List orders of the current user' })
  myOrders(@CurrentUser() user: User) {
    return this.orderService.findAllForUser(user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all orders (admin only)' })
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by id (owner or admin)' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.orderService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update order status (admin only)' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending order (owner or admin)' })
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.orderService.cancel(id, user);
  }
}
