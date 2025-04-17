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
  Post
} from '@nestjs/common';
import { CreateJobPositionDto } from './dto/create-job-position.dto';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { JobPositionsService } from './job-positions.service';
import { JobPositionResponseDto } from './dto/job-position-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Job Positions') 
@Controller('offices/:officeId/job-positions')
export class JobPositionsController {
  constructor(private readonly jobPositionsService: JobPositionsService) {}

  /**
   * Endpoint para crear un nuevo puesto de trabajo para un consultorio específico.
   * @param officeId UUID del consultorio padre.
   * @param createJobPositionDto Datos del puesto a crear.
   * @returns El puesto de trabajo recién creado.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo puesto de trabajo para un consultorio' })
  @ApiParam({ name: 'officeId', description: 'UUID del consultorio padre', type: String, format: 'uuid' })
  @ApiBody({ type: CreateJobPositionDto })
  @ApiResponse({ status: 201, description: 'Puesto creado exitosamente.', type: JobPositionResponseDto })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 404, description: 'Consultorio padre no encontrado.' })
  @ApiResponse({ status: 409, description: 'Conflicto (ej: nombre de puesto duplicado en esta oficina).' })
  create(
    @Param('officeId', ParseUUIDPipe) officeId: string,
    @Body() createJobPositionDto: CreateJobPositionDto,
  ): Promise<JobPositionResponseDto> {
    return this.jobPositionsService.create(officeId, createJobPositionDto);
  }

  /**
   * Endpoint para obtener todos los puestos de trabajo de un consultorio específico.
   * @param officeId UUID del consultorio padre.
   * @returns Un array de los puestos de trabajo encontrados.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todos los puestos de trabajo de un consultorio' })
  @ApiParam({ name: 'officeId', description: 'UUID del consultorio padre', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lista de puestos de trabajo.', type: [JobPositionResponseDto] })
  @ApiResponse({ status: 404, description: 'Consultorio padre no encontrado.' })
  findAllForOffice(
    @Param('officeId', ParseUUIDPipe) officeId: string,
  ): Promise<JobPositionResponseDto[]> {
    return this.jobPositionsService.findAllForOffice(officeId);
  }

  /**
   * Endpoint para actualizar parcialmente un puesto de trabajo existente.
   * @param officeId UUID del consultorio padre (implícito en la ruta).
   * @param jobPositionId UUID del puesto de trabajo a actualizar.
   * @param updateJobPositionDto Datos a modificar.
   * @returns El puesto de trabajo actualizado.
   */
  @Patch(':jobPositionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un puesto de trabajo existente' })
  @ApiParam({ name: 'officeId', description: 'UUID del consultorio padre', type: String, format: 'uuid' })
  @ApiParam({ name: 'jobPositionId', description: 'UUID del puesto a actualizar', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateJobPositionDto })
  @ApiResponse({ status: 200, description: 'Puesto actualizado.', type: JobPositionResponseDto })
  @ApiResponse({ status: 400, description: 'ID inválido o datos de entrada inválidos.' })
  @ApiResponse({ status: 404, description: 'Puesto no encontrado.' })
  @ApiResponse({ status: 409, description: 'Conflicto (ej: nombre duplicado en esta oficina).' })
  update(
    @Param('jobPositionId', ParseUUIDPipe) jobPositionId: string,
    @Body() updateJobPositionDto: UpdateJobPositionDto,
  ): Promise<JobPositionResponseDto> {
    return this.jobPositionsService.update(jobPositionId, updateJobPositionDto);
  }

  /**
   * Endpoint para eliminar un puesto de trabajo específico por su ID.
   * @param officeId UUID del consultorio padre (implícito en la ruta).
   * @param jobPositionId UUID del puesto a eliminar.
   * @returns Vacío si la eliminación es exitosa.
   */
  @Delete(':jobPositionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un puesto de trabajo por ID' })
  @ApiParam({ name: 'officeId', description: 'UUID del consultorio padre', type: String, format: 'uuid' })
  @ApiParam({ name: 'jobPositionId', description: 'UUID del puesto a eliminar', type: String, format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Puesto eliminado exitosamente.' })
  @ApiResponse({ status: 400, description: 'ID inválido (no es UUID).' })
  @ApiResponse({ status: 404, description: 'Puesto no encontrado.' })
  @ApiResponse({ status: 409, description: 'Conflicto, no se puede eliminar (ej: restricción FK).'})
  remove(
    @Param('jobPositionId', ParseUUIDPipe) jobPositionId: string,
  ): Promise<void> {
    return this.jobPositionsService.remove(jobPositionId);
  }
}
