import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { OfficesService } from './offices.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { Office } from '@prisma/client';
import { OfficeQueryDto, SortOrder } from './dto/office-query.dto';
import { PaginatedResultDto } from '../common/dto/pagination-result.dto';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OfficeResponseDto } from './dto/office-response.dto';

type OfficeWithCountsResponse = Omit<Office, '_count'> & {
  timeSlotsCount: number;
  jobPositionsCount: number;
  employeesCount?: number;
};

@ApiTags('Offices')
@Controller('offices')
export class OfficesController {
  constructor(private readonly officesService: OfficesService) {}

  /**
   * Crea un nuevo consultorio.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo consultorio' }) // Documentación Swagger
  @ApiBody({ type: CreateOfficeDto }) // Documenta el cuerpo esperado
  @ApiResponse({ status: 201, description: 'Consultorio creado exitosamente.', type: OfficeResponseDto /* Idealmente un OfficeResponseDto */ })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 409, description: 'Conflicto, ej: nombre duplicado.' })
  create(@Body() createOfficeDto: CreateOfficeDto): Promise<OfficeResponseDto> {
    return this.officesService.create(createOfficeDto);
  }

  /**
   * Obtiene una lista paginada y filtrada de consultorios.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener lista de consultorios con filtros y paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Resultados por página' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Campo para ordenar' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder, description: 'Orden (ASC/DESC)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Término de búsqueda (nombre)' })
  @ApiQuery({ name: 'workStartTimeFrom', required: false, type: String, description: 'Hora inicio mínima (HH:MM:SS)' })
  @ApiQuery({ name: 'workStartTimeTo', required: false, type: String, description: 'Hora inicio máxima (HH:MM:SS)' })
  @ApiQuery({ name: 'filterWorkingDays', required: false, type: String, description: 'Días laborales a incluir (separados por coma, ej: MONDAY,TUESDAY)' })
  @ApiResponse({ status: 200, description: 'Lista de consultorios obtenida.', /* type: PaginatedResultDto<OfficeWithCountsResponse> */ }) // Swagger no maneja bien genéricos complejos a veces
  findAll(@Query() queryDto: OfficeQueryDto): Promise<PaginatedResultDto<OfficeResponseDto>> {
    // El ValidationPipe global (configurado en main.ts con transform: true)
    // debería validar y transformar queryDto automáticamente
    return this.officesService.findAll(queryDto);
  }

  /**
   * Obtiene los detalles de un consultorio específico por su ID.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un consultorio por ID' })
  @ApiParam({ name: 'id', description: 'UUID del consultorio', type: String }) // Documenta el parámetro de ruta
  @ApiResponse({ status: 200, description: 'Detalles del consultorio.', type: OfficeResponseDto /* Idealmente un OfficeResponseDto */ })
  @ApiResponse({ status: 400, description: 'ID inválido (no es UUID).' })
  @ApiResponse({ status: 404, description: 'Consultorio no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<OfficeResponseDto> {
    return this.officesService.findOne(id);
  }

  /**
   * Actualiza parcialmente un consultorio existente.
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un consultorio existente' })
  @ApiParam({ name: 'id', description: 'UUID del consultorio a actualizar', type: String })
  @ApiBody({ type: UpdateOfficeDto })
  @ApiResponse({ status: 200, description: 'Consultorio actualizado.', type: OfficeResponseDto /* Idealmente un OfficeResponseDto */ })
  @ApiResponse({ status: 400, description: 'ID inválido o datos de entrada inválidos.' })
  @ApiResponse({ status: 404, description: 'Consultorio no encontrado.' })
  @ApiResponse({ status: 409, description: 'Conflicto, ej: nombre duplicado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOfficeDto: UpdateOfficeDto,
  ): Promise<OfficeResponseDto> {
    return this.officesService.update(id, updateOfficeDto);
  }

  /**
   * Elimina un consultorio por su ID.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un consultorio por ID' })
  @ApiParam({ name: 'id', description: 'UUID del consultorio a eliminar', type: String })
  @ApiResponse({ status: 204, description: 'Consultorio eliminado exitosamente.' })
  @ApiResponse({ status: 400, description: 'ID inválido (no es UUID).' })
  @ApiResponse({ status: 404, description: 'Consultorio no encontrado.' })
  @ApiResponse({ status: 409, description: 'Conflicto, no se puede eliminar (ej: FK constraint).'})
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.officesService.remove(id);
  }
}
