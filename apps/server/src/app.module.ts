import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { redisStore } from 'cache-manager-redis-store';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobPosition } from './job-positions/entities/job-position.entity';
import { JobPositionsModule } from './job-positions/job-positions.module';
import { Office } from './offices/entities/office.entity';
import { OfficesModule } from './offices/offices.module';
import { TimeSlot } from './time-slots/entities/time-slot.entity';
import { TimeSlotsModule } from './time-slots/time-slots.module';
import * as path from 'path';

@Module({
  imports: [
    

ConfigModule.forRoot({
      envFilePath: path.join(__dirname, '../../..', '.env'),
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: configService.get<number>('POSTGRES_PORT'),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        entities: [Office, JobPosition, TimeSlot],
        synchronize: true,
        logging: false,
      }),
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
