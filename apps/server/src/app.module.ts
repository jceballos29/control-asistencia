import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { redisStore } from 'cache-manager-redis-store';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobPositionsModule } from './job-positions/job-positions.module';
import { OfficesModule } from './offices/offices.module';
import { PrismaModule } from './prisma/prisma.module';
import { TimeSlotsModule } from './time-slots/time-slots.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: path.join(__dirname, '../../..', '.env'),
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
            connectionName: 'cache-connection',
            connectTimeout: 10000,
          },
          ttl: configService.get<number>('REDIS_TTL'),
        });
        return {
          store: () => store,
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 10,
      },
    ]),
    OfficesModule,
    TimeSlotsModule,
    JobPositionsModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
