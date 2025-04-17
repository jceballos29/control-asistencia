import { ApiProperty } from "@nestjs/swagger";

export class TimeSlotResponseDto {
  @ApiProperty({
    description: 'UUID único de la franja horaria',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id: string;

  @ApiProperty({
    description: 'Hora de inicio de la franja (formato HH:MM:SS)',
    example: '14:00:00',
    type: String,
  })
  startTime: string;

  @ApiProperty({
    description: 'Hora de fin de la franja (formato HH:MM:SS)',
    example: '15:30:00',
    type: String,
  })
  endTime: string;

  @ApiProperty({
    description: 'UUID del consultorio al que pertenece la franja',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  officeId: string;

  @ApiProperty({
    description: 'Fecha y hora de creación del registro (ISO 8601)',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización (ISO 8601)',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  updatedAt: Date | null;

   constructor(partial: Partial<TimeSlotResponseDto>) {
     Object.assign(this, partial);
   }
}