import {
  IsArray, // Para validar arrays de objetos
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength
} from 'class-validator';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';
  
  export class CreateOfficeDto {
    @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
    @IsString()
    @MaxLength(255)
    name: string;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/, {
      message: 'La hora de inicio laboral debe tener el formato HH:MM o HH:MM:SS.',
    })
    workStartTime?: string;
  
    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/, {
      message: 'La hora de fin laboral debe tener el formato HH:MM o HH:MM:SS.',
    })
    workEndTime?: string;
  
    @IsArray()
    @IsEnum(DayOfWeek, { each: true, message: 'Cada día laborable debe ser un valor válido de DayOfWeek.' })
    workingDays?: DayOfWeek[];
  }