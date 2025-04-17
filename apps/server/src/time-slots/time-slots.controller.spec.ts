import { Test, TestingModule } from '@nestjs/testing';
import { TimeSlotsController } from './time-slots.controller';
import { TimeSlotsService } from './time-slots.service';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { TimeSlotResponseDto } from './dto/time-slot-response.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const mockTimeSlotsService = {
  create: jest.fn(),
  findAllForOffice: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  removeAllForOffice: jest.fn(),
};

const mockOfficeId = 'office-uuid-111';
const mockTimeSlotId = 'timeslot-uuid-222';
const mockDate = new Date();

const mockResponseDto: TimeSlotResponseDto = {
  id: mockTimeSlotId,
  startTime: '10:00:00',
  endTime: '11:00:00',
  officeId: mockOfficeId,
  createdAt: mockDate,
  updatedAt: mockDate,
};

const mockCreateDto: CreateTimeSlotDto = {
  startTime: '14:00:00',
  endTime: '15:00:00',
};

const mockUpdateDto: UpdateTimeSlotDto = {
  endTime: '15:30:00',
};

describe('TimeSlotsController', () => {
  let controller: TimeSlotsController;
  let service: TimeSlotsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeSlotsController],
      providers: [
        {
          provide: TimeSlotsService,
          useValue: mockTimeSlotsService,
        },
      ],
    }).compile();

    controller = module.get<TimeSlotsController>(TimeSlotsController);
    service = module.get<TimeSlotsService>(TimeSlotsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call timeSlotsService.create and return the result', async () => {
      mockTimeSlotsService.create.mockResolvedValue(mockResponseDto);

      const result = await controller.create(mockOfficeId, mockCreateDto);

      expect(service.create).toHaveBeenCalledWith(mockOfficeId, mockCreateDto);
      expect(result).toEqual(mockResponseDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should propagate exceptions from the service (e.g., Conflict)', async () => {
      const error = new ConflictException('Overlap detected');
      mockTimeSlotsService.create.mockRejectedValue(error);

      await expect(
        controller.create(mockOfficeId, mockCreateDto),
      ).rejects.toThrow(ConflictException);
      expect(service.create).toHaveBeenCalledWith(mockOfficeId, mockCreateDto);
    });
  });

  describe('findAllForOffice', () => {
    it('should call timeSlotsService.findAllForOffice and return the result', async () => {
      const responseArray = [mockResponseDto];
      mockTimeSlotsService.findAllForOffice.mockResolvedValue(responseArray);

      const result = await controller.findAllForOffice(mockOfficeId);

      expect(service.findAllForOffice).toHaveBeenCalledWith(mockOfficeId);
      expect(result).toEqual(responseArray);
      expect(service.findAllForOffice).toHaveBeenCalledTimes(1);
    });

    it('should propagate NotFoundException if office is not found', async () => {
      const error = new NotFoundException('Office not found');
      mockTimeSlotsService.findAllForOffice.mockRejectedValue(error);

      await expect(controller.findAllForOffice(mockOfficeId)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findAllForOffice).toHaveBeenCalledWith(mockOfficeId);
    });
  });

  describe('update', () => {
    it('should call timeSlotsService.update and return the result', async () => {
      const updatedResponse = { ...mockResponseDto, endTime: '15:30:00' };
      mockTimeSlotsService.update.mockResolvedValue(updatedResponse);

      const result = await controller.update(mockTimeSlotId, mockUpdateDto);

      expect(service.update).toHaveBeenCalledWith(
        mockTimeSlotId,
        mockUpdateDto,
      );
      expect(result).toEqual(updatedResponse);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should propagate NotFoundException from the service', async () => {
      const error = new NotFoundException('Timeslot not found');
      mockTimeSlotsService.update.mockRejectedValue(error);

      await expect(
        controller.update(mockTimeSlotId, mockUpdateDto),
      ).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(
        mockTimeSlotId,
        mockUpdateDto,
      );
    });

    it('should propagate ConflictException from the service', async () => {
      const error = new ConflictException('Overlap detected');
      mockTimeSlotsService.update.mockRejectedValue(error);

      await expect(
        controller.update(mockTimeSlotId, mockUpdateDto),
      ).rejects.toThrow(ConflictException);
      expect(service.update).toHaveBeenCalledWith(
        mockTimeSlotId,
        mockUpdateDto,
      );
    });
  });

  describe('remove', () => {
    it('should call timeSlotsService.remove and return void', async () => {
      mockTimeSlotsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockTimeSlotId);

      expect(service.remove).toHaveBeenCalledWith(mockTimeSlotId);
      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should propagate NotFoundException from the service', async () => {
      const error = new NotFoundException('Timeslot not found');
      mockTimeSlotsService.remove.mockRejectedValue(error);

      await expect(controller.remove(mockTimeSlotId)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.remove).toHaveBeenCalledWith(mockTimeSlotId);
    });
  });

  describe('removeAllForOffice', () => {
    it('should call timeSlotsService.removeAllForOffice and return void', async () => {
      mockTimeSlotsService.removeAllForOffice.mockResolvedValue({
        deletedCount: 5,
      });

      const result = await controller.removeAllForOffice(mockOfficeId);

      expect(service.removeAllForOffice).toHaveBeenCalledWith(mockOfficeId);
      expect(result).toBeUndefined();
      expect(service.removeAllForOffice).toHaveBeenCalledTimes(1);
    });

    it('should propagate NotFoundException if office is not found', async () => {
      const error = new NotFoundException('Office not found');
      mockTimeSlotsService.removeAllForOffice.mockRejectedValue(error);

      await expect(controller.removeAllForOffice(mockOfficeId)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.removeAllForOffice).toHaveBeenCalledWith(mockOfficeId);
    });
  });
});
