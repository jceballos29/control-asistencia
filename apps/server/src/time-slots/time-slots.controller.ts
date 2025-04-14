import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { TimeSlotsService } from './time-slots.service';

@Controller('offices/:officeId/time-slots')
export class TimeSlotsController {
  constructor(private readonly timeSlotsService: TimeSlotsService) {}

  @Post()
  create(
    @Param('officeId', ParseUUIDPipe) officeId: string,
    @Body() createTimeSlotDto: CreateTimeSlotDto,
  ) {
    return this.timeSlotsService.create(officeId, createTimeSlotDto);
  }

  @Get()
  findAllForOffice(@Param('officeId', ParseUUIDPipe) officeId: string) {
    return this.timeSlotsService.findAllForOffice(officeId);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTimeSlotDto: UpdateTimeSlotDto,
  ) {
    return this.timeSlotsService.update(id, updateTimeSlotDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.timeSlotsService.remove(id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAllForOffice(@Param('officeId', ParseUUIDPipe) officeId: string) {
    return this.timeSlotsService.removeAllForOffice(officeId);
  }
}
