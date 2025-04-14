import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('bootstrap');

  const origin = `${configService.get<string>('URL_ADDRESS')}:${configService.get<number>('FRONTEND_PORT')}`;
  app.enableCors({
    origin: origin,
    credentials: true,
  });
  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.setGlobalPrefix('api/v1');
  const PORT = configService.get<number>('BACKEND_PORT') || 4000;
  await app.listen(PORT);
  logger.log(`Backend application is running on: ${await app.getUrl()}`);
}
bootstrap();
