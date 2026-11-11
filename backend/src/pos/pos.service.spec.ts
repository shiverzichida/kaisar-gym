import { BadRequestException } from '@nestjs/common';
import { PosService } from './pos.module';

function makeMockPrisma(overrides: Record<string, any> = {}) {
  const tx: any = {
    membershipPackage: { findUnique: jest.fn() },
    ptPackage: { findUnique: jest.fn() },
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    promoVoucher: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    cashierShift: {
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    posTransaction: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
    },
    memberSubscription: { findFirst: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
    memberPtContract: { create: jest.fn(), updateMany: jest.fn() },
    member: { update: jest.fn() },
    trainer: { findFirst: jest.fn() },
    stockLog: { create: jest.fn() },
    ...overrides,
  };

  const prisma: any = {
    runWithAdvisoryLock: jest.fn(async (_key, fn) => fn(tx)),
    logAudit: jest.fn().mockResolvedValue(undefined),
    tx,
  };
  return prisma;
}

describe('PosService', () => {
  it('rejects empty cart and negative discount', async () => {
    const prisma = makeMockPrisma();
    const service = new PosService(prisma);

    await expect(
      service.checkout({ cashierName: 'Kasir', items: [], paymentMethod: 'CASH' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.checkout({
        cashierName: 'Kasir',
        items: [{ itemType: 'SERVICE_FEE', itemName: 'Locker', qty: 1, unitPrice: 10000 }],
        discountAmount: -5000,
        paymentMethod: 'CASH',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('uses authoritative catalog DB price and ignores tampered client unitPrice', async () => {
    const prisma = makeMockPrisma();
    prisma.tx.membershipPackage.findUnique.mockResolvedValue({
      id: 'pkg-1',
      name: 'Gold 1 Bulan',
      durationDays: 30,
      normalPrice: 500000,
      promoPrice: 400000,
      isActive: true,
    });
    prisma.tx.cashierShift.findFirst.mockResolvedValue({ id: 'shift-1', status: 'OPEN' });
    prisma.tx.posTransaction.findFirst.mockResolvedValue(null);
    prisma.tx.posTransaction.create.mockImplementation(async ({ data }) => ({
      id: 'trx-1',
      ...data,
      items: [],
    }));
    prisma.tx.memberSubscription.findFirst.mockResolvedValue(null);

    const service = new PosService(prisma);
    const res = await service.checkout({
      memberId: 'mem-1',
      cashierName: 'Kasir',
      items: [
        {
          itemType: 'MEMBERSHIP',
          itemId: 'pkg-1',
          itemName: 'Gold 1 Bulan',
          qty: 1,
          unitPrice: 1, // tampered client price
        },
      ],
      paymentMethod: 'CASH',
    });

    expect(res.subtotal).toBe(400000);
    expect(res.grandTotal).toBe(400000);
    expect(prisma.tx.cashierShift.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'shift-1' },
        data: expect.objectContaining({ totalCashIn: { increment: 400000 } }),
      }),
    );
  });

  it('rejects checkout when retail stock updateMany returns count 0 (insufficient stock)', async () => {
    const prisma = makeMockPrisma();
    prisma.tx.product.findUnique
      .mockResolvedValueOnce({ id: 'prd-1', name: 'Whey', sellingPrice: 50000, stock: 1, isActive: true })
      .mockResolvedValueOnce({ id: 'prd-1', name: 'Whey', sellingPrice: 50000, stock: 1, isActive: true });
    prisma.tx.product.updateMany.mockResolvedValue({ count: 0 });
    prisma.tx.posTransaction.create.mockResolvedValue({ id: 'trx-1', invoiceNumber: 'INV-1', items: [] });

    const service = new PosService(prisma);
    await expect(
      service.checkout({
        cashierName: 'Kasir',
        items: [{ itemType: 'RETAIL_PRODUCT', itemId: 'prd-1', itemName: 'Whey', qty: 3, unitPrice: 50000 }],
        paymentMethod: 'CASH',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('voids inside lock, reverses shift & promo usage, and rejects double-void', async () => {
    const prisma = makeMockPrisma();
    prisma.tx.posTransaction.findUnique
      .mockResolvedValueOnce({
        id: 'trx-1',
        invoiceNumber: 'INV-20261111-0001',
        memberId: 'mem-1',
        shiftId: 'shift-1',
        promoCode: 'HEMAT10',
        grandTotal: 100000,
        cashAmount: 100000,
        nonCashAmount: 0,
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        items: [{ itemType: 'RETAIL_PRODUCT', itemId: 'prd-1', qty: 2 }],
      })
      .mockResolvedValueOnce({
        id: 'trx-1',
        invoiceNumber: 'INV-20261111-0001',
        paymentStatus: 'VOID',
        items: [],
      });
    prisma.tx.product.findUnique.mockResolvedValue({ id: 'prd-1', stock: 8 });
    prisma.tx.product.update.mockResolvedValue({ id: 'prd-1', stock: 10 });
    prisma.tx.memberSubscription.findFirst.mockResolvedValue(null);
    prisma.tx.posTransaction.update.mockResolvedValue({ id: 'trx-1', paymentStatus: 'VOID' });

    const service = new PosService(prisma);
    await service.voidTransaction('trx-1', { reason: 'Salah input', voidedBy: 'Manager' });

    expect(prisma.tx.cashierShift.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'shift-1' },
        data: expect.objectContaining({ totalCashIn: { decrement: 100000 } }),
      }),
    );
    expect(prisma.tx.promoVoucher.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { code: 'HEMAT10', usedCount: { gt: 0 } } }),
    );
    expect(prisma.tx.memberSubscription.updateMany).toHaveBeenCalled();

    await expect(
      service.voidTransaction('trx-1', { reason: 'Double void', voidedBy: 'Manager' }),
    ).rejects.toThrow(BadRequestException);
  });
});
