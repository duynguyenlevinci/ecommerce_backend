export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigin: string;
  publicUrl: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  maxAgeDays: number;
}

export interface BcryptConfig {
  saltRounds: number;
}

export interface SwaggerConfig {
  enabled: boolean;
  path: string;
}

export interface MomoConfig {
  endpoint: string;
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  redirectUrl: string;
  ipnUrl: string;
  requestType: string;
}

export interface AppConfiguration {
  app: AppConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
  bcrypt: BcryptConfig;
  swagger: SwaggerConfig;
  momo: MomoConfig;
}

const toBool = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
};

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default (): AppConfiguration => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: toInt(process.env.PORT, 3000),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    publicUrl: process.env.PUBLIC_URL ?? 'http://localhost:3000',
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: toInt(process.env.DB_PORT, 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'ecommerce',
    synchronize: toBool(process.env.DB_SYNCHRONIZE, true),
    logging: toBool(process.env.DB_LOGGING, false),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
    maxAgeDays: toInt(process.env.JWT_MAX_AGE_DAYS, 30),
  },
  bcrypt: {
    saltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 10),
  },
  swagger: {
    enabled: toBool(process.env.SWAGGER_ENABLED, true),
    path: process.env.SWAGGER_PATH ?? 'docs',
  },
  momo: {
    endpoint:
      process.env.MOMO_ENDPOINT ??
      'https://test-payment.momo.vn/v2/gateway/api/create',
    partnerCode: process.env.MOMO_PARTNER_CODE ?? 'MOMO',
    accessKey: process.env.MOMO_ACCESS_KEY ?? 'F8BBA842ECF85',
    secretKey:
      process.env.MOMO_SECRET_KEY ?? 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    redirectUrl:
      process.env.MOMO_REDIRECT_URL ?? 'http://localhost:3000/payment/result',
    ipnUrl:
      process.env.MOMO_IPN_URL ??
      'http://localhost:3000/api/v1/payment/momo/ipn',
    requestType: process.env.MOMO_REQUEST_TYPE ?? 'payWithMethod',
  },
});
