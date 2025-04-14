import { Module } from '@nestjs/common';
import { TimeSlotsService } from './time-slots.service';
import { TimeSlotsController } from './time-slots.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeSlot } from './entities/time-slot.entity';
import { Office } from 'src/offices/entities/office.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimeSlot, Office]),
  ],
  providers: [TimeSlotsService],
  controllers: [TimeSlotsController]
})
export class TimeSlotsModule {}
