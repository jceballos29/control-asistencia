import { PartialType } from '@nestjs/mapped-types';
import { CreateTimeSlotDto } from './create-time-slot.dto';
import { IsOptional, IsString, Matches } from 'class-validator';
import { IsEndTimeAfterStartTime } from '../../common/validators/is-end-time-after-start-time.validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTimeSlotDto extends PartialType(CreateTimeSlotDto) {
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/, {
    message: 'La hora de fin debe tener el formato HH:MM o HH:MM:SS.',
  })
  @IsEndTimeAfterStartTime('startTime', {
    message:
      'Si se proporcionan ambas horas, la hora de fin debe ser posterior a la hora de inicio.',
  })
  @ApiProperty({
    required: false,
    example: '16:00:00',
    description: 'Nueva hora de fin (HH:MM:SS)',
  })
  endTime?: string;

  @ApiProperty({
    required: false,
    example: '13:30:00',
    description: 'Nueva hora de inicio (HH:MM:SS)',
  })
  startTime?: string;
}
