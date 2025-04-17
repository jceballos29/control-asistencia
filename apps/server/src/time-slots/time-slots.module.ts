import { Module } from '@nestjs/common';
import { TimeSlotsService } from './time-slots.service';
import { TimeSlotsController } from './time-slots.controller';

@Module({
  providers: [TimeSlotsService],
  controllers: [TimeSlotsController],
  exports: [TimeSlotsService],
})
export class TimeSlotsModule {}
