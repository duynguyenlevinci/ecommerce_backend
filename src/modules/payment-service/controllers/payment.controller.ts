import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { SkipResponseTransform } from '../../../common/decorators/skip-response-transform.decorator';
import { User } from '../../auth/models/entities/user.entity';
import { CreatePaymentDto } from '../models/dto/create-payment.dto';
import { MomoIpnDto } from '../models/dto/momo-ipn.dto';
import { PaymentService } from '../services/payment.service';

@ApiTags('payments')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('momo/create')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a MoMo payment URL for an order',
    description:
      'Returns `payUrl` (and `qrCodeUrl` if available). Redirect the user to `payUrl` to complete the payment.',
  })
  createMomo(@CurrentUser() user: User, @Body() dto: CreatePaymentDto) {
    return this.paymentService.createMomoPayment(user, dto);
  }

  @Public()
  @Post('momo/ipn')
  @HttpCode(HttpStatus.OK)
  @SkipResponseTransform()
  @ApiOperation({
    summary: 'MoMo IPN callback (server-to-server, public)',
    description:
      'MoMo calls this endpoint after the user finishes paying. The endpoint verifies the HMAC-SHA256 signature, then marks the corresponding order as PAID on success. The response is returned as MoMo expects, NOT wrapped in BaseResponse.',
  })
  momoIpn(@Body() payload: MomoIpnDto) {
    return this.paymentService.handleMomoIpn(payload);
  }

  @Get('order/:orderId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List payment attempts for an order (owner or admin)' })
  findAllForOrder(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @CurrentUser() user: User,
  ) {
    return this.paymentService.findAllForOrder(orderId, user);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a payment by id (owner or admin)' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.paymentService.findOne(id, user);
  }
}
