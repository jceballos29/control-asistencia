import { apiClient } from "@/lib/axios";
import type { JobPosition } from "./types";
import type { CreateJobPositionInput, UpdateJobPositionInput } from "./schema";

export const getJobPositionsForOffice = async (
  officeId: string
): Promise<JobPosition[]> => {
  const response = await apiClient.get<JobPosition[]>(
    `/offices/${officeId}/job-positions`
  );
  return response.data;
};

export const createJobPosition = async (
  officeId: string,
  data: CreateJobPositionInput
): Promise<JobPosition> => {
  const response = await apiClient.post<JobPosition>(
    `/offices/${officeId}/job-positions`,
    data
  );
  return response.data;
};

export const updateJobPosition = async (
  officeId: string,
  jobPositionId: string,
  data: UpdateJobPositionInput
): Promise<JobPosition> => {
  const response = await apiClient.patch<JobPosition>(
    `/offices/${officeId}/job-positions/${jobPositionId}`,
    data
  );
  return response.data;
};

export const deleteJobPosition = async (
  officeId: string,
  jobPositionId: string
): Promise<void> => {
  await apiClient.delete(`/offices/${officeId}/job-positions/${jobPositionId}`);
};
