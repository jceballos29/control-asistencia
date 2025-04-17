import { PartialType } from "@nestjs/mapped-types";
import { CreateOfficeDto } from "./create-office.dto";
import { IsOptional, IsString, Matches } from "class-validator";
import { IsEndTimeAfterStartTime } from "../../common/validators/is-end-time-after-start-time.validator";

export class UpdateOfficeDto extends PartialType(CreateOfficeDto) {
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/, {
      message: 'La hora de fin laboral debe tener el formato HH:MM o HH:MM:SS.',
  })
  @IsEndTimeAfterStartTime('workStartTime', {
      message: 'Si se proporcionan ambas horas, la hora de fin debe ser posterior a la hora de inicio.'
  })
  workEndTime?: string;
}