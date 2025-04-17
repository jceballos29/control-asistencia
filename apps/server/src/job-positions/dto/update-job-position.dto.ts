import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { CreateJobPositionDto } from './create-job-position.dto';

export class UpdateJobPositionDto extends PartialType(CreateJobPositionDto) {
  @ApiProperty({
    required: false,
    example: 'Recepcionista Senior',
    description: 'Nuevo nombre del puesto',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    required: false,
    example: '#E74C3C',
    description: 'Nuevo color hexadecimal',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'El color debe ser un código hexadecimal válido (ej: #FF5733).',
  })
  color?: string;
}
