import { BadRequestException } from '@nestjs/common';
import { TrainersService } from './trainers.module';

function makeTrainerPrisma() {
  const tx: any = {
    memberPtContract: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    ptSessionLog: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
    trainer: {
      findUnique: jest.fn(),
    },
    salaryRequest: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  return {
    runWithAdvisoryLock: jest.fn(async (_k, fn) => fn(tx)),
    logAudit: jest.fn().mockResolvedValue(undefined),
    trainer: tx.trainer,
    salaryRequest: tx.salaryRequest,
    tx,
  } as any;
}

describe('TrainersService state machines & sign-off', () => {
  it('rejects signOffSession for expired PT contracts', async () => {
    const prisma = makeTrainerPrisma();
    prisma.tx.memberPtContract.findUnique.mockResolvedValue({
      id: 'c-1',
      memberId: 'm-1',
      trainerId: 't-1',
      status: 'ACTIVE',
      remainingSessions: 5,
      expiryDate: new Date('2020-01-01T00:00:00Z'),
      trainer: { fullName: 'Coach Riko' },
    });

    const service = new TrainersService(prisma);
    await expect(
      service.signOffSession({ contractId: 'c-1', musclesTrained: 'Chest' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('transitions contract to COMPLETED on final session sign-off', async () => {
    const prisma = makeTrainerPrisma();
    prisma.tx.memberPtContract.findUnique
      .mockResolvedValueOnce({
        id: 'c-1',
        memberId: 'm-1',
        trainerId: 't-1',
        status: 'ACTIVE',
        remainingSessions: 1,
        expiryDate: new Date(Date.now() + 86400000),
        trainer: { fullName: 'Coach Riko' },
      })
      .mockResolvedValueOnce({ id: 'c-1', status: 'COMPLETED', remainingSessions: 0 });
    prisma.tx.memberPtContract.updateMany.mockResolvedValue({ count: 1 });
    prisma.tx.ptSessionLog.create.mockResolvedValue({ id: 'log-1' });

    const service = new TrainersService(prisma);
    const res = await service.signOffSession({ contractId: 'c-1', musclesTrained: 'Legs' });

    expect(res.updatedContract.status).toBe('COMPLETED');
    expect(prisma.tx.memberPtContract.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c-1', status: 'ACTIVE', remainingSessions: { gt: 0 } },
        data: { remainingSessions: { decrement: 1 }, status: 'COMPLETED' },
      }),
    );
  });

  it('rejects duplicate salary requests for same monthYear and blocks PAID -> PENDING reversal', async () => {
    const prisma = makeTrainerPrisma();
    prisma.trainer.findUnique.mockResolvedValue({
      id: 't-1',
      ptContracts: [],
      ptSessionLogs: [],
    });
    prisma.salaryRequest.findFirst.mockResolvedValue({ id: 'sr-1', status: 'PENDING' });

    const service = new TrainersService(prisma);
    await expect(
      service.createSalaryRequest({ trainerId: 't-1', monthYear: '2026-11' }),
    ).rejects.toThrow(BadRequestException);

    prisma.tx.salaryRequest.findUnique.mockResolvedValue({ id: 'sr-1', status: 'PAID' });
    await expect(
      service.updateSalaryRequestStatus('sr-1', { status: 'PENDING' }),
    ).rejects.toThrow(BadRequestException);
  });
});
