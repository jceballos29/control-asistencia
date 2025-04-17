import { DayOfWeek } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { IsEndTimeAfterStartTime } from '../../common/validators/is-end-time-after-start-time.validator';

export class CreateOfficeDto {
  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  @IsString()
  @MaxLength(255)
  name: string;

  @IsNotEmpty({ message: 'La hora de inicio laboral es obligatoria.'})
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/, {
    message:
      'La hora de inicio laboral debe tener el formato HH:MM o HH:MM:SS.',
  })
  workStartTime: string;

  @IsNotEmpty({ message: 'La hora de fin laboral es obligatoria.'})
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/, {
    message: 'La hora de fin laboral debe tener el formato HH:MM o HH:MM:SS.',
  })
  @IsEndTimeAfterStartTime('workStartTime', { 
     message: 'La hora de fin laboral debe ser posterior a la hora de inicio laboral.'
  })
  workEndTime: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'Debe seleccionar al menos un día laborable.'}) 
  @IsEnum(DayOfWeek, {
    each: true,
    message: 'Cada día laborable debe ser un valor válido de DayOfWeek.',
  })
  workingDays: DayOfWeek[];
}
