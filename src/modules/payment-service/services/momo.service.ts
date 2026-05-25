import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MomoConfig } from '../../../config/configuration';
import { MOMO } from '../constants/momo.constants';

export interface MomoCreatePaymentRequest {
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  extraData?: string;
}

export interface MomoCreatePaymentResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl: string;
  deeplink?: string;
  qrCodeUrl?: string;
  deeplinkMiniApp?: string;
  shortLink?: string;
  [key: string]: unknown;
}

@Injectable()
export class MomoService {
  private readonly logger = new Logger(MomoService.name);

  constructor(private readonly configService: ConfigService) { }

  private getConfig(): MomoConfig {
    const cfg = this.configService.get<MomoConfig>('momo');
    if (!cfg) {
      throw new Error('MoMo configuration is missing');
    }
    return cfg;
  }

  /**
   * Build HMAC-SHA256 signature from the canonical raw string and secret key.
   */
  private sign(raw: string, secretKey: string): string {
    return crypto.createHmac('sha256', secretKey).update(raw).digest('hex');
  }

  /**
   * Build the canonical raw signature string used when creating a payment.
   * Field order is strictly defined by MoMo and must not change.
   */
  private buildCreateSignatureRaw(
    cfg: MomoConfig,
    body: {
      amount: number;
      extraData: string;
      orderId: string;
      orderInfo: string;
      requestId: string;
    },
  ): string {
    return (
      `accessKey=${cfg.accessKey}` +
      `&amount=${body.amount}` +
      `&extraData=${body.extraData}` +
      `&ipnUrl=${cfg.ipnUrl}` +
      `&orderId=${body.orderId}` +
      `&orderInfo=${body.orderInfo}` +
      `&partnerCode=${cfg.partnerCode}` +
      `&redirectUrl=${cfg.redirectUrl}` +
      `&requestId=${body.requestId}` +
      `&requestType=${cfg.requestType}`
    );
  }

  /**
   * Build the canonical raw signature string used when verifying an IPN callback.
   */
  private buildIpnSignatureRaw(
    cfg: MomoConfig,
    body: {
      amount: number;
      extraData: string;
      message: string;
      orderId: string;
      orderInfo: string;
      orderType: string;
      partnerCode: string;
      payType: string;
      requestId: string;
      responseTime: number;
      resultCode: number;
      transId: number;
    },
  ): string {
    return (
      `accessKey=${cfg.accessKey}` +
      `&amount=${body.amount}` +
      `&extraData=${body.extraData}` +
      `&message=${body.message}` +
      `&orderId=${body.orderId}` +
      `&orderInfo=${body.orderInfo}` +
      `&orderType=${body.orderType}` +
      `&partnerCode=${body.partnerCode}` +
      `&payType=${body.payType}` +
      `&requestId=${body.requestId}` +
      `&responseTime=${body.responseTime}` +
      `&resultCode=${body.resultCode}` +
      `&transId=${body.transId}`
    );
  }

  async createPayment(
    input: MomoCreatePaymentRequest,
  ): Promise<MomoCreatePaymentResponse> {
    const cfg = this.getConfig();
    const extraData = input.extraData ?? '';

    const rawSignature = this.buildCreateSignatureRaw(cfg, {
      amount: input.amount,
      extraData,
      orderId: input.orderId,
      orderInfo: input.orderInfo,
      requestId: input.requestId,
    });
    const signature = this.sign(rawSignature, cfg.secretKey);

    const body = {
      partnerCode: cfg.partnerCode,
      accessKey: cfg.accessKey,
      requestId: input.requestId,
      amount: input.amount,
      orderId: input.orderId,
      orderInfo: input.orderInfo,
      redirectUrl: cfg.redirectUrl,
      ipnUrl: cfg.ipnUrl,
      extraData,
      requestType: cfg.requestType,
      signature,
      lang: MOMO.LANG,
    };

    this.logger.debug(`MoMo create request for order=${input.orderId}`);

    const response = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `MoMo HTTP ${response.status} ${response.statusText}: ${text}`,
      );
    }

    const data = (await response.json()) as MomoCreatePaymentResponse;
    if (data.resultCode !== MOMO.RESULT_CODE_SUCCESS) {
      this.logger.warn(
        `MoMo returned resultCode=${data.resultCode} message="${data.message}"`,
      );
    }
    return data;
  }

  verifyIpnSignature(payload: {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: number;
    orderInfo: string;
    orderType: string;
    transId: number;
    resultCode: number;
    message: string;
    payType: string;
    responseTime: number;
    extraData?: string;
    signature: string;
  }): boolean {
    const cfg = this.getConfig();
    const raw = this.buildIpnSignatureRaw(cfg, {
      amount: payload.amount,
      extraData: payload.extraData ?? '',
      message: payload.message,
      orderId: payload.orderId,
      orderInfo: payload.orderInfo,
      orderType: payload.orderType,
      partnerCode: payload.partnerCode,
      payType: payload.payType,
      requestId: payload.requestId,
      responseTime: payload.responseTime,
      resultCode: payload.resultCode,
      transId: payload.transId,
    });
    const expected = this.sign(raw, cfg.secretKey);
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(payload.signature, 'utf8'),
    );
  }
}
