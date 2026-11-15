import { BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.module';

describe('AttendanceService validation', () => {
  const prisma: any = {
    member: { findFirst: jest.fn() },
    staffAttendance: { create: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects empty query on checkInMember', async () => {
    const service = new AttendanceService(prisma);
    await expect(service.checkInMember({ query: '   ' })).rejects.toThrow(BadRequestException);
    expect(prisma.member.findFirst).not.toHaveBeenCalled();
  });

  it('rejects invalid GPS coordinates and empty staffName on clockInStaffSelfie', async () => {
    const service = new AttendanceService(prisma);
    await expect(
      service.clockInStaffSelfie({
        staffName: '  ',
        role: 'STAFF',
        type: 'CLOCK_IN',
        latitude: -6.2,
        longitude: 106.8,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.clockInStaffSelfie({
        staffName: 'Budi',
        role: 'STAFF',
        type: 'CLOCK_IN',
        latitude: 95,
        longitude: 106.8,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.clockInStaffSelfie({
        staffName: 'Budi',
        role: 'STAFF',
        type: 'CLOCK_IN',
        latitude: Number.NaN,
        longitude: 106.8,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
