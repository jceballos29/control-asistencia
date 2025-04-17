import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DayOfWeek, Office, Prisma, TimeSlot } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { TimeSlotResponseDto } from './dto/time-slot-response.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { TimeSlotsService } from './time-slots.service';
import { parseTimeStringToDate } from '../common/utils/parse-time-string-to-date';

// Mock Completo para PrismaService (enfocado en timeSlot y office)
const mockPrismaService = {
  timeSlot: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  office: {
    findUniqueOrThrow: jest.fn(),
  },
  // Mock para $transaction si fuera necesario (no se usa en este servicio)
  // $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// --- Datos de Ejemplo ---
const mockOfficeId = 'office-uuid-111';
const mockTimeSlotId = 'timeslot-uuid-222';
const mockDate = new Date();

// Oficina simulada (con horas como Date)
const mockOffice: Office = {
  id: mockOfficeId,
  name: 'Oficina de Pruebas',
  workStartTime: new Date('1970-01-01T09:00:00.000Z'),
  workEndTime: new Date('1970-01-01T18:00:00.000Z'),
  workingDays: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY],
  createdAt: mockDate,
  updatedAt: mockDate,
};

// TimeSlot simulado (con horas como Date)
const mockTimeSlot: TimeSlot = {
  id: mockTimeSlotId,
  officeId: mockOfficeId,
  startTime: new Date('1970-01-01T10:00:00.000Z'),
  endTime: new Date('1970-01-01T11:00:00.000Z'),
  createdAt: mockDate,
  updatedAt: mockDate,
};

// DTO de creación
const mockCreateDto: CreateTimeSlotDto = {
  startTime: '14:00:00',
  endTime: '15:00:00',
};

// DTO de actualización
const mockUpdateDto: UpdateTimeSlotDto = {
  endTime: '15:30:00',
};

// DTO de respuesta esperado (mapeado)
const expectedResponseDto: TimeSlotResponseDto = {
  id: mockTimeSlotId,
  startTime: '10:00:00', // Hora formateada
  endTime: '11:00:00', // Hora formateada
  officeId: mockOfficeId,
  createdAt: mockDate,
  updatedAt: mockDate,
};

// --- Suite de Pruebas ---
describe('TimeSlotsService', () => {
  let service: TimeSlotsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeSlotsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TimeSlotsService>(TimeSlotsService);
    prisma = module.get<typeof mockPrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Pruebas para `create` ---
  describe('create', () => {
    const startTimeDate = new Date(`1970-01-01T${mockCreateDto.startTime}Z`);
    const endTimeDate = new Date(`1970-01-01T${mockCreateDto.endTime}Z`);
    const createdSlot = {
      ...mockTimeSlot,
      startTime: startTimeDate,
      endTime: endTimeDate,
    };

    it('should create a timeslot and return mapped DTO', async () => {
      prisma.office.findUniqueOrThrow.mockResolvedValue(mockOffice); // Valida oficina OK
      prisma.timeSlot.count.mockResolvedValue(0); // No overlap OK
      prisma.timeSlot.create.mockResolvedValue(createdSlot); // Creación OK

      const result = await service.create(mockOfficeId, mockCreateDto);

      expect(prisma.office.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: mockOfficeId },
      });
      expect(prisma.timeSlot.count).toHaveBeenCalledWith({
        // Verifica validación de solapamiento
        where: {
          officeId: mockOfficeId,
          AND: [
            { startTime: { lt: endTimeDate } },
            { endTime: { gt: startTimeDate } },
          ],
        },
      });
      expect(prisma.timeSlot.create).toHaveBeenCalledWith({
        data: {
          startTime: startTimeDate,
          endTime: endTimeDate,
          officeId: mockOfficeId,
        },
      });
      // Verifica el resultado mapeado
      expect(result).toEqual({
        ...expectedResponseDto, // Usa el DTO esperado base
        id: createdSlot.id, // Asegura que el ID sea el correcto
        startTime: mockCreateDto.startTime, // Compara con la hora formateada esperada
        endTime: mockCreateDto.endTime,
        createdAt: createdSlot.createdAt,
        updatedAt: createdSlot.updatedAt,
      });
    });

    it('should throw NotFoundException if office does not exist', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Not Found',
        { code: 'P2025', clientVersion: 'x.y.z' },
      );
      prisma.office.findUniqueOrThrow.mockRejectedValue(prismaError); // Falla validación de oficina

      await expect(service.create(mockOfficeId, mockCreateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.office.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: mockOfficeId },
      });
      expect(prisma.timeSlot.count).not.toHaveBeenCalled();
      expect(prisma.timeSlot.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if slot is outside office hours (start)', async () => {
      const earlyDto: CreateTimeSlotDto = {
        startTime: '08:00:00',
        endTime: '08:30:00',
      }; // Antes de las 09:00
      prisma.office.findUniqueOrThrow.mockResolvedValue(mockOffice); // Oficina encontrada

      // La excepción debe ser lanzada por la validación interna, no por Prisma directamente
      await expect(service.create(mockOfficeId, earlyDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.office.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(prisma.timeSlot.count).not.toHaveBeenCalled(); // No llega a validar solapamiento
      expect(prisma.timeSlot.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if slot is outside office hours (end)', async () => {
      const lateDto: CreateTimeSlotDto = {
        startTime: '17:30:00',
        endTime: '18:30:00',
      }; // Después de las 18:00
      prisma.office.findUniqueOrThrow.mockResolvedValue(mockOffice); // Oficina encontrada

      await expect(service.create(mockOfficeId, lateDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.office.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(prisma.timeSlot.count).not.toHaveBeenCalled();
      expect(prisma.timeSlot.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if slot overlaps with existing ones', async () => {
      prisma.office.findUniqueOrThrow.mockResolvedValue(mockOffice); // Valida oficina OK
      prisma.timeSlot.count.mockResolvedValue(1); // Simula que SÍ hay solapamiento

      await expect(service.create(mockOfficeId, mockCreateDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.office.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(prisma.timeSlot.count).toHaveBeenCalledTimes(1); // Se llamó a la validación
      expect(prisma.timeSlot.create).not.toHaveBeenCalled(); // No se creó
    });
  });

  // --- Pruebas para `findAllForOffice` ---
  describe('findAllForOffice', () => {
    it('should return an array of mapped TimeSlotResponseDto', async () => {
      const slotsFromDb = [
        mockTimeSlot,
        {
          ...mockTimeSlot,
          id: 'slot-333',
          startTime: new Date('1970-01-01T11:00:00Z'),
          endTime: new Date('1970-01-01T12:00:00Z'),
        },
      ];
      prisma.office.findUniqueOrThrow.mockResolvedValue(mockOffice); // Valida oficina OK
      prisma.timeSlot.findMany.mockResolvedValue(slotsFromDb); // Devuelve slots

      const result = await service.findAllForOffice(mockOfficeId);

      expect(prisma.office.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: mockOfficeId },
      });
      expect(prisma.timeSlot.findMany).toHaveBeenCalledWith({
        where: { officeId: mockOfficeId },
        orderBy: { startTime: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expectedResponseDto); // Verifica mapeo del primero
      expect(result[1].startTime).toEqual('11:00:00'); // Verifica mapeo del segundo
    });

    it('should return an empty array if no timeslots exist', async () => {
      prisma.office.findUniqueOrThrow.mockResolvedValue(mockOffice);
      prisma.timeSlot.findMany.mockResolvedValue([]); // No hay slots

      const result = await service.findAllForOffice(mockOfficeId);

      expect(prisma.timeSlot.findMany).toHaveBeenCalledWith({
        where: { officeId: mockOfficeId },
        orderBy: { startTime: 'asc' },
      });
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException if office does not exist', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Not Found',
        { code: 'P2025', clientVersion: 'x.y.z' },
      );
      prisma.office.findUniqueOrThrow.mockRejectedValue(prismaError); // Falla validación

      await expect(service.findAllForOffice(mockOfficeId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.timeSlot.findMany).not.toHaveBeenCalled();
    });
  });

  // --- Pruebas para `findOne` ---
  describe('findOne', () => {
    it('should return a mapped TimeSlotResponseDto if found', async () => {
      prisma.timeSlot.findUniqueOrThrow.mockResolvedValue(mockTimeSlot); // Encuentra el slot

      const result = await service.findOne(mockTimeSlotId);

      expect(prisma.timeSlot.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: mockTimeSlotId },
      });
      expect(result).toEqual(expectedResponseDto); // Verifica mapeo
    });

    it('should throw NotFoundException if timeslot is not found (P2025)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Not Found',
        { code: 'P2025', clientVersion: 'x.y.z' },
      );
      prisma.timeSlot.findUniqueOrThrow.mockRejectedValue(prismaError); // Falla búsqueda

      await expect(service.findOne(mockTimeSlotId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.timeSlot.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: mockTimeSlotId },
      });
    });
  });

  // --- Pruebas para `update` ---
  describe('update', () => {
    const startTimeDate = parseTimeStringToDate(
      mockTimeSlot.startTime.toISOString().substring(11, 19),
    ); // 10:00:00
    const endTimeDate = parseTimeStringToDate(mockUpdateDto.endTime!); // 15:30:00
    const updatedSlotData = { ...mockTimeSlot, endTime: endTimeDate };
    const expectedUpdatedDto: TimeSlotResponseDto = {
      ...expectedResponseDto,
      endTime: '15:30:00',
    };

    it('should update a timeslot and return mapped DTO', async () => {
      // 1. Mock para findUniqueOrThrow inicial (encuentra slot + oficina)
      prisma.timeSlot.findUniqueOrThrow.mockResolvedValue({
        ...mockTimeSlot,
        office: mockOffice,
      });
      // 2. Mock para validación de solapamiento (no hay solapamiento)
      prisma.timeSlot.count.mockResolvedValue(0);
      // 3. Mock para la operación update
      prisma.timeSlot.update.mockResolvedValue(updatedSlotData);

      const result = await service.update(mockTimeSlotId, mockUpdateDto);

      expect(prisma.timeSlot.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: mockTimeSlotId },
        include: { office: true },
      });
      expect(prisma.timeSlot.count).toHaveBeenCalledWith(
        expect.objectContaining({
          // Verifica validación overlap
          where: expect.objectContaining({
            officeId: mockOfficeId,
            id: { not: mockTimeSlotId }, // Excluye el propio slot
            AND: expect.arrayContaining([
              { startTime: { lt: endTimeDate } }, // Compara con la nueva hora fin
              { endTime: { gt: startTimeDate } }, // Compara con la hora inicio original
            ]),
          }),
        }),
      );
      expect(prisma.timeSlot.update).toHaveBeenCalledWith({
        where: { id: mockTimeSlotId },
        data: { endTime: endTimeDate }, // Verifica datos a actualizar
      });
      expect(result).toEqual(expectedUpdatedDto); // Verifica resultado mapeado
    });

    it('should return existing mapped DTO if update DTO is empty', async () => {
      prisma.timeSlot.findUniqueOrThrow.mockResolvedValue({
        ...mockTimeSlot,
        office: mockOffice,
      });
      const emptyUpdateDto = {};

      const result = await service.update(mockTimeSlotId, emptyUpdateDto);

      expect(prisma.timeSlot.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(prisma.timeSlot.count).not.toHaveBeenCalled(); // No valida si no hay cambios
      expect(prisma.timeSlot.update).not.toHaveBeenCalled(); // No actualiza
      expect(result).toEqual(expectedResponseDto); // Devuelve el original mapeado
    });

    it('should throw NotFoundException if timeslot to update is not found', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Not Found',
        { code: 'P2025', clientVersion: 'x.y.z' },
      );
      prisma.timeSlot.findUniqueOrThrow.mockRejectedValue(prismaError); // Falla búsqueda inicial

      await expect(
        service.update(mockTimeSlotId, mockUpdateDto),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.timeSlot.count).not.toHaveBeenCalled();
      expect(prisma.timeSlot.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if updated slot is outside office hours', async () => {
      const lateUpdateDto: UpdateTimeSlotDto = { endTime: '19:00:00' }; // Fuera de hora
      prisma.timeSlot.findUniqueOrThrow.mockResolvedValue({
        ...mockTimeSlot,
        office: mockOffice,
      }); // Encuentra slot y oficina

      // La validación de horas debe fallar
      await expect(
        service.update(mockTimeSlotId, lateUpdateDto),
      ).rejects.toThrow(ConflictException);
      expect(prisma.timeSlot.count).not.toHaveBeenCalled(); // No llega a validar solapamiento
      expect(prisma.timeSlot.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if updated slot overlaps', async () => {
      prisma.timeSlot.findUniqueOrThrow.mockResolvedValue({
        ...mockTimeSlot,
        office: mockOffice,
      }); // Encuentra slot y oficina
      prisma.timeSlot.count.mockResolvedValue(1); // Falla validación de solapamiento

      await expect(
        service.update(mockTimeSlotId, mockUpdateDto),
      ).rejects.toThrow(ConflictException);
      expect(prisma.timeSlot.count).toHaveBeenCalledTimes(1);
      expect(prisma.timeSlot.update).not.toHaveBeenCalled();
    });
  });

  // --- Pruebas para `remove` ---
  describe('remove', () => {
    it('should remove a timeslot successfully', async () => {
      prisma.timeSlot.findUniqueOrThrow.mockResolvedValue(mockTimeSlot); // Check OK
      prisma.timeSlot.delete.mockResolvedValue(mockTimeSlot); // Delete OK

      await service.remove(mockTimeSlotId);

      expect(prisma.timeSlot.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: mockTimeSlotId },
      });
      expect(prisma.timeSlot.delete).toHaveBeenCalledWith({
        where: { id: mockTimeSlotId },
      });
    });

    it('should throw NotFoundException if timeslot to remove is not found', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Not Found',
        { code: 'P2025', clientVersion: 'x.y.z' },
      );
      prisma.timeSlot.findUniqueOrThrow.mockRejectedValue(prismaError); // Falla check inicial

      await expect(service.remove(mockTimeSlotId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.timeSlot.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException on P2025 error during delete', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Not Found',
        { code: 'P2025', clientVersion: 'x.y.z' },
      );
      prisma.timeSlot.findUniqueOrThrow.mockResolvedValue(mockTimeSlot); // Check OK
      prisma.timeSlot.delete.mockRejectedValue(prismaError); // Delete falla

      await expect(service.remove(mockTimeSlotId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --- Pruebas para `removeAllForOffice` ---
  describe('removeAllForOffice', () => {
    it('should remove all timeslots for an office and return the count', async () => {
      const deleteCount = 3;
      prisma.office.findUniqueOrThrow.mockResolvedValue(mockOffice); // Valida oficina OK
      prisma.timeSlot.deleteMany.mockResolvedValue({ count: deleteCount }); // Simula deleteMany

      const result = await service.removeAllForOffice(mockOfficeId);

      expect(prisma.office.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: mockOfficeId },
      });
      expect(prisma.timeSlot.deleteMany).toHaveBeenCalledWith({
        where: { officeId: mockOfficeId },
      });
      expect(result).toEqual({ deletedCount: deleteCount });
    });

    it('should throw NotFoundException if office does not exist', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Not Found',
        { code: 'P2025', clientVersion: 'x.y.z' },
      );
      prisma.office.findUniqueOrThrow.mockRejectedValue(prismaError); // Falla validación

      await expect(service.removeAllForOffice(mockOfficeId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.timeSlot.deleteMany).not.toHaveBeenCalled();
    });
  });
});
