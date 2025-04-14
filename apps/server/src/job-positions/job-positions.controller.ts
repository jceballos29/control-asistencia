import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post
} from '@nestjs/common';
import { CreateJobPositionDto } from './dto/create-job-position.dto';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { JobPositionsService } from './job-positions.service';

@Controller('offices/:officeId/job-positions')
export class JobPositionsController {
  constructor(private readonly jobPositionsService: JobPositionsService) {}

  @Post()
  create(
    @Param('officeId', ParseUUIDPipe) officeId: string,
    @Body() createJobPositionDto: CreateJobPositionDto,
  ) {
    return this.jobPositionsService.create(officeId, createJobPositionDto);
  }

  @Get()
  findAllForOffice(@Param('officeId', ParseUUIDPipe) officeId: string) {
    return this.jobPositionsService.findAllForOffice(officeId);
  }

  @Patch(':jobPositionId')
  update(
    @Param('jobPositionId', ParseUUIDPipe) jobPositionId: string,
    @Body() updateJobPositionDto: UpdateJobPositionDto,
  ) {
    return this.jobPositionsService.update(jobPositionId, updateJobPositionDto);
  }

  @Delete(':jobPositionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('jobPositionId', ParseUUIDPipe) jobPositionId: string) {
    return this.jobPositionsService.remove(jobPositionId);
  }
}
