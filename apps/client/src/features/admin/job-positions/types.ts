export interface JobPosition {
  id: string;
  name: string;
  color: string; // ej: "#FF5733"
  officeId: string;
  createdAt: string; // O Date si se transforma
  updatedAt: string | null; // O Date | null
}