import { Test, TestingModule } from '@nestjs/testing';
import { JobPositionsController } from './job-positions.controller';
import { JobPositionsService } from './job-positions.service';
import { CreateJobPositionDto } from './dto/create-job-position.dto';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { JobPositionResponseDto } from './dto/job-position-response.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const mockJobPositionsService = {
  create: jest.fn(),
  findAllForOffice: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockOfficeId = 'office-uuid-111';
const mockJobPositionId = 'job-uuid-333';
const mockDate = new Date();

const mockResponseDto: JobPositionResponseDto = {
  id: mockJobPositionId,
  name: 'Puesto Test',
  color: '#ABCDEF',
  officeId: mockOfficeId,
  createdAt: mockDate,
  updatedAt: mockDate,
};

const mockCreateDto: CreateJobPositionDto = {
  name: 'Nuevo Puesto',
  color: '#123456',
};

const mockUpdateDto: UpdateJobPositionDto = {
  color: '#654321',
};

describe('JobPositionsController', () => {
  let controller: JobPositionsController;
  let service: JobPositionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobPositionsController],
      providers: [
        {
          provide: JobPositionsService,
          useValue: mockJobPositionsService,
        },
      ],
    }).compile();

    controller = module.get<JobPositionsController>(JobPositionsController);
    service = module.get<JobPositionsService>(JobPositionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call jobPositionsService.create and return the result', async () => {
      mockJobPositionsService.create.mockResolvedValue(mockResponseDto);

      const result = await controller.create(mockOfficeId, mockCreateDto);

      expect(service.create).toHaveBeenCalledWith(mockOfficeId, mockCreateDto);
      expect(result).toEqual(mockResponseDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should propagate NotFoundException from service', async () => {
      const error = new NotFoundException('Office not found');
      mockJobPositionsService.create.mockRejectedValue(error);

      await expect(controller.create(mockOfficeId, mockCreateDto)).rejects.toThrow(NotFoundException);
      expect(service.create).toHaveBeenCalledWith(mockOfficeId, mockCreateDto);
    });

     it('should propagate ConflictException from service', async () => {
      const error = new ConflictException('Name conflict');
      mockJobPositionsService.create.mockRejectedValue(error);

      await expect(controller.create(mockOfficeId, mockCreateDto)).rejects.toThrow(ConflictException);
      expect(service.create).toHaveBeenCalledWith(mockOfficeId, mockCreateDto);
    });
  });

  describe('findAllForOffice', () => {
    it('should call jobPositionsService.findAllForOffice and return the result', async () => {
      const responseArray = [mockResponseDto];
      mockJobPositionsService.findAllForOffice.mockResolvedValue(responseArray);

      const result = await controller.findAllForOffice(mockOfficeId);

      expect(service.findAllForOffice).toHaveBeenCalledWith(mockOfficeId);
      expect(result).toEqual(responseArray);
      expect(service.findAllForOffice).toHaveBeenCalledTimes(1);
    });

     it('should propagate NotFoundException if office not found', async () => {
        const error = new NotFoundException('Office not found');
        mockJobPositionsService.findAllForOffice.mockRejectedValue(error);

        await expect(controller.findAllForOffice(mockOfficeId)).rejects.toThrow(NotFoundException);
        expect(service.findAllForOffice).toHaveBeenCalledWith(mockOfficeId);
     });
  });

  describe('update', () => {
    it('should call jobPositionsService.update and return the result', async () => {
      const updatedResponse = { ...mockResponseDto, color: mockUpdateDto.color! };
      mockJobPositionsService.update.mockResolvedValue(updatedResponse);

      const result = await controller.update(mockJobPositionId, mockUpdateDto);

      expect(service.update).toHaveBeenCalledWith(mockJobPositionId, mockUpdateDto);
      expect(result).toEqual(updatedResponse);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should propagate NotFoundException from service', async () => {
      const error = new NotFoundException('Job position not found');
      mockJobPositionsService.update.mockRejectedValue(error);

      await expect(controller.update(mockJobPositionId, mockUpdateDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(mockJobPositionId, mockUpdateDto);
    });

     it('should propagate ConflictException from service', async () => {
      const error = new ConflictException('Name conflict');
      mockJobPositionsService.update.mockRejectedValue(error);

      await expect(controller.update(mockJobPositionId, mockUpdateDto)).rejects.toThrow(ConflictException);
      expect(service.update).toHaveBeenCalledWith(mockJobPositionId, mockUpdateDto);
    });
  });

  describe('remove', () => {
    it('should call jobPositionsService.remove and return void', async () => {
      mockJobPositionsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockJobPositionId);

      expect(service.remove).toHaveBeenCalledWith(mockJobPositionId);
      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should propagate NotFoundException from service', async () => {
      const error = new NotFoundException('Job position not found');
      mockJobPositionsService.remove.mockRejectedValue(error);

      await expect(controller.remove(mockJobPositionId)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(mockJobPositionId);
    });

     it('should propagate ConflictException from service', async () => {
      const error = new ConflictException('Cannot delete due to FK');
      mockJobPositionsService.remove.mockRejectedValue(error);

      await expect(controller.remove(mockJobPositionId)).rejects.toThrow(ConflictException);
      expect(service.remove).toHaveBeenCalledWith(mockJobPositionId);
    });
  });
});
