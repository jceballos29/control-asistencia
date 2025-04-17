import { JobPosition } from "@prisma/client";
import { JobPositionResponseDto } from "../../job-positions/dto/job-position-response.dto";

  /**
   * Mapea un objeto JobPosition de Prisma a JobPositionResponseDto.
   * @param jobPosition El objeto JobPosition de Prisma.
   * @returns Un objeto JobPositionResponseDto.
   */
  export function mapJobPositionToResponseDto(jobPosition: JobPosition): JobPositionResponseDto {
    if (
      !jobPosition ||
      !jobPosition.id ||
      !jobPosition.name ||
      !jobPosition.color ||
      !jobPosition.officeId ||
      !jobPosition.createdAt
    ) {
      this.logger.error(
        'Datos incompletos al mapear JobPosition a DTO',
        jobPosition,
      );
      throw new Error('Error interno al mapear datos del puesto de trabajo.');
    }
    return {
      id: jobPosition.id,
      name: jobPosition.name,
      color: jobPosition.color,
      officeId: jobPosition.officeId,
      createdAt: jobPosition.createdAt,
      updatedAt: jobPosition.updatedAt,
    };
  }
