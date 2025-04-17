import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Office, Prisma } from '@prisma/client';
import {
  PaginatedResultDto,
  PaginationMeta,
} from '../common/dto/pagination-result.dto';
import { formatDateToHHMMSS } from '../common/utils/format-date-to-hhmmss';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { OfficeQueryDto, SortOrder } from './dto/office-query.dto';
import { OfficeResponseDto } from './dto/office-response.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { parseTimeStringToDate } from '../common/utils/parse-time-string-to-date';
import { mapOfficeToResponseDto } from 'src/common/mappers/office.mapper';

@Injectable()
export class OfficesService {
  private readonly logger = new Logger(OfficesService.name);

  /**
   * Inyecta el PrismaService para interactuar con la base de datos.
   * @param prisma Instancia de PrismaService (inyectada por NestJS).
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un nuevo consultorio en la base de datos.
   * Convierte las horas de string a Date antes de guardar.
   * Maneja errores de constraint unique (ej: nombre duplicado).
   * @param createOfficeDto Datos para crear el consultorio.
   * @returns El consultorio creado, incluyendo relaciones básicas (timeSlots, jobPositions).
   * @throws {ConflictException} Si ya existe un consultorio con el mismo nombre.
   * @throws {Error} Si ocurre otro error durante la creación.
   */
  async create(createOfficeDto: CreateOfficeDto): Promise<OfficeResponseDto> {
    this.logger.log(`Intentando crear consultorio: ${createOfficeDto.name}`);

    const dataToCreate: Prisma.OfficeCreateInput = {
      ...createOfficeDto,
      workStartTime: parseTimeStringToDate(createOfficeDto.workStartTime),
      workEndTime: parseTimeStringToDate(createOfficeDto.workEndTime),
    };

    try {
      const newOffice = await this.prisma.office.create({ data: dataToCreate });
      this.logger.log(
        `Consultorio "${newOffice.name}" creado con ID: ${newOffice.id}`,
      );

      const officeWithRelations = await this.prisma.office.findUniqueOrThrow({
        where: { id: newOffice.id },
        include: { timeSlots: true, jobPositions: true },
      });

      return mapOfficeToResponseDto(officeWithRelations);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[])?.join(', ');
          this.logger.warn(
            `Conflicto P2002 al crear consultorio con nombre ${createOfficeDto.name}`,
          );
          throw new ConflictException(
            `Ya existe un registro con el mismo valor para ${target || 'un campo único'} (ej: nombre).`,
          );
        }
      }
      this.logger.error(
        `Error al crear consultorio "${createOfficeDto.name}":`,
        error,
      );
      throw error;
    }
  }

  /**
   * Busca y devuelve consultorios paginados, filtrados y ordenados.
   * @param queryDto DTO con parámetros de consulta (paginación, filtros, orden).
   * @returns Un objeto con los datos paginados y metadatos de paginación.
   */
  async findAll(
    queryDto: OfficeQueryDto,
  ): Promise<PaginatedResultDto<OfficeResponseDto>> {
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
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.OfficeWhereInput = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const workStartTimeFilter: Prisma.DateTimeFilter = {};
    if (workStartTimeFrom) {
      workStartTimeFilter.gte = parseTimeStringToDate(workStartTimeFrom);
    }
    if (workStartTimeTo) {
      workStartTimeFilter.lte = parseTimeStringToDate(workStartTimeTo);
    }
    if (Object.keys(workStartTimeFilter).length > 0) {
      where.workStartTime = workStartTimeFilter;
    }

    if (filterWorkingDays && filterWorkingDays.length > 0) {
      where.workingDays = { hasSome: filterWorkingDays };
    }

    const validSortFields = [
      'name',
      'workStartTime',
      'workEndTime',
      'createdAt',
    ];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const orderBy: Prisma.OfficeOrderByWithRelationInput = {
      [orderByField]: sortOrder.toLowerCase() as Prisma.SortOrder,
    };

    try {
      const [officesFromDb, totalItems] = await this.prisma.$transaction([
        this.prisma.office.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            _count: {
              select: {
                timeSlots: true,
                jobPositions: true,
                employees: true,
              },
            },
          },
        }),
        this.prisma.office.count({ where }),
      ]);

      const responseData = officesFromDb.map((office) =>
        mapOfficeToResponseDto(office),
      );

      const totalPages = Math.ceil(totalItems / take);
      const meta: PaginationMeta = {
        totalItems,
        itemCount: responseData.length,
        itemsPerPage: take,
        totalPages,
        currentPage: page,
      };

      this.logger.debug(
        `Encontrados ${totalItems} consultorios, devolviendo página ${page} con ${responseData.length} items.`,
      );
      return { data: responseData, meta };
    } catch (error) {
      this.logger.error(`Error al buscar consultorios:`, error);
      throw error;
    }
  }

  /**
   * Busca un consultorio por su ID y devuelve sus detalles incluyendo relaciones.
   * @param id El UUID del consultorio a buscar.
   * @returns El consultorio encontrado con timeSlots y jobPositions.
   * @throws {NotFoundException} Si no se encuentra el consultorio con el ID proporcionado.
   */
  async findOne(id: string): Promise<OfficeResponseDto> {
    this.logger.log(`Buscando consultorio con ID: ${id}`);

    const office = await this.prisma.office.findUnique({
      where: { id: id },
      include: {
        timeSlots: { orderBy: { startTime: 'asc' } },
        jobPositions: { orderBy: { name: 'asc' } },
        employees: { orderBy: { firstName: 'asc' } },
      },
    });

    if (!office) {
      this.logger.warn(`Consultorio con ID "${id}" no encontrado.`);
      throw new NotFoundException(`Consultorio con ID "${id}" no encontrado.`);
    }

    this.logger.debug(`Consultorio "${office.name}" encontrado.`);
    return mapOfficeToResponseDto(office);
  }

  /**
   * Actualiza un consultorio existente.
   * Verifica la existencia y conflictos de nombre único antes de actualizar.
   * Convierte horas de string a Date si se proporcionan.
   * @param id El UUID del consultorio a actualizar.
   * @param updateOfficeDto Los datos a actualizar.
   * @returns El consultorio actualizado, incluyendo relaciones básicas.
   * @throws {NotFoundException} Si el consultorio a actualizar no existe.
   * @throws {ConflictException} Si se intenta cambiar el nombre a uno que ya existe en otro consultorio.
   * @throws {Error} Si ocurre otro error durante la actualización.
   */
  async update(
    id: string,
    updateOfficeDto: UpdateOfficeDto,
  ): Promise<OfficeResponseDto> {
    this.logger.log(`Intentando actualizar consultorio con ID: ${id}`);

    await this.prisma.office.findUniqueOrThrow({ where: { id } });

    if (updateOfficeDto.name) {
      const existingByName = await this.prisma.office.findUnique({
        where: { name: updateOfficeDto.name },
      });
      if (existingByName && existingByName.id !== id) {
        this.logger.warn(
          `Conflicto: Intento de actualizar a nombre duplicado "${updateOfficeDto.name}"`,
        );
        throw new ConflictException(
          `Ya existe otro consultorio con el nombre "${updateOfficeDto.name}".`,
        );
      }
    }

    const dataToUpdate: Prisma.OfficeUpdateInput = { ...updateOfficeDto };
    if (updateOfficeDto.workStartTime) {
      dataToUpdate.workStartTime = parseTimeStringToDate(
        updateOfficeDto.workStartTime,
      );
    }
    if (updateOfficeDto.workEndTime) {
      dataToUpdate.workEndTime = parseTimeStringToDate(
        updateOfficeDto.workEndTime,
      );
    }

    try {
      const updatedOffice = await this.prisma.office.update({
        where: { id: id },
        data: dataToUpdate,
      });

      this.logger.log(`Consultorio con ID "${id}" actualizado.`);

      return mapOfficeToResponseDto(updatedOffice);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[])?.join(', ');
          throw new ConflictException(
            `Conflicto al actualizar: Ya existe un registro con el mismo valor para ${target || 'un campo único'}.`,
          );
        }
        if (error.code === 'P2025') {
          this.logger.warn(
            `Error P2025: Consultorio con ID "${id}" no encontrado durante la actualización.`,
          );
          throw new NotFoundException(
            `Consultorio con ID "${id}" no encontrado para actualizar.`,
          );
        }
      }
      this.logger.error(`Error al actualizar consultorio ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un consultorio por su ID.
   * Verifica la existencia antes de intentar eliminar.
   * @param id El UUID del consultorio a eliminar.
   * @returns Promise<void>
   * @throws {NotFoundException} Si el consultorio a eliminar no existe.
   * @throws {ConflictException} Si no se puede eliminar debido a restricciones de FK.
   * @throws {Error} Si ocurre otro error durante la eliminación.
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Intentando eliminar consultorio con ID: ${id}`);

    try {
      await this.prisma.office.findUniqueOrThrow({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(
          `Consultorio con ID "${id}" no encontrado para eliminar (check previo).`,
        );
        throw new NotFoundException(
          `Consultorio con ID "${id}" no encontrado para eliminar.`,
        );
      }
      this.logger.error(
        `Error buscando consultorio ${id} antes de eliminar:`,
        error,
      );
      throw error;
    }

    try {
      await this.prisma.office.delete({
        where: { id: id },
      });
      this.logger.log(`Consultorio con ID "${id}" eliminado correctamente.`);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this.logger.warn(
            `Error P2025: Consultorio con ID "${id}" no encontrado durante la eliminación.`,
          );
          throw new NotFoundException(
            `Consultorio con ID "${id}" no encontrado para eliminar.`,
          );
        }
        if (error.code === 'P2003') {
          this.logger.warn(
            `Error P2003: No se puede eliminar el consultorio ${id} debido a restricciones de clave foránea.`,
          );
          throw new ConflictException(
            `No se puede eliminar el consultorio porque tiene registros relacionados (ej: empleados activos).`,
          );
        }
      }
      this.logger.error(`Error al eliminar consultorio ${id}:`, error);
      throw error;
    }
  }
}
