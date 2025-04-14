import { apiClient } from "@/lib/axios";
import type { CreateTimeSlotInput, UpdateTimeSlotInput } from "./schema";
import { TimeSlot } from "./types";

export const createTimeSlot = async (
  officeId: string,
  timeSlotData: CreateTimeSlotInput
): Promise<TimeSlot> => {
  const response = await apiClient.post<TimeSlot>(
    `/offices/${officeId}/time-slots`,
    timeSlotData
  );
  return response.data;
};

export const deleteTimeSlot = async (officeId: string, timeSlotId: string) => {
  const response = await apiClient.delete(
    `/offices/${officeId}/time-slots/${timeSlotId}`
  );
  return response.data;
};

export const updateTimeSlot = async (
  officeId: string,
  timeSlotId: string,
  timeSlotData: UpdateTimeSlotInput
) => {
  const response = await apiClient.put(
    `/offices/${officeId}/time-slots/${timeSlotId}`,
    timeSlotData
  );
  return response.data;
};
