import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('bootstrap');

  const config = new DocumentBuilder()
    .setTitle('Attendance Control API')
    .setDescription('Application for monitoring patient attendance at therapies or consultations.')
    .setVersion('1.0')
    .addTag('attendance-control')
    .build();
  
  const document = () => SwaggerModule.createDocument(app, config);
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
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');
  SwaggerModule.setup('api/v1/docs', app, document());
  const PORT = configService.get<number>('BACKEND_PORT') || 4000;
  await app.listen(PORT);
  logger.log(`Backend application is running on: ${await app.getUrl()}`);
}
bootstrap();
