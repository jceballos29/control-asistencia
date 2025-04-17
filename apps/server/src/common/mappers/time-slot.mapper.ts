import { TimeSlot } from "@prisma/client";
import { TimeSlotResponseDto } from "../../time-slots/dto/time-slot-response.dto";
import { formatDateToHHMMSS } from "../utils/format-date-to-hhmmss";

/**
   * Mapea un objeto TimeSlot de Prisma a TimeSlotResponseDto.
   * @param timeSlot El objeto TimeSlot de Prisma.
   * @returns Un objeto TimeSlotResponseDto.
   */
export function mapTimeSlotToResponseDto(timeSlot: TimeSlot): TimeSlotResponseDto {
  return {
    id: timeSlot.id,
    startTime: formatDateToHHMMSS(timeSlot.startTime),
    endTime: formatDateToHHMMSS(timeSlot.endTime),
    officeId: timeSlot.officeId,
    createdAt: timeSlot.createdAt,
    updatedAt: timeSlot.updatedAt,
  };
}