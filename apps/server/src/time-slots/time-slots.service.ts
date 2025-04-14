import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Office } from 'src/offices/entities/office.entity';
import { Repository } from 'typeorm';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { TimeSlot } from './entities/time-slot.entity';

@Injectable()
export class TimeSlotsService {
  private readonly logger = new Logger(TimeSlotsService.name);

  constructor(
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepository: Repository<TimeSlot>,
    @InjectRepository(Office)
    private readonly officeRepository: Repository<Office>,
  ) {}

  /**
   * Obtiene y valida la existencia de un Office por su ID.
   * @throws {NotFoundException} Si el Office no existe.
   */
  private async getAndValidateOffice(officeId: string): Promise<Office> {
    const office = await this.officeRepository.findOneBy({ id: officeId });
    if (!office) {
      throw new NotFoundException(
        `Consultorio con ID "${officeId}" no encontrado.`,
      );
    }
    return office;
  }

  /**
   * Valida que una nueva franja horaria no se superponga con existentes para la misma oficina.
   * @param excludeSlotId - ID del slot a excluir de la comparación (para actualizaciones).
   * @throws {ConflictException} Si se detecta superposición.
   */
  private async validateNoOverlap(
    officeId: string,
    startTime: string,
    endTime: string,
    excludeSlotId?: string,
  ): Promise<void> {
    this.logger.debug(
      `Validando superposición para Office ${officeId}, Slot ${startTime}-${endTime}, Excluyendo ${excludeSlotId || 'ninguno'}`,
    );

    const queryBuilder = this.timeSlotRepository
      .createQueryBuilder('slot')
      .where('slot.officeId = :officeId', { officeId })
      // Condición de superposición: (StartA < EndB) AND (EndA > StartB)
      .andWhere('slot.startTime < :endTime', { endTime })
      .andWhere('slot.endTime > :startTime', { startTime });

    if (excludeSlotId) {
      queryBuilder.andWhere('slot.id != :excludeSlotId', { excludeSlotId });
    }

    const overlapExists = await queryBuilder.getExists();

    if (overlapExists) {
      this.logger.warn(
        `Conflicto de superposición detectado para Office ${officeId}, Slot ${startTime}-${endTime}`,
      );
      throw new ConflictException(
        `La franja horaria ${startTime} - ${endTime} se superpone con una existente para este consultorio.`,
      );
    }
    this.logger.debug(
      `No se encontró superposición para ${startTime}-${endTime}`,
    );
  }

  /**
   * Valida que una franja horaria esté dentro del horario laboral definido para el Office.
   * Asume que los parámetros de Office son Date | null y los de Slot son string 'HH:MM:SS'.
   * @throws {ConflictException} Si el slot está fuera del horario laboral.
   */
  private validateSlotWithinOfficeHours(
    officeWorkStartTime: string | null,
    officeWorkEndTime: string | null,
    slotStartTime: string,
    slotEndTime: string,
  ): void {
    if (!officeWorkStartTime || !officeWorkEndTime) {
      this.logger.debug(
        `Omitiendo validación de horas de oficina para slot ${slotStartTime}-${slotEndTime} (horario oficina no definido)`,
      );
      return;
    }

    const isStartValid = slotStartTime >= officeWorkStartTime;
    const isEndValid = slotEndTime <= officeWorkEndTime;

    if (!isStartValid) {
      this.logger.warn(
        `Conflicto Horario: Inicio slot (${slotStartTime}) < Inicio oficina (${officeWorkStartTime})`,
      );
      throw new ConflictException(
        `La hora de inicio (${slotStartTime}) no puede ser anterior al inicio laboral (${officeWorkStartTime}).`,
      );
    }

    if (!isEndValid) {
      this.logger.warn(
        `Conflicto Horario: Fin slot (${slotEndTime}) > Fin oficina (${officeWorkEndTime})`,
      );
      throw new ConflictException(
        `La hora de fin (${slotEndTime}) no puede ser posterior al fin laboral (${officeWorkEndTime}).`,
      );
    }

    this.logger.debug(
      `Slot ${slotStartTime}-${slotEndTime} validado dentro de ${officeWorkStartTime}-${officeWorkEndTime}.`,
    );
  }

  async create(
    officeId: string,
    createTimeSlotDto: CreateTimeSlotDto,
  ): Promise<TimeSlot> {
    const office = await this.getAndValidateOffice(officeId);

    this.validateSlotWithinOfficeHours(
      office.workStartTime,
      office.workEndTime,
      createTimeSlotDto.startTime,
      createTimeSlotDto.endTime,
    );

    await this.validateNoOverlap(
      officeId,
      createTimeSlotDto.startTime,
      createTimeSlotDto.endTime,
    );

    const newTimeSlot = this.timeSlotRepository.create({
      ...createTimeSlotDto,
      officeId: officeId,
    });

    this.logger.log(
      `Creando TimeSlot para Office ${officeId}: ${newTimeSlot.startTime}-${newTimeSlot.endTime}`,
    );
    return this.timeSlotRepository.save(newTimeSlot);
  }

  async findAllForOffice(officeId: string): Promise<TimeSlot[]> {
    await this.getAndValidateOffice(officeId);
    this.logger.debug(`Buscando TimeSlots para Office ${officeId}`);
    return this.timeSlotRepository.find({
      where: { officeId },
      order: { startTime: 'ASC' },
    });
  }

  async findOne(id: string): Promise<TimeSlot> {
    const timeSlot = await this.timeSlotRepository.findOneBy({ id });
    if (!timeSlot) {
      throw new NotFoundException(`TimeSlot con ID "${id}" no encontrado.`);
    }
    return timeSlot;
  }

  async update(
    id: string,
    updateTimeSlotDto: UpdateTimeSlotDto,
  ): Promise<TimeSlot> {
    const timeSlot = await this.timeSlotRepository.preload({
      id: id,
      ...updateTimeSlotDto,
    });
    if (!timeSlot) {
      throw new NotFoundException(
        `TimeSlot con ID "${id}" no encontrado para actualizar.`,
      );
    }

    const office = await this.getAndValidateOffice(timeSlot.officeId);

    this.validateSlotWithinOfficeHours(
      office.workStartTime,
      office.workEndTime,
      timeSlot.startTime,
      timeSlot.endTime,
    );

    await this.validateNoOverlap(
      timeSlot.officeId,
      timeSlot.startTime,
      timeSlot.endTime,
      id,
    );

    this.logger.log(
      `Actualizando TimeSlot ${id} a ${timeSlot.startTime.toString()}-${timeSlot.endTime.toString()}`,
    );
    return this.timeSlotRepository.save(timeSlot);
  }

  async remove(id: string): Promise<void> {
    const timeSlot = await this.findOne(id);
    const result = await this.timeSlotRepository.delete(timeSlot.id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `No se pudo eliminar TimeSlot con ID "${id}" (affected 0).`,
      );
    }
    this.logger.log(`TimeSlot con ID "${id}" eliminado.`);
  }

  async removeAllForOffice(
    officeId: string,
  ): Promise<{ deletedCount: number }> {
    await this.getAndValidateOffice(officeId);
    const result = await this.timeSlotRepository.delete({ officeId: officeId });
    const deletedCount = result.affected ?? 0;
    this.logger.log(
      `Eliminados ${deletedCount} TimeSlots para Office ${officeId}`,
    );
    return { deletedCount };
  }
}
