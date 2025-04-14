import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';

export class CreateJobPositionDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'El color no puede estar vacío.' })
  @MaxLength(50)
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'El color debe ser un código hexadecimal válido (ej: #FF5733).',
  })
  color: string;
}
