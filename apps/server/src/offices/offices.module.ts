import { Module } from '@nestjs/common';
import { OfficesController } from './offices.controller';
import { OfficesService } from './offices.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Office } from './entities/office.entity';
import { TimeSlot } from '../time-slots/entities/time-slot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Office, TimeSlot])],
  controllers: [OfficesController],
  providers: [OfficesService],
  exports: [OfficesService]
})

export class OfficesModule {}
