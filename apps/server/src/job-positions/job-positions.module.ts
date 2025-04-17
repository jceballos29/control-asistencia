import { Module } from '@nestjs/common';
import { JobPositionsService } from './job-positions.service';
import { JobPositionsController } from './job-positions.controller';

@Module({
  providers: [JobPositionsService],
  controllers: [JobPositionsController],
  exports: [JobPositionsService]
})
export class JobPositionsModule {}
