import { Module } from '@nestjs/common';
import { JobPositionsService } from './job-positions.service';
import { JobPositionsController } from './job-positions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPosition } from './entities/job-position.entity';
import { Office } from 'src/offices/entities/office.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobPosition, Office])
  ],
  providers: [JobPositionsService],
  controllers: [JobPositionsController]
})
export class JobPositionsModule {}
