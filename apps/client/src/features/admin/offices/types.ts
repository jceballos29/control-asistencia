import { TimeSlot } from "../time-slots/types";

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

export interface Office {
  id: string;
  name: string;
  workStartTime: string | null;
  workEndTime: string | null;
  workingDays: DayOfWeek[] | null;
  timeSlots: TimeSlot[];
  timeSlotsCount: number;
  createdAt: Date;
  updatedAt: Date | null;
}

export const daysOfWeekOptions = [
  {
    abbr: "Dom",
    text: "Domingo",
    value: DayOfWeek.SUNDAY,
  },
  {
    abbr: "Lun",
    text: "Lunes",
    value: DayOfWeek.MONDAY,
  },
  {
    abbr: "Mar",
    text: "Martes",
    value: DayOfWeek.TUESDAY,
  },
  {
    abbr: "Mie",
    text: "Miércoles",
    value: DayOfWeek.WEDNESDAY,
  },
  {
    abbr: "Jue",
    text: "Jueves",
    value: DayOfWeek.THURSDAY,
  },
  {
    abbr: "Vie",
    text: "Viernes",
    value: DayOfWeek.FRIDAY,
  },
  {
    abbr: "Sab",
    text: "Sábado",
    value: DayOfWeek.SATURDAY, 
  }
];
