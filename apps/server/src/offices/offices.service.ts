import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOfficeDto } from 'src/offices/dto/create-office.dto';
import { UpdateOfficeDto } from 'src/offices/dto/update-office.dto';
import { Office } from 'src/offices/entities/office.entity';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { OfficeQueryDto, SortOrder } from './dto/office-query.dto';
import {
  PaginatedResultDto,
  PaginationMeta,
} from 'src/common/dto/pagination-result.dto';

@Injectable()
export class OfficesService {
  private readonly logger = new Logger(OfficesService.name);

  constructor(
    @InjectRepository(Office)
    private readonly officeRepository: Repository<Office>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createOfficeDto: CreateOfficeDto): Promise<Office> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const office = this.officeRepository.create(createOfficeDto);
      const savedOffice = await queryRunner.manager.save(office);

      await queryRunner.commitTransaction();
      const foundOffice = await this.officeRepository.findOneOrFail({
        where: { id: savedOffice.id },
        relations: ['timeSlots'],
      });

      return foundOffice;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(queryDto: OfficeQueryDto): Promise<PaginatedResultDto<Office>> {
    this.logger.log(
      `Consultando consultorios con filtros: ${JSON.stringify(queryDto)}`,
    );

    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = SortOrder.ASC,
      search,
      workStartTimeFrom,
      workStartTimeTo,
      filterWorkingDays,
    } = queryDto;

    const queryBuilder: SelectQueryBuilder<Office> =
      this.officeRepository.createQueryBuilder('office');

    // --- Búsqueda Global ---
    if (search) {
      queryBuilder.where(
        // Busca en nombre
        '(office.name ILIKE :search)',
        { search: `%${search}%` }, // ILIKE para case-insensitive, % para wildcard
      );
    }

    // --- Filtrado por Hora Inicio ---
    if (workStartTimeFrom) {
      // Asegúrate que workStartTime no sea null antes de comparar
      queryBuilder.andWhere(
        'office.workStartTime IS NOT NULL AND office.workStartTime >= :workStartTimeFrom',
        { workStartTimeFrom },
      );
    }
    if (workStartTimeTo) {
      queryBuilder.andWhere(
        'office.workStartTime IS NOT NULL AND office.workStartTime <= :workStartTimeTo',
        { workStartTimeTo },
      );
    }

    // --- Filtrado por Días Laborales ---
    if (filterWorkingDays && filterWorkingDays.length > 0) {
      queryBuilder.andWhere(
        'office.workingDays && ARRAY[:...days]::offices_workingdays_enum[]',
        { days: filterWorkingDays },
      );
    }

    queryBuilder.loadRelationCountAndMap(
      'office.timeSlotsCount',
      'office.timeSlots',
    );

    const validSortFields = [
      'name',
      'workStartTime',
      'workEndTime',
      'createdAt',
    ];
    if (validSortFields.includes(sortBy)) {
      // Necesitas prefijar con el alias de la tabla ('office.')
      queryBuilder.orderBy(`office.${sortBy}`, sortOrder);
    } else {
      // Orden por defecto si sortBy no es válido (o lanzar error)
      queryBuilder.orderBy('office.name', SortOrder.ASC);
    }

    // --- Paginación ---
    queryBuilder.skip((page - 1) * limit).take(limit);

    // --- Ejecutar Consulta ---
    const [offices, totalItems] = await queryBuilder.getManyAndCount();

    // --- Crear Metadatos de Paginación ---
    const totalPages = Math.ceil(totalItems / limit);
    const meta: PaginationMeta = {
      totalItems,
      itemCount: offices.length,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    };

    this.logger.debug(
      `Encontrados ${totalItems} consultorios, devolviendo página ${page} con ${offices.length} items.`,
    );
    return { data: offices, meta };
  }

  async findOne(id: string): Promise<Office> {
    const office = await this.officeRepository.findOne({
      where: { id },
      relations: ['timeSlots'], // Cargar timeSlots para la vista detallada
    });
    if (!office) {
      throw new NotFoundException(`Consultorio con ID "${id}" no encontrado.`);
    }
    return office;
  }

  async update(id: string, updateOfficeDto: UpdateOfficeDto): Promise<Office> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let updatedOffice: Office;

    try {
      const office = await this.officeRepository.preload({
        id,
        ...updateOfficeDto,
      });

      if (!office) {
        throw new Error(`Consultorio con ID ${id} no encontrado`);
      }

      if (updateOfficeDto.name && updateOfficeDto.name !== office.name) {
        const existing = await this.officeRepository.findOneBy({
          name: updateOfficeDto.name,
        });

        if (existing && existing.id !== id) {
          await queryRunner.rollbackTransaction(); // Cancela transacción
          await queryRunner.release();
          throw new ConflictException(
            `Ya existe otro consultorio con el nombre "${updateOfficeDto.name}".`,
          );
        }
      }

      updatedOffice = await queryRunner.manager.save(office);

      await queryRunner.commitTransaction();

      updatedOffice = await this.officeRepository.findOneOrFail({
        where: { id },
        relations: ['timeSlots'],
      });

      return updatedOffice;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const office = await this.officeRepository.findOne({ where: { id } });

    if (!office) {
      throw new Error(`Consultorio con ID ${id} no encontrado`);
    }

    const result = await this.officeRepository.delete(id);

    if (result.affected === 0) {
      throw new Error(`No se pudo eliminar el consultorio con ID ${id}`);
    }
  }
}
