import { Test, TestingModule } from '@nestjs/testing';
import { OfficesController } from './offices.controller';
import { OfficesService } from './offices.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { OfficeQueryDto, SortOrder } from './dto/office-query.dto';
import { PaginatedResultDto } from '../common/dto/pagination-result.dto';
import { OfficeResponseDto } from './dto/office-response.dto';
import { DayOfWeek } from '@prisma/client'; // Importa DayOfWeek si es necesario para mocks
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core'; // Necesario si pruebas guards más adelante

// --- Mock del Servicio ---
// Creamos un objeto que simula tener los métodos del servicio real
const mockOfficesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

// --- Datos de Ejemplo para Pruebas ---
const mockOfficeId = 'test-uuid-123';
const mockDate = new Date();

const mockOfficeResponse: OfficeResponseDto = {
  id: mockOfficeId,
  name: 'Consultorio Test',
  workStartTime: '09:00:00',
  workEndTime: '17:00:00',
  workingDays: [DayOfWeek.MONDAY],
  createdAt: mockDate,
  updatedAt: mockDate,
  timeSlotsCount: 1,
  jobPositionsCount: 1,
};

const mockPaginatedResult: PaginatedResultDto<OfficeResponseDto> = {
  data: [mockOfficeResponse],
  meta: {
    totalItems: 1,
    itemCount: 1,
    itemsPerPage: 10,
    totalPages: 1,
    currentPage: 1,
  },
};

describe('OfficesController', () => {
  let controller: OfficesController;
  let service: OfficesService; // Tendremos una referencia al mock

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OfficesController], // El controlador que estamos probando
      providers: [
        {
          provide: OfficesService, // Proveedor del servicio real
          useValue: mockOfficesService, // Valor a usar: nuestro mock
        },
        // No necesitamos PrismaService aquí porque mockeamos OfficesService
      ],
    }).compile();

    controller = module.get<OfficesController>(OfficesController);
    // Aunque inyectamos el mock, podemos obtener una referencia tipada si es necesario
    service = module.get<OfficesService>(OfficesService);
    // Limpia los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Pruebas para `create` ---
  describe('create', () => {
    it('should call officesService.create and return the result', async () => {
      const dto = new CreateOfficeDto(); // Puedes llenar con datos si es necesario
      mockOfficesService.create.mockResolvedValue(mockOfficeResponse); // Configura el mock

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto); // Verifica llamada al servicio
      expect(result).toEqual(mockOfficeResponse); // Verifica el resultado devuelto
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should propagate exceptions from the service', async () => {
      const dto = new CreateOfficeDto();
      const error = new ConflictException('Name conflict');
      mockOfficesService.create.mockRejectedValue(error); // Simula error del servicio

      // Verifica que el controlador lance la misma excepción que el servicio
      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  // --- Pruebas para `findAll` ---
  describe('findAll', () => {
    it('should call officesService.findAll with query params and return the result', async () => {
      const queryDto = new OfficeQueryDto();
      queryDto.page = 2;
      queryDto.limit = 5;
      mockOfficesService.findAll.mockResolvedValue(mockPaginatedResult); // Configura mock

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto); // Verifica llamada
      expect(result).toEqual(mockPaginatedResult); // Verifica resultado
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // --- Pruebas para `findOne` ---
  describe('findOne', () => {
    it('should call officesService.findOne with id and return the result', async () => {
      mockOfficesService.findOne.mockResolvedValue(mockOfficeResponse); // Configura mock

      const result = await controller.findOne(mockOfficeId);

      expect(service.findOne).toHaveBeenCalledWith(mockOfficeId); // Verifica llamada
      expect(result).toEqual(mockOfficeResponse); // Verifica resultado
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if service throws it', async () => {
      const error = new NotFoundException('Not found');
      mockOfficesService.findOne.mockRejectedValue(error); // Simula error

      await expect(controller.findOne(mockOfficeId)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(mockOfficeId);
    });

    // Nota: La validación de ParseUUIDPipe es manejada por NestJS antes de llegar al método.
    // Probarla explícitamente suele hacerse en tests e2e o de integración.
  });

  // --- Pruebas para `update` ---
  describe('update', () => {
    it('should call officesService.update with id and dto, and return the result', async () => {
      const dto = new UpdateOfficeDto();
      const updatedResponse = { ...mockOfficeResponse, name: 'Updated Name' };
      mockOfficesService.update.mockResolvedValue(updatedResponse); // Configura mock

      const result = await controller.update(mockOfficeId, dto);

      expect(service.update).toHaveBeenCalledWith(mockOfficeId, dto); // Verifica llamada
      expect(result).toEqual(updatedResponse); // Verifica resultado
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should propagate NotFoundException from the service', async () => {
      const dto = new UpdateOfficeDto();
      const error = new NotFoundException('Not found');
      mockOfficesService.update.mockRejectedValue(error); // Simula error

      await expect(controller.update(mockOfficeId, dto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(mockOfficeId, dto);
    });

     it('should propagate ConflictException from the service', async () => {
      const dto = new UpdateOfficeDto();
      const error = new ConflictException('Name conflict');
      mockOfficesService.update.mockRejectedValue(error); // Simula error

      await expect(controller.update(mockOfficeId, dto)).rejects.toThrow(ConflictException);
      expect(service.update).toHaveBeenCalledWith(mockOfficeId, dto);
    });
  });

  // --- Pruebas para `remove` ---
  describe('remove', () => {
    it('should call officesService.remove with id and return void', async () => {
      mockOfficesService.remove.mockResolvedValue(undefined); // Configura mock (devuelve void)

      const result = await controller.remove(mockOfficeId);

      expect(service.remove).toHaveBeenCalledWith(mockOfficeId); // Verifica llamada
      expect(result).toBeUndefined(); // Verifica resultado void
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

     it('should propagate NotFoundException from the service', async () => {
      const error = new NotFoundException('Not found');
      mockOfficesService.remove.mockRejectedValue(error); // Simula error

      await expect(controller.remove(mockOfficeId)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(mockOfficeId);
    });

     it('should propagate ConflictException from the service', async () => {
      const error = new ConflictException('Cannot delete due to FK');
      mockOfficesService.remove.mockRejectedValue(error); // Simula error

      await expect(controller.remove(mockOfficeId)).rejects.toThrow(ConflictException);
      expect(service.remove).toHaveBeenCalledWith(mockOfficeId);
    });
  });
});
