import { Test, TestingModule } from '@nestjs/testing';
import { JobPositionsService } from './job-positions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, JobPosition, Office } from '@prisma/client';
import { CreateJobPositionDto } from './dto/create-job-position.dto';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { JobPositionResponseDto } from './dto/job-position-response.dto';

const mockPrismaService = {
  jobPosition: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  office: {
    findUniqueOrThrow: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

const mockOfficeId = 'office-uuid-111';
const mockJobPositionId = 'job-uuid-333';
const mockDate = new Date();

const mockJobPosition: JobPosition = {
  id: mockJobPositionId,
  name: 'Tester',
  color: '#00FF00',
  officeId: mockOfficeId,
  createdAt: mockDate,
  updatedAt: mockDate,
};

const mockCreateDto: CreateJobPositionDto = {
  name: 'Developer',
  color: '#FFA500',
};

const mockUpdateDto: UpdateJobPositionDto = {
  color: '#0000FF',
};

const expectedResponseDto: JobPositionResponseDto = {
  id: mockJobPositionId,
  name: mockJobPosition.name,
  color: mockJobPosition.color,
  officeId: mockJobPosition.officeId,
  createdAt: mockJobPosition.createdAt,
  updatedAt: mockJobPosition.updatedAt,
};

describe('JobPositionsService', () => {
  let service: JobPositionsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobPositionsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<JobPositionsService>(JobPositionsService);
    prisma = module.get<typeof mockPrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createdJobPosition = { ...mockJobPosition, ...mockCreateDto, officeId: mockOfficeId };

    it('should create a job position and return mapped DTO', async () => {
      prisma.office.findUniqueOrThrow.mockResolvedValue({ id: mockOfficeId });
      prisma.jobPosition.count.mockResolvedValue(0);
      prisma.jobPosition.create.mockResolvedValue(createdJobPosition);

      const result = await service.create(mockOfficeId, mockCreateDto);

      expect(prisma.office.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: mockOfficeId }, select: { id: true } });
      expect(prisma.jobPosition.count).toHaveBeenCalledWith({
        where: { name: mockCreateDto.name, officeId: mockOfficeId },
      });
      expect(prisma.jobPosition.create).toHaveBeenCalledWith({
        data: { ...mockCreateDto, officeId: mockOfficeId },
      });
      expect(result).toEqual({
          id: createdJobPosition.id,
          name: createdJobPosition.name,
          color: createdJobPosition.color,
          officeId: createdJobPosition.officeId,
          createdAt: createdJobPosition.createdAt,
          updatedAt: createdJobPosition.updatedAt,
      });
    });

    it('should throw NotFoundException if office does not exist', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Not Found', { code: 'P2025', clientVersion: 'x.y.z' });
      prisma.office.findUniqueOrThrow.mockRejectedValue(prismaError);

      await expect(service.create(mockOfficeId, mockCreateDto)).rejects.toThrow(NotFoundException);
      expect(prisma.jobPosition.count).not.toHaveBeenCalled();
      expect(prisma.jobPosition.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if name is not unique for the office (explicit check)', async () => {
      prisma.office.findUniqueOrThrow.mockResolvedValue({ id: mockOfficeId });
      prisma.jobPosition.count.mockResolvedValue(1);

      await expect(service.create(mockOfficeId, mockCreateDto)).rejects.toThrow(ConflictException);
      expect(prisma.jobPosition.count).toHaveBeenCalledTimes(1);
      expect(prisma.jobPosition.create).not.toHaveBeenCalled();
    });

     it('should throw ConflictException if name is not unique for the office (Prisma P2002)', async () => {
        const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'x.y.z', meta: { target: ['JobPosition_name_officeId_key'] } });
        prisma.office.findUniqueOrThrow.mockResolvedValue({ id: mockOfficeId });
        prisma.jobPosition.count.mockResolvedValue(0);
        prisma.jobPosition.create.mockRejectedValue(prismaError);

        await expect(service.create(mockOfficeId, mockCreateDto)).rejects.toThrow(ConflictException);
        expect(prisma.jobPosition.create).toHaveBeenCalledTimes(1);
     });
  });

  describe('findAllForOffice', () => {
    const jobPositionsFromDb = [mockJobPosition, { ...mockJobPosition, id: 'job-444', name: 'Admin' }];

    it('should return an array of mapped JobPositionResponseDto', async () => {
      prisma.office.findUniqueOrThrow.mockResolvedValue({ id: mockOfficeId });
      prisma.jobPosition.findMany.mockResolvedValue(jobPositionsFromDb);

      const result = await service.findAllForOffice(mockOfficeId);

      expect(prisma.office.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: mockOfficeId }, select: { id: true } });
      expect(prisma.jobPosition.findMany).toHaveBeenCalledWith({
        where: { officeId: mockOfficeId },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expectedResponseDto);
      expect(result[1].name).toEqual('Admin');
    });

     it('should return an empty array if no job positions exist', async () => {
      prisma.office.findUniqueOrThrow.mockResolvedValue({ id: mockOfficeId });
      prisma.jobPosition.findMany.mockResolvedValue([]);

      const result = await service.findAllForOffice(mockOfficeId);

      expect(prisma.jobPosition.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException if office does not exist', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Not Found', { code: 'P2025', clientVersion: 'x.y.z' });
      prisma.office.findUniqueOrThrow.mockRejectedValue(prismaError);

      await expect(service.findAllForOffice(mockOfficeId)).rejects.toThrow(NotFoundException);
      expect(prisma.jobPosition.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a mapped JobPositionResponseDto if found', async () => {
      prisma.jobPosition.findUniqueOrThrow.mockResolvedValue(mockJobPosition);

      const result = await service.findOne(mockJobPositionId);

      expect(prisma.jobPosition.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: mockJobPositionId } });
      expect(result).toEqual(expectedResponseDto);
    });

    it('should throw NotFoundException if job position is not found (P2025)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Not Found', { code: 'P2025', clientVersion: 'x.y.z' });
      prisma.jobPosition.findUniqueOrThrow.mockRejectedValue(prismaError);

      await expect(service.findOne(mockJobPositionId)).rejects.toThrow(NotFoundException);
      expect(prisma.jobPosition.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: mockJobPositionId } });
    });
  });

  describe('update', () => {
    const updatedJobPositionData = { ...mockJobPosition, ...mockUpdateDto };
    const expectedUpdatedDto: JobPositionResponseDto = { ...expectedResponseDto, color: mockUpdateDto.color! };

    it('should update a job position and return mapped DTO', async () => {
      prisma.jobPosition.findUniqueOrThrow.mockResolvedValue(mockJobPosition);
      prisma.jobPosition.update.mockResolvedValue(updatedJobPositionData);

      const result = await service.update(mockJobPositionId, mockUpdateDto);

      expect(prisma.jobPosition.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: mockJobPositionId } });
      expect(prisma.jobPosition.count).not.toHaveBeenCalled();
      expect(prisma.jobPosition.update).toHaveBeenCalledWith({
        where: { id: mockJobPositionId },
        data: mockUpdateDto,
      });
      expect(result).toEqual(expectedUpdatedDto);
    });

     it('should validate unique name if name is changed', async () => {
        const updateWithNameDto: UpdateJobPositionDto = { name: 'New Unique Name', color: '#112233' };
        const finalUpdatedData = { ...mockJobPosition, ...updateWithNameDto };
        const finalExpectedDto = { ...expectedResponseDto, ...updateWithNameDto };

        prisma.jobPosition.findUniqueOrThrow.mockResolvedValue(mockJobPosition);
        prisma.jobPosition.count.mockResolvedValue(0);
        prisma.jobPosition.update.mockResolvedValue(finalUpdatedData);

        const result = await service.update(mockJobPositionId, updateWithNameDto);

        expect(prisma.jobPosition.findUniqueOrThrow).toHaveBeenCalledTimes(1);
        expect(prisma.jobPosition.count).toHaveBeenCalledWith({
            where: {
                name: updateWithNameDto.name,
                officeId: mockOfficeId,
                id: { not: mockJobPositionId }
            }
        });
        expect(prisma.jobPosition.update).toHaveBeenCalledWith({
            where: { id: mockJobPositionId },
            data: updateWithNameDto,
        });
        expect(result).toEqual(finalExpectedDto);
     });

    it('should throw NotFoundException if job position to update is not found', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Not Found', { code: 'P2025', clientVersion: 'x.y.z' });
      prisma.jobPosition.findUniqueOrThrow.mockRejectedValue(prismaError);

      await expect(service.update(mockJobPositionId, mockUpdateDto)).rejects.toThrow(NotFoundException);
      expect(prisma.jobPosition.count).not.toHaveBeenCalled();
      expect(prisma.jobPosition.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if name conflicts during update (explicit check)', async () => {
        const updateWithNameDto: UpdateJobPositionDto = { name: 'Existing Name' };
        prisma.jobPosition.findUniqueOrThrow.mockResolvedValue(mockJobPosition);
        prisma.jobPosition.count.mockResolvedValue(1);

        await expect(service.update(mockJobPositionId, updateWithNameDto)).rejects.toThrow(ConflictException);
        expect(prisma.jobPosition.count).toHaveBeenCalledTimes(1);
        expect(prisma.jobPosition.update).not.toHaveBeenCalled();
    });

     it('should throw ConflictException if name conflicts during update (Prisma P2002)', async () => {
        const updateWithNameDto: UpdateJobPositionDto = { name: 'Existing Name' };
        const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'x.y.z', meta: { target: ['JobPosition_name_officeId_key'] } });
        prisma.jobPosition.findUniqueOrThrow.mockResolvedValue(mockJobPosition);
        prisma.jobPosition.count.mockResolvedValue(0);
        prisma.jobPosition.update.mockRejectedValue(prismaError);

        await expect(service.update(mockJobPositionId, updateWithNameDto)).rejects.toThrow(ConflictException);
        expect(prisma.jobPosition.update).toHaveBeenCalledTimes(1);
     });
  });

  describe('remove', () => {
    it('should remove a job position successfully', async () => {
      prisma.jobPosition.findUniqueOrThrow.mockResolvedValue(mockJobPosition);
      prisma.jobPosition.delete.mockResolvedValue(mockJobPosition);

      await service.remove(mockJobPositionId);

      expect(prisma.jobPosition.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: mockJobPositionId } });
      expect(prisma.jobPosition.delete).toHaveBeenCalledWith({ where: { id: mockJobPositionId } });
    });

    it('should throw NotFoundException if job position to remove is not found', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Not Found', { code: 'P2025', clientVersion: 'x.y.z' });
      prisma.jobPosition.findUniqueOrThrow.mockRejectedValue(prismaError);

      await expect(service.remove(mockJobPositionId)).rejects.toThrow(NotFoundException);
      expect(prisma.jobPosition.delete).not.toHaveBeenCalled();
    });

    it('should throw ConflictException on P2003 error (FK constraint)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('FK constraint failed', { code: 'P2003', clientVersion: 'x.y.z' });
      prisma.jobPosition.findUniqueOrThrow.mockResolvedValue(mockJobPosition);
      prisma.jobPosition.delete.mockRejectedValue(prismaError);

      await expect(service.remove(mockJobPositionId)).rejects.toThrow(ConflictException);
      expect(prisma.jobPosition.delete).toHaveBeenCalledTimes(1);
    });
  });
});
