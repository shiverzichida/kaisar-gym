import { BadRequestException } from '@nestjs/common';
import { ClassesService } from './classes.module';

describe('ClassesService booking & state machine', () => {
  it('blocks booking on CANCELLED schedule and blocks CANCELLED -> ATTENDED transition', async () => {
    const tx: any = {
      classSchedule: { findUnique: jest.fn(), update: jest.fn() },
      classBooking: { findUnique: jest.fn(), findFirst: jest.fn(), count: jest.fn(), update: jest.fn() },
    };
    const prisma: any = {
      runWithAdvisoryLock: jest.fn(async (_k, fn) => fn(tx)),
      classBooking: { findUnique: jest.fn() },
    };
    const service = new ClassesService(prisma);

    tx.classSchedule.findUnique.mockResolvedValueOnce({
      id: 'sched-1',
      status: 'CANCELLED',
      maxCapacity: 10,
    });
    await expect(service.bookClass({ scheduleId: 'sched-1', memberId: 'm-1' })).rejects.toThrow(
      BadRequestException,
    );

    prisma.classBooking.findUnique.mockResolvedValueOnce({ scheduleId: 'sched-1' });
    tx.classBooking.findUnique.mockResolvedValueOnce({ id: 'bk-1', scheduleId: 'sched-1', status: 'CANCELLED' });
    await expect(service.updateBookingStatus('bk-1', 'ATTENDED')).rejects.toThrow(BadRequestException);
  });
});
