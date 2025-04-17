import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Office, Prisma, TimeSlot } from '@prisma/client';
import { formatDateToHHMMSS } from '../common/utils/format-date-to-hhmmss';
import { parseTimeStringToDate } from '../common/utils/parse-time-string-to-date';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { TimeSlotResponseDto } from './dto/time-slot-response.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { mapTimeSlotToResponseDto } from '../common/mappers/time-slot.mapper'

@Injectable()
export class TimeSlotsService {
  private readonly logger = new Logger(TimeSlotsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene y valida la existencia de un Office por su ID usando Prisma.
   * @param officeId El UUID del consultorio.
   * @returns El objeto Office encontrado.
   * @throws {NotFoundException} Si el Office no existe.
   */
  private async getAndValidateOffice(officeId: string): Promise<Office> {
    try {
      const office = await this.prisma.office.findUniqueOrThrow({
        where: { id: officeId },
      });
      return office;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(
          `Consultorio con ID "${officeId}" no encontrado (getAndValidateOffice).`,
        );
        throw new NotFoundException(
          `Consultorio con ID "${officeId}" no encontrado.`,
        );
      }
      this.logger.error(
        `Error buscando consultorio ${officeId} para validación:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Valida (usando Prisma) que una nueva/actualizada franja horaria no se superponga
   * con existentes para la misma oficina.
   * @param officeId ID del consultorio.
   * @param startTime Hora de inicio (objeto Date).
   * @param endTime Hora de fin (objeto Date).
   * @param excludeSlotId ID opcional del slot a excluir (para actualizaciones).
   * @throws {ConflictException} Si se detecta superposición.
   */
  private async validateNoOverlap(
    officeId: string,
    startTime: Date,
    endTime: Date,
    excludeSlotId?: string,
  ): Promise<void> {
    this.logger.debug(
      `Validando superposición Prisma para Office ${officeId}, Slot ${formatDateToHHMMSS(startTime)}-${formatDateToHHMMSS(endTime)}, Excluyendo ${excludeSlotId || 'ninguno'}`,
    );

    const whereCondition: Prisma.TimeSlotWhereInput = {
      officeId: officeId,
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    };

    if (excludeSlotId) {
      whereCondition.id = { not: excludeSlotId };
    }

    const overlappingCount = await this.prisma.timeSlot.count({
      where: whereCondition,
    });

    if (overlappingCount > 0) {
      this.logger.warn(
        `Conflicto de superposición Prisma detectado para Office ${officeId}, Slot ${formatDateToHHMMSS(startTime)}-${formatDateToHHMMSS(endTime)}`,
      );
      throw new ConflictException(
        `La franja horaria ${formatDateToHHMMSS(startTime)} - ${formatDateToHHMMSS(endTime)} se superpone con una existente.`,
      );
    }
    this.logger.debug(
      `No se encontró superposición Prisma para ${formatDateToHHMMSS(startTime)}-${formatDateToHHMMSS(endTime)}`,
    );
  }

  /**
   * Valida que una franja horaria (como objetos Date) esté dentro del
   * horario laboral (como objetos Date) definido para el Office.
   * @throws {ConflictException} Si el slot está fuera del horario laboral.
   */
  private validateSlotWithinOfficeHours(
    officeWorkStartTime: Date | null,
    officeWorkEndTime: Date | null,
    slotStartTime: Date,
    slotEndTime: Date,
  ): void {
    if (!officeWorkStartTime || !officeWorkEndTime) {
      this.logger.debug(
        `Omitiendo validación de horas de oficina para slot ${formatDateToHHMMSS(slotStartTime)}-${formatDateToHHMMSS(slotEndTime)} (horario oficina no definido)`,
      );
      return;
    }

    const isStartValid = slotStartTime >= officeWorkStartTime;
    const isEndValid = slotEndTime <= officeWorkEndTime;

    if (!isStartValid) {
      this.logger.warn(
        `Conflicto Horario: Inicio slot (${formatDateToHHMMSS(slotStartTime)}) < Inicio oficina (${formatDateToHHMMSS(officeWorkStartTime)})`,
      );
      throw new ConflictException(
        `La hora de inicio (${formatDateToHHMMSS(slotStartTime)}) no puede ser anterior al inicio laboral (${formatDateToHHMMSS(officeWorkStartTime)}).`,
      );
    }

    if (!isEndValid) {
      this.logger.warn(
        `Conflicto Horario: Fin slot (${formatDateToHHMMSS(slotEndTime)}) > Fin oficina (${formatDateToHHMMSS(officeWorkEndTime)})`,
      );
      throw new ConflictException(
        `La hora de fin (${formatDateToHHMMSS(slotEndTime)}) no puede ser posterior al fin laboral (${formatDateToHHMMSS(officeWorkEndTime)}).`,
      );
    }

    this.logger.debug(
      `Slot ${formatDateToHHMMSS(slotStartTime)}-${formatDateToHHMMSS(slotEndTime)} validado dentro de ${formatDateToHHMMSS(officeWorkStartTime)}-${formatDateToHHMMSS(officeWorkEndTime)}.`,
    );
  }

  /**
   * Crea una nueva franja horaria para un consultorio específico.
   * @param officeId UUID del consultorio.
   * @param createTimeSlotDto Datos de la franja a crear.
   * @returns La franja horaria creada, mapeada a TimeSlotResponseDto.
   */
  async create(
    officeId: string,
    createTimeSlotDto: CreateTimeSlotDto,
  ): Promise<TimeSlotResponseDto> {
    const office = await this.getAndValidateOffice(officeId);

    const startTimeDate = parseTimeStringToDate(createTimeSlotDto.startTime);
    const endTimeDate = parseTimeStringToDate(createTimeSlotDto.endTime);

    this.validateSlotWithinOfficeHours(
      office.workStartTime,
      office.workEndTime,
      startTimeDate,
      endTimeDate,
    );
    await this.validateNoOverlap(officeId, startTimeDate, endTimeDate);

    try {
      const newTimeSlot = await this.prisma.timeSlot.create({
        data: {
          startTime: startTimeDate,
          endTime: endTimeDate,
          officeId: officeId,
        },
      });
      this.logger.log(
        `Creado TimeSlot ${newTimeSlot.id} para Office ${officeId}`,
      );
      return mapTimeSlotToResponseDto(newTimeSlot);
    } catch (error) {
      this.logger.error(
        `Error creando TimeSlot para Office ${officeId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Obtiene todas las franjas horarias de un consultorio específico.
   * @param officeId UUID del consultorio.
   * @returns Un array de TimeSlotResponseDto ordenado por hora de inicio.
   */
  async findAllForOffice(officeId: string): Promise<TimeSlotResponseDto[]> {
    await this.getAndValidateOffice(officeId);
    this.logger.debug(`Buscando TimeSlots para Office ${officeId}`);

    const timeSlots = await this.prisma.timeSlot.findMany({
      where: { officeId: officeId },
      orderBy: { startTime: 'asc' },
    });

    return timeSlots.map((slot) => mapTimeSlotToResponseDto(slot));
  }

  /**
   * Busca una franja horaria específica por su ID.
   * @param id UUID de la franja horaria.
   * @returns La franja horaria encontrada, mapeada a TimeSlotResponseDto.
   * @throws {NotFoundException} Si no se encuentra la franja horaria.
   */
  async findOne(id: string): Promise<TimeSlotResponseDto> {
    this.logger.debug(`Buscando TimeSlot con ID: ${id}`);
    try {
      const timeSlot = await this.prisma.timeSlot.findUniqueOrThrow({
        where: { id: id },
      });
      return mapTimeSlotToResponseDto(timeSlot);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`TimeSlot con ID "${id}" no encontrado (findOne).`);
        throw new NotFoundException(`TimeSlot con ID "${id}" no encontrado.`);
      }
      this.logger.error(`Error buscando TimeSlot ${id}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza una franja horaria existente.
   * @param id UUID de la franja a actualizar.
   * @param updateTimeSlotDto Datos a actualizar.
   * @returns La franja horaria actualizada, mapeada a TimeSlotResponseDto.
   */
  async update(
    id: string,
    updateTimeSlotDto: UpdateTimeSlotDto,
  ): Promise<TimeSlotResponseDto> {
    this.logger.log(`Intentando actualizar TimeSlot con ID: ${id}`);

    let existingSlot: TimeSlot & { office: Office };
    try {
      existingSlot = await this.prisma.timeSlot.findUniqueOrThrow({
        where: { id },
        include: { office: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(
          `TimeSlot con ID "${id}" no encontrado para actualizar.`,
        );
        throw new NotFoundException(
          `TimeSlot con ID "${id}" no encontrado para actualizar.`,
        );
      }
      this.logger.error(
        `Error buscando TimeSlot ${id} para actualizar:`,
        error,
      );
      throw error;
    }

    const dataToUpdate: Prisma.TimeSlotUpdateInput = {};
    let newStartTime = existingSlot.startTime;
    let newEndTime = existingSlot.endTime;

    if (updateTimeSlotDto.startTime) {
      newStartTime = parseTimeStringToDate(updateTimeSlotDto.startTime);
      dataToUpdate.startTime = newStartTime;
    }
    if (updateTimeSlotDto.endTime) {
      newEndTime = parseTimeStringToDate(updateTimeSlotDto.endTime);
      dataToUpdate.endTime = newEndTime;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      this.logger.debug(`No hay datos para actualizar en TimeSlot ${id}`);
      return mapTimeSlotToResponseDto(existingSlot);
    }

    this.validateSlotWithinOfficeHours(
      existingSlot.office.workStartTime,
      existingSlot.office.workEndTime,
      newStartTime,
      newEndTime,
    );
    await this.validateNoOverlap(
      existingSlot.officeId,
      newStartTime,
      newEndTime,
      id,
    );

    try {
      const updatedTimeSlot = await this.prisma.timeSlot.update({
        where: { id: id },
        data: dataToUpdate,
      });
      this.logger.log(`TimeSlot ${id} actualizado.`);
      return mapTimeSlotToResponseDto(updatedTimeSlot);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(
          `Error P2025 inesperado al actualizar TimeSlot ${id}.`,
        );
        throw new NotFoundException(
          `TimeSlot con ID "${id}" no encontrado durante la actualización.`,
        );
      }
      this.logger.error(`Error actualizando TimeSlot ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina una franja horaria por su ID.
   * @param id UUID de la franja a eliminar.
   * @returns Promise<void>
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Intentando eliminar TimeSlot con ID: ${id}`);
    try {
      await this.prisma.timeSlot.findUniqueOrThrow({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(
          `TimeSlot con ID "${id}" no encontrado para eliminar.`,
        );
        throw new NotFoundException(
          `TimeSlot con ID "${id}" no encontrado para eliminar.`,
        );
      }
      this.logger.error(
        `Error buscando TimeSlot ${id} antes de eliminar:`,
        error,
      );
      throw error;
    }

    try {
      await this.prisma.timeSlot.delete({ where: { id } });
      this.logger.log(`TimeSlot con ID "${id}" eliminado.`);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Error P2025 inesperado al eliminar TimeSlot ${id}.`);
        throw new NotFoundException(
          `TimeSlot con ID "${id}" no encontrado para eliminar.`,
        );
      }
      this.logger.error(`Error eliminando TimeSlot ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina TODAS las franjas horarias de un consultorio específico.
   * @param officeId UUID del consultorio.
   * @returns Objeto con el número de franjas eliminadas.
   */
  async removeAllForOffice(
    officeId: string,
  ): Promise<{ deletedCount: number }> {
    await this.getAndValidateOffice(officeId);
    this.logger.log(
      `Intentando eliminar todos los TimeSlots para Office ${officeId}`,
    );

    const result = await this.prisma.timeSlot.deleteMany({
      where: { officeId: officeId },
    });

    this.logger.log(
      `Eliminados ${result.count} TimeSlots para Office ${officeId}`,
    );
    return { deletedCount: result.count };
  }
}
