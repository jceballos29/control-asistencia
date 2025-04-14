import { apiClient } from "@/lib/axios";
import { PaginatedResponse } from "@/types/pagination";
import type { CreateOfficeInput, UpdateOfficeInput } from "./schema";
import type { Office } from "./types";

export class PostNotFoundError extends Error {}

export interface GetOfficesParams {
  page?: number;
  limit?: number;
  sortBy?: string; // Podría ser un tipo más estricto
  sortOrder?: "ASC" | "DESC";
  search?: string;
  workStartTimeFrom?: string;
  workStartTimeTo?: string;
  filterWorkingDays?: string;
}

export const getOffices = async (
  params?: GetOfficesParams
): Promise<PaginatedResponse<Office>> => {
  const response = await apiClient.get<PaginatedResponse<Office>>("/offices", {
    params: params || {}, // Pasa los parámetros como query params
  });
  return response.data;
};

export const createOffice = async (
  office: CreateOfficeInput
): Promise<Office> => {
  console.log(office);
  const response = await apiClient.post<Office>("/offices", office);
  return response.data;
};

export const deleteOffice = async (id: string): Promise<void> => {
  await apiClient.delete(`/offices/${id}`);
};

export const updateOffice = async (
  id: string,
  office: UpdateOfficeInput
): Promise<Office> => {
  const response = await apiClient.patch<Office>(`/offices/${id}`, office);
  return response.data;
};

export const getOfficeById = async (id: string): Promise<Office> => {
  const response = await apiClient.get<Office>(`/offices/${id}`);
  return response.data;
};
