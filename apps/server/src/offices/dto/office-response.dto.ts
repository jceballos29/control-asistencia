import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';
import { JobPositionResponseDto } from '../../job-positions/dto/job-position-response.dto';
import { TimeSlotResponseDto } from '../../time-slots/dto/time-slot-response.dto';

/**
 * DTO para representar la respuesta de la API para un Consultorio.
 * Incluye conteos de relaciones y formatea las horas como string HH:MM:SS.
 */
export class OfficeResponseDto {
  @ApiProperty({
    description: 'UUID único del consultorio',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del consultorio',
    example: 'Consultorio Principal',
  })
  name: string;

  @ApiProperty({
    description: 'Hora de inicio laboral (formato HH:MM:SS)',
    example: '09:00:00',
    type: String,
  })
  workStartTime: string;

  @ApiProperty({
    description: 'Hora de fin laboral (formato HH:MM:SS)',
    example: '17:00:00',
    type: String,
  })
  workEndTime: string;

  @ApiProperty({
    description: 'Días de la semana en que opera el consultorio',
    example: [DayOfWeek.MONDAY, DayOfWeek.FRIDAY],
    enum: DayOfWeek,
    isArray: true,
  })
  workingDays: DayOfWeek[];

  @ApiProperty({
    description: 'Fecha y hora de creación del registro (ISO 8601)',
    type: String,
    format: 'date-time',
    example: '2025-04-15T14:21:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización (ISO 8601)',
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2025-04-15T15:30:00.000Z',
  })
  updatedAt: Date | null;

  @ApiProperty({
    description: 'Número de franjas horarias asociadas',
    example: 5,
    type: Number,
  })
  timeSlotsCount: number;

  @ApiProperty({
    description: 'Número de puestos de trabajo asociados',
    example: 3,
    type: Number,
  })
  jobPositionsCount: number;

  @ApiProperty({
    description:
      'Lista de franjas horarias asociadas (presente en respuestas de detalle, null/[] en listas)',
    type: () => [TimeSlotResponseDto], // Indica un array del otro DTO para Swagger
    required: false, // Indica que no siempre estará presente
    nullable: true, // Indica que puede ser null
  })
  timeSlots: TimeSlotResponseDto[] | null; // Puede ser un array o null

  @ApiProperty({
    description:
      'Lista de puestos de trabajo asociados (presente en respuestas de detalle, null/[] en listas)',
    type: () => [JobPositionResponseDto], // Indica un array del otro DTO para Swagger
    required: false,
    nullable: true,
  })
  jobPositions: JobPositionResponseDto[] | null; // Puede ser un array o null

  constructor(partial: Partial<OfficeResponseDto>) {
    Object.assign(this, partial);
  }
}
