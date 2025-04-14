import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JobPosition } from './entities/job-position.entity';
import { Repository } from 'typeorm';
import { Office } from 'src/offices/entities/office.entity';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { CreateJobPositionDto } from './dto/create-job-position.dto';

@Injectable()
export class JobPositionsService {
  private readonly logger = new Logger(JobPositionsService.name);

  constructor(
    @InjectRepository(JobPosition)
    private readonly jobPositionRepository: Repository<JobPosition>,
    @InjectRepository(Office)
    private readonly officeRepository: Repository<Office>,
  ) {}

  private async validateOfficeExists(officeId: string): Promise<void> {
    const officeExists = await this.officeRepository.existsBy({ id: officeId });
    if (!officeExists) {
      throw new NotFoundException(
        `Consultorio con ID "${officeId}" no encontrado.`,
      );
    }
  }

  private async validateNameUniqueForOffice(
    name: string,
    officeId: string,
    excludeJobPositionId?: string,
  ): Promise<void> {
    const queryBuilder = this.jobPositionRepository
      .createQueryBuilder('jp')
      .where('jp.officeId = :officeId', { officeId })
      .andWhere('jp.name = :name', { name });

    if (excludeJobPositionId) {
      queryBuilder.andWhere('jp.id != :excludeJobPositionId', {
        excludeJobPositionId,
      });
    }

    const exists = await queryBuilder.getExists();
    if (exists) {
      throw new ConflictException(
        `Ya existe un puesto llamado "${name}" en este consultorio.`,
      );
    }
  }

  async create(
    officeId: string,
    createDto: CreateJobPositionDto,
  ): Promise<JobPosition> {
    await this.validateOfficeExists(officeId);
    await this.validateNameUniqueForOffice(createDto.name, officeId);

    const newJobPosition = this.jobPositionRepository.create({
      ...createDto,
      officeId: officeId,
    });
    this.logger.log(
      `Creando puesto "${newJobPosition.name}" para oficina ${officeId}`,
    );
    return this.jobPositionRepository.save(newJobPosition);
  }

  async findAllForOffice(officeId: string): Promise<JobPosition[]> {
    await this.validateOfficeExists(officeId);
    this.logger.debug(`Buscando puestos para oficina ${officeId}`);
    return this.jobPositionRepository.find({
      where: { officeId: officeId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, officeId?: string): Promise<JobPosition> {
    if (officeId) {
      await this.validateOfficeExists(officeId);
    }
    const jobPosition = await this.jobPositionRepository.findOneBy({ id });
    if (!jobPosition) {
      throw new NotFoundException(
        `Puesto de trabajo con ID "${id}" no encontrado.`,
      );
    }
    if (officeId && jobPosition.officeId !== officeId) {
      throw new NotFoundException(
        `Puesto de trabajo con ID "<span class="math-inline">\{id\}" no encontrado en la oficina "</span>{officeId}".`,
      );
    }
    return jobPosition;
  }

  async update(
    id: string,
    updateDto: UpdateJobPositionDto,
  ): Promise<JobPosition> {
    const jobPosition = await this.jobPositionRepository.preload({
      id: id,
      ...updateDto,
    });

    if (!jobPosition) {
      throw new NotFoundException(
        `Puesto de trabajo con ID "${id}" no encontrado para actualizar.`,
      );
    }

    if (updateDto.name && updateDto.name !== jobPosition.name) {
      await this.validateNameUniqueForOffice(
        updateDto.name,
        jobPosition.officeId,
        id,
      );
    }

    this.logger.log(`Actualizando puesto ${id}`);
    return this.jobPositionRepository.save(jobPosition);
  }

  async remove(id: string): Promise<void> {
    const jobPosition = await this.findOne(id);
    if (!jobPosition) {
      throw new NotFoundException(
        `Puesto de trabajo con ID "${id}" no encontrado para eliminar.`,
      );
    }
    const result = await this.jobPositionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `No se pudo eliminar el puesto con ID "${id}" (affected 0).`,
      );
    }
    this.logger.log(`Puesto con ID "${id}" eliminado.`);
  }
}
