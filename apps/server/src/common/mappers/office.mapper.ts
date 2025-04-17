import { JobPosition, Office, TimeSlot } from '@prisma/client';
import { OfficeResponseDto } from '../../offices/dto/office-response.dto';
import { formatDateToHHMMSS } from '../utils/format-date-to-hhmmss';
import { mapTimeSlotToResponseDto } from './time-slot.mapper';
import { mapJobPositionToResponseDto } from './job-postion.mapper';

/**
 * Mapea un objeto Office de Prisma (con posible _count) a OfficeResponseDto.
 * @param office El objeto Office de Prisma, puede incluir _count.
 * @returns Un objeto OfficeResponseDto.
 */
export function mapOfficeToResponseDto(
  office: Office & {
    timeSlots?: TimeSlot[];
    jobPositions?: JobPosition[];
    _count?: {
      timeSlots?: number;
      jobPositions?: number;
      employees?: number;
    };
  },
): OfficeResponseDto {
  return {
    id: office.id,
    name: office.name,
    // Formatea las fechas de tiempo a string HH:MM:SS
    workStartTime: formatDateToHHMMSS(office.workStartTime),
    workEndTime: formatDateToHHMMSS(office.workEndTime),
    workingDays: office.workingDays, // Prisma ya devuelve el array de enums
    createdAt: office.createdAt, // Se mantienen como Date, NestJS los serializa a ISO string
    updatedAt: office.updatedAt,
    // Extrae los conteos, con valor por defecto 0 si no existen
    timeSlotsCount: office._count?.timeSlots ?? 0,
    jobPositionsCount: office._count?.jobPositions ?? 0,
    // employeesCount: office._count?.employees ?? 0, // Cuando exista
    timeSlots: office.timeSlots
      ? office.timeSlots.map(mapTimeSlotToResponseDto)
      : null,
    jobPositions: office.jobPositions
      ? office.jobPositions.map(mapJobPositionToResponseDto)
      : null,
  };
}
