import { ApiProperty } from '@nestjs/swagger';

export class JobPositionResponseDto {
  @ApiProperty({
    description: 'UUID único del puesto de trabajo',
    example: 'b2c3d479-e5f6-4372-a567-0e02b2c3d479',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del puesto de trabajo',
    example: 'Recepcionista',
  })
  name: string;

  @ApiProperty({
    description: 'Color hexadecimal asociado al puesto',
    example: '#3498DB',
  })
  color: string;

  @ApiProperty({
    description: 'UUID del consultorio al que pertenece el puesto',
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
}
