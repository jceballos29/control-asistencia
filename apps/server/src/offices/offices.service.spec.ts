import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DayOfWeek, Office, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { OfficeQueryDto, SortOrder } from './dto/office-query.dto';
import { OfficeResponseDto } from './dto/office-response.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { OfficesService } from './offices.service';

const mockPrismaService = {
  office: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

const mockOfficeId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
const mockDate = new Date();

const mockOffice: Office = {
  id: mockOfficeId,
  name: 'Consultorio Mock',
  workStartTime: new Date(`1970-01-01T09:00:00.000Z`),
  workEndTime: new Date(`1970-01-01T17:00:00.000Z`),
  workingDays: [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
  ],
  createdAt: mockDate,
  updatedAt: mockDate,
};

const mockOfficeFromFindMany = {
  ...mockOffice,
  _count: { timeSlots: 2, jobPositions: 1 },
};

const mockCreateDto: CreateOfficeDto = {
  name: 'Nuevo Consultorio',
  workStartTime: '08:00:00',
  workEndTime: '18:00:00',
  workingDays: [DayOfWeek.MONDAY, DayOfWeek.FRIDAY],
};
const mockUpdateDto: UpdateOfficeDto = {
  name: 'Consultorio Actualizado',
  workEndTime: '17:30:00',
};

const expectedResponseDto: OfficeResponseDto = {
  id: mockOfficeId,
  name: mockOffice.name,
  workStartTime: '09:00:00',
  workEndTime: '17:00:00',
  workingDays: mockOffice.workingDays,
  createdAt: mockOffice.createdAt,
  updatedAt: mockOffice.updatedAt,
  timeSlotsCount: 0,
  jobPositionsCount: 0,
};

const expectedResponseDtoWithCounts: OfficeResponseDto = {
  ...expectedResponseDto,
  timeSlotsCount: 2,
  jobPositionsCount: 1,
};

describe('OfficesService', () => {
  let service: OfficesService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfficesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OfficesService>(OfficesService);
    prisma = module.get<typeof mockPrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an office and return the mapped response DTO', async () => {
      prisma.office.create.mockResolvedValue(mockOffice);
      prisma.office.findUniqueOrThrow.mockResolvedValue({
        ...mockOffice,
        timeSlots: [],
        jobPositions: [],
      });
      const result = await service.create(mockCreateDto);
      expect(prisma.office.create).toHaveBeenCalledWith({
        data: expect.any(Object),
      });
      expect(prisma.office.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: mockOffice.id },
        include: { timeSlots: true, jobPositions: true },
      });
      expect(result).toEqual(expectedResponseDto);
    });
    it('should throw ConflictException on unique constraint violation (P2002)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: 'x.y.z', meta: { target: ['name'] } },
      );
      prisma.office.create.mockRejectedValue(prismaError);
      await expect(service.create(mockCreateDto)).rejects.toThrow(
        ConflictException,
      );
    });
    it('should re-throw other database errors during creation', async () => {
      const genericError = new Error('Database connection error');
      prisma.office.create.mockRejectedValue(genericError);
      await expect(service.create(mockCreateDto)).rejects.toThrow(genericError);
    });
  });

  describe('findAll', () => {
    const mockQueryDto = new OfficeQueryDto();
    const mockTotalItems = 5;
    const mockOfficesFromDb = [mockOfficeFromFindMany];
    it('should return paginated offices mapped to response DTOs', async () => {
      prisma.$transaction.mockResolvedValue([
        mockOfficesFromDb,
        mockTotalItems,
      ]);
      const result = await service.findAll(mockQueryDto);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(expectedResponseDtoWithCounts);
      expect(result.meta.totalItems).toBe(mockTotalItems);
    });
    it('should apply search, filter, sort, and pagination parameters', async () => {
      const queryDto: OfficeQueryDto = {
        page: 2,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: SortOrder.DESC,
        search: 'Test',
        workStartTimeFrom: '10:00:00',
        workStartTimeTo: '16:00:00',
        filterWorkingDays: [DayOfWeek.MONDAY],
      };
      const skip = (queryDto.page! - 1) * queryDto.limit!;
      const take = queryDto.limit!;
      const expectedWhere: Prisma.OfficeWhereInput = {
        name: { contains: 'Test', mode: 'insensitive' },
        workStartTime: {
          gte: new Date('1970-01-01T10:00:00Z'),
          lte: new Date('1970-01-01T16:00:00Z'),
        },
        workingDays: { hasSome: [DayOfWeek.MONDAY] },
      };
      const expectedOrderBy: Prisma.OfficeOrderByWithRelationInput = {
        createdAt: 'desc',
      };
      prisma.$transaction.mockResolvedValue([[], 0]);
      await service.findAll(queryDto);
      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.office.findMany(
          expect.objectContaining({
            where: expectedWhere,
            orderBy: expectedOrderBy,
            skip: skip,
            take: take,
            include: expect.any(Object),
          }),
        ),
        prisma.office.count({ where: expectedWhere }),
      ]);
    });
    it('should handle errors during findAll transaction', async () => {
      const dbError = new Error('Transaction failed');
      prisma.$transaction.mockRejectedValue(dbError);
      await expect(service.findAll(mockQueryDto)).rejects.toThrow(dbError);
    });
  });

  describe('findOne', () => {
    it('should return an office mapped to response DTO if found', async () => {
      prisma.office.findUnique.mockResolvedValue(mockOffice);
      const result = await service.findOne(mockOfficeId);
      expect(prisma.office.findUnique).toHaveBeenCalledWith({
        where: { id: mockOfficeId },
        include: expect.any(Object),
      });
      expect(result).toEqual(expectedResponseDto);
    });
    it('should throw NotFoundException if office is not found', async () => {
      prisma.office.findUnique.mockResolvedValue(null);
      await expect(service.findOne(mockOfficeId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updatedOfficeData = {
      ...mockOffice,
      name: mockUpdateDto.name!,
      workEndTime: new Date(`1970-01-01T${mockUpdateDto.workEndTime}Z`),
    };
    const expectedUpdatedResponseDto: OfficeResponseDto = {
      id: mockOfficeId,
      name: mockUpdateDto.name!,
      workStartTime: '09:00:00',
      workEndTime: '17:30:00',
      workingDays: mockOffice.workingDays,
      createdAt: mockOffice.createdAt,
      updatedAt: expect.any(Date),
      timeSlotsCount: 0,
      jobPositionsCount: 0,
    };

    it('should update an office and return the mapped response DTO', async () => {
      prisma.office.findUniqueOrThrow.mockResolvedValue(mockOffice);
      prisma.office.findUnique.mockResolvedValue(null);
      prisma.office.update.mockResolvedValue(updatedOfficeData);

      const result = await service.update(mockOfficeId, mockUpdateDto);

      expect(prisma.office.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: mockOfficeId },
      });
      expect(prisma.office.findUnique).toHaveBeenCalledWith({
        where: { name: mockUpdateDto.name },
      });
      expect(prisma.office.update).toHaveBeenCalledWith({
        where: { id: mockOfficeId },
        data: expect.objectContaining({ name: mockUpdateDto.name }),
      });
      expect(result.id).toEqual(expectedUpdatedResponseDto.id);
      expect(result.name).toEqual(expectedUpdatedResponseDto.name);
      expect(result.workEndTime).toEqual(
        expectedUpdatedResponseDto.workEndTime,
      );
    });

    it('should throw Prisma P2025 error if office to update is not found (on initial check)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'An operation failed because it depends on one or more records that were required but not found.',
        {
          code: 'P2025',
          clientVersion: 'x.y.z',
          meta: { cause: 'Record to update not found.' },
        },
      );
      prisma.office.findUniqueOrThrow.mockRejectedValue(prismaError);

      await expect(service.update(mockOfficeId, mockUpdateDto)).rejects.toThrow(
        prismaError,
      );

      expect(prisma.office.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: mockOfficeId },
      });
      expect(prisma.office.findUniqueOrThrow).toHaveBeenCalledTimes(1);

      expect(prisma.office.findUnique).not.toHaveBeenCalled();
      expect(prisma.office.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if name conflicts with another office', async () => {
      const conflictingOffice = {
        ...mockOffice,
        id: 'different-id',
        name: mockUpdateDto.name!,
      };
      prisma.office.findUniqueOrThrow.mockResolvedValue(mockOffice);
      prisma.office.findUnique.mockResolvedValue(conflictingOffice);
      await expect(service.update(mockOfficeId, mockUpdateDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.office.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(prisma.office.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.office.update).not.toHaveBeenCalled();
    });
    it('should throw NotFoundException on P2025 error during update operation', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: 'x.y.z' },
      );
      prisma.office.findUniqueOrThrow.mockResolvedValue(mockOffice);
      prisma.office.findUnique.mockResolvedValue(null);
      prisma.office.update.mockRejectedValue(prismaError);
      await expect(service.update(mockOfficeId, mockUpdateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
    it('should re-throw other errors during update', async () => {
      const genericError = new Error('Some update error');
      prisma.office.findUniqueOrThrow.mockResolvedValue(mockOffice);
      prisma.office.findUnique.mockResolvedValue(null);
      prisma.office.update.mockRejectedValue(genericError);
      await expect(service.update(mockOfficeId, mockUpdateDto)).rejects.toThrow(
        genericError,
      );
    });
  });

  describe('remove', () => {
    it('should remove an office successfully', async () => {
      prisma.office.findUniqueOrThrow.mockResolvedValue(mockOffice);
      prisma.office.delete.mockResolvedValue(mockOffice);
      await service.remove(mockOfficeId);
      expect(prisma.office.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: mockOfficeId },
      });
      expect(prisma.office.delete).toHaveBeenCalledWith({
        where: { id: mockOfficeId },
      });
    });
    it('should throw NotFoundException if office to remove is not found (on initial check)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: 'x.y.z' },
      );
      prisma.office.findUniqueOrThrow.mockRejectedValue(prismaError);
      await expect(service.remove(mockOfficeId)).rejects.toThrow(
        NotFoundException,
      );
    });
    it('should throw NotFoundException on P2025 error during delete operation', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: 'x.y.z' },
      );
      prisma.office.findUniqueOrThrow.mockResolvedValue(mockOffice);
      prisma.office.delete.mockRejectedValue(prismaError);
      await expect(service.remove(mockOfficeId)).rejects.toThrow(
        NotFoundException,
      );
    });
    it('should throw ConflictException on P2003 error (FK constraint)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'FK constraint failed',
        { code: 'P2003', clientVersion: 'x.y.z' },
      );
      prisma.office.findUniqueOrThrow.mockResolvedValue(mockOffice);
      prisma.office.delete.mockRejectedValue(prismaError);
      await expect(service.remove(mockOfficeId)).rejects.toThrow(
        ConflictException,
      );
    });
    it('should re-throw other errors during remove', async () => {
      const genericError = new Error('Some delete error');
      prisma.office.findUniqueOrThrow.mockResolvedValue(mockOffice);
      prisma.office.delete.mockRejectedValue(genericError);
      await expect(service.remove(mockOfficeId)).rejects.toThrow(genericError);
    });
  });
});
