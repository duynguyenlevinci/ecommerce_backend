import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { User } from '../../../auth/models/entities/user.entity';
import {
  BulkCancelOrdersDto,
  BulkCancelResultDto,
} from '../models/dto/bulk-cancel-orders.dto';
import { CancelOrderDto } from '../models/dto/cancel-order.dto';
import { CreateOrderDto } from '../models/dto/create-order.dto';
import { QueryOrderDto } from '../models/dto/query-order.dto';
import { UpdateOrderStatusDto } from '../models/dto/update-order-status.dto';
import { OrderService } from '../services/order.service';

@ApiTags('home / orders')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post()
  @ApiOperation({ summary: 'Place a new order for the current user' })
  create(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.orderService.create(user, dto);
  }

  @Get('my')
  @ApiOperation({
    summary: 'List orders of the current user (paginated, filter by status)',
  })
  myOrders(@CurrentUser() user: User, @Query() query: QueryOrderDto) {
    return this.orderService.findAllForUser(user.id, query);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all orders (admin, paginated, filterable)' })
  findAll(@Query() query: QueryOrderDto) {
    return this.orderService.findAll(query);
  }

  @Get('code/:orderCode')
  @ApiOperation({ summary: 'Look up an order by its public order code (owner or admin)' })
  findByCode(
    @Param('orderCode') orderCode: string,
    @CurrentUser() user: User,
  ) {
    return this.orderService.findByCode(orderCode, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by id (owner or admin)' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.orderService.findOne(id, user);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get status timeline of an order (owner or admin)' })
  findHistory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.orderService.findHistory(id, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Transition order status (admin only, FSM-validated)',
    description:
      'Allowed transitions: PENDING → PAID|CANCELLED, PAID → SHIPPED|CANCELLED, SHIPPED → DELIVERED. ' +
      'Cancellations automatically refund stock; SHIPPED accepts trackingNumber/courier.',
  })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() actor: User,
  ) {
    return this.orderService.updateStatus(id, dto, actor);
  }

  @Post('bulk-cancel')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Bulk cancel orders (admin only)',
    description:
      'Cancel many orders in one call. Pick either:\n' +
      '- `orderIds`: hand-picked list (UI checkbox), OR\n' +
      '- a filter `status` + `createdBefore` (e.g. all PENDING older than X).\n\n' +
      'Each cancellation runs in its own transaction: stock is refunded and a ' +
      'history entry is appended. Orders whose status cannot be cancelled ' +
      '(SHIPPED, DELIVERED, already CANCELLED) are returned in `skipped`.',
  })
  @ApiOkResponse({ type: BulkCancelResultDto })
  bulkCancel(
    @Body() dto: BulkCancelOrdersDto,
    @CurrentUser() actor: User,
  ) {
    return this.orderService.bulkCancel(dto, actor);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel a pending order (owner). Stock is automatically refunded.',
  })
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orderService.cancel(id, user, dto);
  }
}
