import { DayOfWeek } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

const validSortByFields = [
  'name',
  'workStartTime',
  'workEndTime',
  'createdAt',
  'updatedAt',
];
type SortByFields = (typeof validSortByFields)[number];

export class OfficeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @IsEnum(validSortByFields, {
    message: `sortBy debe ser uno de: ${validSortByFields.join(', ')}`,
  })
  sortBy?: SortByFields = 'name';

  @IsOptional()
  @IsEnum(SortOrder, {
    message: `sortOrder debe ser uno de: ${Object.values(SortOrder).join(', ')}`,
  })
  sortOrder?: SortOrder = SortOrder.ASC;

  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/, {
    message: 'workStartTimeFrom: Formato HH:MM o HH:MM:SS inválido',
  })
  workStartTimeFrom?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/, {
    message: 'workStartTimeTo: Formato HH:MM o HH:MM:SS inválido',
  })
  workStartTimeTo?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
        .split(',')
        .map((day) => day.trim())
        .filter((day) => day.length > 0);
    }
    return [];
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(DayOfWeek, {
    each: true,
    message:
      'filterWorkingDays: Cada día debe ser un valor válido de DayOfWeek.',
  })
  filterWorkingDays?: DayOfWeek[];
}
