import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { TimeSlotResponseDto } from './dto/time-slot-response.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { TimeSlotsService } from './time-slots.service';

@ApiTags('Time Slots')
@Controller('offices/:officeId/time-slots')
export class TimeSlotsController {
  constructor(private readonly timeSlotsService: TimeSlotsService) {}

  /**
   * Endpoint para crear una nueva franja horaria para un consultorio específico.
   * @param officeId UUID del consultorio padre.
   * @param createTimeSlotDto Datos de la franja horaria a crear.
   * @returns La franja horaria recién creada.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva franja horaria para un consultorio',
  })
  @ApiParam({
    name: 'officeId',
    description: 'UUID del consultorio padre',
    type: String,
    format: 'uuid',
  })
  @ApiBody({ type: CreateTimeSlotDto })
  @ApiResponse({
    status: 201,
    description: 'Franja horaria creada exitosamente.',
    type: TimeSlotResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 404, description: 'Consultorio padre no encontrado.' })
  @ApiResponse({
    status: 409,
    description:
      'Conflicto (ej: solapamiento de horas, fuera de horario laboral).',
  })
  create(
    @Param('officeId', ParseUUIDPipe) officeId: string,
    @Body() createTimeSlotDto: CreateTimeSlotDto,
  ): Promise<TimeSlotResponseDto> {
    return this.timeSlotsService.create(officeId, createTimeSlotDto);
  }

  /**
   * Endpoint para obtener todas las franjas horarias de un consultorio específico.
   * @param officeId UUID del consultorio padre.
   * @returns Un array de las franjas horarias encontradas.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todas las franjas horarias de un consultorio',
  })
  @ApiParam({
    name: 'officeId',
    description: 'UUID del consultorio padre',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de franjas horarias.',
    type: [TimeSlotResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Consultorio padre no encontrado.' })
  findAllForOffice(
    @Param('officeId', ParseUUIDPipe) officeId: string,
  ): Promise<TimeSlotResponseDto[]> {
    return this.timeSlotsService.findAllForOffice(officeId);
  }

  /**
   * Endpoint para actualizar parcialmente una franja horaria existente.
   * @param officeId UUID del consultorio padre (implícito en la ruta, no usado directamente aquí).
   * @param id UUID de la franja horaria a actualizar.
   * @param updateTimeSlotDto Datos a modificar en la franja horaria.
   * @returns La franja horaria actualizada.
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar una franja horaria existente' })
  @ApiParam({
    name: 'officeId',
    description: 'UUID del consultorio padre',
    type: String,
    format: 'uuid',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la franja horaria a actualizar',
    type: String,
    format: 'uuid',
  })
  @ApiBody({ type: UpdateTimeSlotDto })
  @ApiResponse({
    status: 200,
    description: 'Franja horaria actualizada.',
    type: TimeSlotResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido o datos de entrada inválidos.',
  })
  @ApiResponse({ status: 404, description: 'Franja horaria no encontrada.' })
  @ApiResponse({
    status: 409,
    description: 'Conflicto (ej: solapamiento, fuera de horario laboral).',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTimeSlotDto: UpdateTimeSlotDto,
  ): Promise<TimeSlotResponseDto> {
    return this.timeSlotsService.update(id, updateTimeSlotDto);
  }

  /**
   * Endpoint para eliminar una franja horaria específica por su ID.
   * @param officeId UUID del consultorio padre (implícito en la ruta).
   * @param id UUID de la franja horaria a eliminar.
   * @returns Vacío si la eliminación es exitosa.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una franja horaria por ID' })
  @ApiParam({
    name: 'officeId',
    description: 'UUID del consultorio padre',
    type: String,
    format: 'uuid',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la franja horaria a eliminar',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Franja horaria eliminada exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'ID inválido (no es UUID).' })
  @ApiResponse({ status: 404, description: 'Franja horaria no encontrada.' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.timeSlotsService.remove(id);
  }

  /**
   * Endpoint para eliminar TODAS las franjas horarias de un consultorio específico.
   * @param officeId UUID del consultorio cuyas franjas se eliminarán.
   * @returns Vacío si la eliminación es exitosa.
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar TODAS las franjas horarias de un consultorio',
  })
  @ApiParam({
    name: 'officeId',
    description: 'UUID del consultorio padre',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Todas las franjas horarias eliminadas.',
  })
  @ApiResponse({ status: 404, description: 'Consultorio padre no encontrado.' })
  removeAllForOffice(
    @Param('officeId', ParseUUIDPipe) officeId: string,
  ): Promise<void> {
    return this.timeSlotsService
      .removeAllForOffice(officeId)
      .then(() => undefined);
  }
}
