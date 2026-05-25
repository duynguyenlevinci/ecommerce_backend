import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfig, SwaggerConfig } from './config/configuration';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app');
  const swaggerConfig = configService.get<SwaggerConfig>('swagger');

  if (!appConfig) {
    throw new Error('App configuration missing');
  }

  app.setGlobalPrefix(appConfig.apiPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableCors({ origin: appConfig.corsOrigin, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new ResponseInterceptor(reflector),
  );
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));

  if (swaggerConfig?.enabled) {
    const builder = new DocumentBuilder()
      .setTitle('Ecommerce Backend API')
      .setDescription(
        'REST API for the ecommerce backend. All endpoints return the BaseResponse envelope: { statusCode, errors, data }.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, builder);
    SwaggerModule.setup(swaggerConfig.path, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(appConfig.port);
  const url = await app.getUrl();

  console.log(`Application running at ${url}/${appConfig.apiPrefix}/v1`);
  if (swaggerConfig?.enabled) {
    console.log(`Swagger docs:        ${url}/${swaggerConfig.path}`);
  }
}

void bootstrap();
