import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JobPosition, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobPositionDto } from './dto/create-job-position.dto';
import { JobPositionResponseDto } from './dto/job-position-response.dto';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { mapJobPositionToResponseDto } from 'src/common/mappers/job-postion.mapper';

@Injectable()
export class JobPositionsService {
  private readonly logger = new Logger(JobPositionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida que un Consultorio exista usando Prisma.
   * @param officeId UUID del consultorio.
   * @throws {NotFoundException} Si el consultorio no existe.
   */
  private async validateOfficeExists(officeId: string): Promise<void> {
    try {
      await this.prisma.office.findUniqueOrThrow({
        where: { id: officeId },
        select: { id: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(
          `Consultorio con ID "${officeId}" no encontrado (validateOfficeExists).`,
        );
        throw new NotFoundException(
          `Consultorio con ID "${officeId}" no encontrado.`,
        );
      }
      this.logger.error(
        `Error validando existencia de consultorio ${officeId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Valida que el nombre de un puesto sea único dentro de un consultorio específico,
   * opcionalmente excluyendo un ID de puesto existente (para actualizaciones).
   * @param name Nombre del puesto a validar.
   * @param officeId UUID del consultorio.
   * @param excludeJobPositionId UUID opcional del puesto a excluir de la validación.
   * @throws {ConflictException} Si el nombre ya está en uso en esa oficina.
   */
  private async validateNameUniqueForOffice(
    name: string,
    officeId: string,
    excludeJobPositionId?: string,
  ): Promise<void> {
    const whereCondition: Prisma.JobPositionWhereInput = {
      officeId: officeId,
      name: name,
    };

    if (excludeJobPositionId) {
      whereCondition.id = { not: excludeJobPositionId };
    }

    const count = await this.prisma.jobPosition.count({
      where: whereCondition,
    });

    if (count > 0) {
      this.logger.warn(
        `Conflicto: Nombre de puesto "${name}" ya existe en oficina ${officeId}.`,
      );
      throw new ConflictException(
        `Ya existe un puesto llamado "${name}" en este consultorio.`,
      );
    }
  }

  /**
   * Crea un nuevo puesto de trabajo para un consultorio.
   * @param officeId UUID del consultorio.
   * @param createDto Datos del puesto a crear.
   * @returns El puesto creado mapeado a JobPositionResponseDto.
   */
  async create(
    officeId: string,
    createDto: CreateJobPositionDto,
  ): Promise<JobPositionResponseDto> {
    await this.validateOfficeExists(officeId);
    await this.validateNameUniqueForOffice(createDto.name, officeId);

    try {
      const newJobPosition = await this.prisma.jobPosition.create({
        data: {
          ...createDto,
          officeId: officeId,
        },
      });
      this.logger.log(
        `Creado puesto "${newJobPosition.name}" (ID: ${newJobPosition.id}) para oficina ${officeId}`,
      );
      return mapJobPositionToResponseDto(newJobPosition);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta?.target as string[])?.join(', ');
        this.logger.warn(
          `Conflicto P2002 al crear puesto "${createDto.name}" en oficina ${officeId}. Target: ${target}`,
        );
        throw new ConflictException(
          `Ya existe un puesto llamado "${createDto.name}" en este consultorio.`,
        );
      }
      this.logger.error(
        `Error creando puesto "${createDto.name}" en oficina ${officeId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Obtiene todos los puestos de trabajo de un consultorio específico.
   * @param officeId UUID del consultorio.
   * @returns Array de JobPositionResponseDto ordenados por nombre.
   */
  async findAllForOffice(officeId: string): Promise<JobPositionResponseDto[]> {
    await this.validateOfficeExists(officeId);
    this.logger.debug(`Buscando puestos para oficina ${officeId}`);

    const jobPositions = await this.prisma.jobPosition.findMany({
      where: { officeId: officeId },
      orderBy: { name: 'asc' },
    });

    return jobPositions.map((jp) => mapJobPositionToResponseDto(jp));
  }

  /**
   * Busca un puesto de trabajo específico por su ID.
   * @param id UUID del puesto de trabajo.
   * @returns El puesto encontrado mapeado a JobPositionResponseDto.
   * @throws {NotFoundException} Si no se encuentra el puesto.
   */
  async findOne(id: string): Promise<JobPositionResponseDto> {
    this.logger.debug(`Buscando puesto de trabajo con ID: ${id}`);
    try {
      const jobPosition = await this.prisma.jobPosition.findUniqueOrThrow({
        where: { id: id },
      });
      return mapJobPositionToResponseDto(jobPosition);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(
          `Puesto de trabajo con ID "${id}" no encontrado (findOne).`,
        );
        throw new NotFoundException(
          `Puesto de trabajo con ID "${id}" no encontrado.`,
        );
      }
      this.logger.error(`Error buscando puesto de trabajo ${id}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza un puesto de trabajo existente.
   * @param id UUID del puesto a actualizar.
   * @param updateDto Datos a modificar.
   * @returns El puesto actualizado mapeado a JobPositionResponseDto.
   */
  async update(
    id: string,
    updateDto: UpdateJobPositionDto,
  ): Promise<JobPositionResponseDto> {
    this.logger.log(`Intentando actualizar puesto con ID: ${id}`);

    let existingJobPosition: JobPosition;
    try {
      existingJobPosition = await this.prisma.jobPosition.findUniqueOrThrow({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(
          `Puesto de trabajo con ID "${id}" no encontrado para actualizar.`,
        );
        throw new NotFoundException(
          `Puesto de trabajo con ID "${id}" no encontrado para actualizar.`,
        );
      }
      this.logger.error(
        `Error buscando puesto ${id} antes de actualizar:`,
        error,
      );
      throw error;
    }

    if (updateDto.name && updateDto.name !== existingJobPosition.name) {
      await this.validateNameUniqueForOffice(
        updateDto.name,
        existingJobPosition.officeId,
        id,
      );
    }

    try {
      const updatedJobPosition = await this.prisma.jobPosition.update({
        where: { id: id },
        data: updateDto,
      });
      this.logger.log(`Puesto de trabajo ${id} actualizado.`);
      return mapJobPositionToResponseDto(updatedJobPosition);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta?.target as string[])?.join(', ');
        this.logger.warn(
          `Conflicto P2002 al actualizar puesto ${id}. Target: ${target}`,
        );
        throw new ConflictException(
          `Conflicto al actualizar: Ya existe un puesto con el mismo nombre en esta oficina.`,
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Error P2025 inesperado al actualizar puesto ${id}.`);
        throw new NotFoundException(
          `Puesto de trabajo con ID "${id}" no encontrado durante la actualización.`,
        );
      }
      this.logger.error(`Error actualizando puesto ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un puesto de trabajo por su ID.
   * @param id UUID del puesto a eliminar.
   * @returns Promise<void>
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Intentando eliminar puesto de trabajo con ID: ${id}`);
    try {
      await this.prisma.jobPosition.findUniqueOrThrow({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(
          `Puesto de trabajo con ID "${id}" no encontrado para eliminar.`,
        );
        throw new NotFoundException(
          `Puesto de trabajo con ID "${id}" no encontrado para eliminar.`,
        );
      }
      this.logger.error(
        `Error buscando puesto ${id} antes de eliminar:`,
        error,
      );
      throw error;
    }

    try {
      await this.prisma.jobPosition.delete({ where: { id } });
      this.logger.log(`Puesto de trabajo con ID "${id}" eliminado.`);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this.logger.warn(`Error P2025 inesperado al eliminar puesto ${id}.`);
          throw new NotFoundException(
            `Puesto de trabajo con ID "${id}" no encontrado para eliminar.`,
          );
        }
        if (error.code === 'P2003') {
          this.logger.warn(
            `Error P2003: No se puede eliminar el puesto ${id} debido a restricciones FK.`,
          );
          throw new ConflictException(
            `No se puede eliminar el puesto porque tiene registros relacionados (ej: empleados asignados).`,
          );
        }
      }
      this.logger.error(`Error eliminando puesto ${id}:`, error);
      throw error;
    }
  }
}
