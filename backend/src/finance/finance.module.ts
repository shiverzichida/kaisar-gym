import { BadRequestException, Body, Controller, Get, Injectable, Module, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getJakartaHour } from '../common/jakarta-time';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getShiftAndExpenses() {
    const [activeShift, shiftsHistory, expenses, products, packages, ptPackages] = await Promise.all([
      this.prisma.cashierShift.findFirst({ where: { status: 'OPEN' }, include: { transactions: true, expenses: true } }),
      this.prisma.cashierShift.findMany({ orderBy: { startTime: 'desc' }, take: 15 }),
      this.prisma.expense.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
      this.prisma.product.findMany({ include: { stockLogs: { orderBy: { createdAt: 'desc' }, take: 5 } }, orderBy: { name: 'asc' } }),
      this.prisma.membershipPackage.findMany({ orderBy: { durationDays: 'asc' } }),
      this.prisma.ptPackage.findMany({ orderBy: { sessionCount: 'asc' } }),
    ]);

    return { activeShift, shiftsHistory, expenses, products, packages, ptPackages };
  }

  async openShift(body: { cashierName: string; startingCashFloat: number; notes?: string }) {
    return this.prisma.runWithAdvisoryLock(88002, async (tx) => {
      const existing = await tx.cashierShift.findFirst({ where: { status: 'OPEN' } });
      if (existing) return existing;

      const floatVal = Number(body.startingCashFloat ?? 500000);
      if (!Number.isFinite(floatVal) || floatVal < 0) {
        throw new BadRequestException('Modal awal shift tidak valid');
      }

      return tx.cashierShift.create({
        data: {
          cashierName: body.cashierName || 'Kasir Front Desk',
          startingCashFloat: floatVal,
          expectedEndingCash: floatVal,
          status: 'OPEN',
          notes: body.notes || 'Pembukaan Shift Baru',
        },
      });
    });
  }

  async closeShift(id: string, body: { actualEndingCash: number; notes?: string }) {
    const actualCash = Number(body.actualEndingCash);
    if (!Number.isFinite(actualCash) || actualCash < 0) {
      throw new BadRequestException('Nominal kas fisik akhir shift tidak valid');
    }

    return this.prisma.runWithAdvisoryLock(88002, async (tx) => {
      const existing = await tx.cashierShift.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Shift kasir tidak ditemukan');
      if (existing.status !== 'OPEN') {
        throw new BadRequestException('Shift kasir ini sudah ditutup sebelumnya');
      }

      return tx.cashierShift.update({
        where: { id },
        data: {
          endTime: new Date(),
          actualEndingCash: actualCash,
          status: 'CLOSED',
          notes: body.notes || 'Closing Shift Harian',
        },
      });
    });
  }

  async addExpense(body: { category: string; description: string; amount: number; recordedBy: string }) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Nominal pengeluaran harus lebih besar dari 0');
    }

    return this.prisma.runWithAdvisoryLock(88002, async (tx) => {
      const activeShift = await tx.cashierShift.findFirst({
        where: { status: 'OPEN' },
        orderBy: { startTime: 'desc' },
      });

      const expense = await tx.expense.create({
        data: {
          shiftId: activeShift?.id || null,
          category: body.category || 'OPERASIONAL',
          description: body.description,
          amount,
          recordedBy: body.recordedBy || 'Kasir Front Desk',
        },
      });

      if (activeShift) {
        await tx.cashierShift.update({
          where: { id: activeShift.id },
          data: {
            totalExpenseOut: { increment: amount },
            expectedEndingCash: { decrement: amount },
          },
        });
      }

      return expense;
    });
  }

  async adjustProductStockOpname(productId: string, body: { newStock: number; notes: string; recordedBy?: string }) {
    const newStock = Number(body.newStock);
    if (!Number.isInteger(newStock) || newStock < 0) {
      throw new BadRequestException('Stok opname baru harus bilangan bulat >= 0');
    }

    return this.prisma.runWithAdvisoryLock(88002, async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new NotFoundException('Produk tidak ditemukan');

      const diff = newStock - product.stock;
      const updated = await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      await tx.stockLog.create({
        data: {
          productId,
          changeQty: diff,
          finalStock: newStock,
          type: 'OPNAME',
          notes: body.notes || 'Penyesuaian Stock Opname Manual',
          recordedBy: body.recordedBy || 'Admin Inventory',
        },
      });

      return updated;
    });
  }

  async createRetailProduct(body: any) {
    return this.prisma.product.create({
      data: {
        sku: body.sku || `PRD-${Date.now().toString().slice(-4)}`,
        name: body.name,
        category: body.category || 'SUPPLEMENT',
        costPrice: Number(body.costPrice || 0),
        sellingPrice: Number(body.sellingPrice || 0),
        stock: Number(body.stock || 0),
        minStockAlert: Number(body.minStockAlert || 5),
      },
    });
  }

  async getAnalyticsAndReports(txLimit?: number) {
    const recentTxLimit = Math.min(Math.max(1, Number(txLimit) || 50), 200);

    const [
      txAgg,
      paymentGroups,
      itemTypeGroups,
      expenseAgg,
      memberGroups,
      auditLogs,
      announcements,
      transactions,
    ] = await Promise.all([
      this.prisma.posTransaction.aggregate({
        where: { paymentStatus: { not: 'VOID' } },
        _sum: { grandTotal: true },
        _count: { _all: true },
      }),
      this.prisma.posTransaction.groupBy({
        by: ['paymentMethod'],
        where: { paymentStatus: { not: 'VOID' } },
        _sum: { grandTotal: true },
      }),
      this.prisma.posTransactionItem.groupBy({
        by: ['itemType'],
        where: { transaction: { paymentStatus: { not: 'VOID' } } },
        _sum: { totalPrice: true },
      }),
      this.prisma.expense.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.member.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.announcement.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.posTransaction.findMany({
        where: { paymentStatus: { not: 'VOID' } },
        include: {
          items: true,
          member: { select: { id: true, memberCode: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: recentTxLimit,
      }),
    ]);

    const totalRevenue = txAgg._sum.grandTotal || 0;
    const totalExpenses = expenseAgg._sum.amount || 0;

    let membershipRevenue = 0;
    let ptRevenue = 0;
    let retailRevenue = 0;

    for (const grp of itemTypeGroups) {
      const val = grp._sum.totalPrice || 0;
      if (grp.itemType === 'MEMBERSHIP' || grp.itemType === 'DAILY_PASS') {
        membershipRevenue += val;
      } else if (grp.itemType === 'PT_PACKAGE') {
        ptRevenue += val;
      } else {
        retailRevenue += val;
      }
    }

    const paymentBreakdown: Record<string, number> = {};
    for (const grp of paymentGroups) {
      paymentBreakdown[grp.paymentMethod] = grp._sum.grandTotal || 0;
    }

    const memberCounts: Record<string, number> = {};
    let totalMembers = 0;
    for (const grp of memberGroups) {
      memberCounts[grp.status] = grp._count._all;
      totalMembers += grp._count._all;
    }

    const memberStats = {
      total: totalMembers,
      active: memberCounts['ACTIVE'] || 0,
      inactive: memberCounts['INACTIVE'] || 0,
      cuti: memberCounts['CUTI'] || 0,
    };

    // 10.2 Peak Hours Heatmap (Jam Sibuk Gym dari data check-in aktual WIB)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const checkInRows = await this.prisma.memberAttendance.findMany({
      where: { gateStatus: 'ALLOWED', checkInTime: { gte: thirtyDaysAgo } },
      select: { checkInTime: true },
    });

    const hourBuckets = [
      { hour: '06:00', min: 6, max: 7, label: 'Pagi Awal', visitors: 0 },
      { hour: '08:00', min: 8, max: 9, label: 'Pagi Ramai', visitors: 0 },
      { hour: '10:00', min: 10, max: 11, label: 'Menjelang Siang', visitors: 0 },
      { hour: '12:00', min: 12, max: 14, label: 'Istirahat Siang', visitors: 0 },
      { hour: '15:00', min: 15, max: 16, label: 'Sore', visitors: 0 },
      { hour: '17:00', min: 17, max: 18, label: 'Peak Pulang Kantor', visitors: 0 },
      { hour: '19:00', min: 19, max: 20, label: 'Peak Utama Malam', visitors: 0 },
      { hour: '21:00', min: 21, max: 23, label: 'Penutupan', visitors: 0 },
    ];
    for (const row of checkInRows) {
      const h = getJakartaHour(new Date(row.checkInTime));
      const bucket = hourBuckets.find((b) => h >= b.min && h <= b.max);
      if (bucket) bucket.visitors++;
    }
    const peakHoursHeatmap = hourBuckets.map(({ hour, visitors, label }) => ({ hour, visitors, label }));

    return {
      summary: {
        totalRevenue,
        totalExpenses,
        netOperatingIncome: totalRevenue - totalExpenses,
        membershipRevenue,
        ptRevenue,
        retailRevenue,
        transactionCount: txAgg._count._all,
      },
      paymentBreakdown,
      memberStats,
      peakHoursHeatmap,
      auditLogs,
      announcements,
      transactions,
    };
  }
}

@Controller('finance')
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get('overview')
  getOverview() {
    return this.financeService.getShiftAndExpenses();
  }

  @Post('shifts/open')
  openShift(@Body() body: any) {
    return this.financeService.openShift(body);
  }

  @Post('shifts/:id/close')
  closeShift(@Param('id') id: string, @Body() body: any) {
    return this.financeService.closeShift(id, body);
  }

  @Post('expenses')
  addExpense(@Body() body: any) {
    return this.financeService.addExpense(body);
  }

  @Post('products')
  createProduct(@Body() body: any) {
    return this.financeService.createRetailProduct(body);
  }

  @Post('products/:id/opname')
  stockOpname(@Param('id') id: string, @Body() body: any) {
    return this.financeService.adjustProductStockOpname(id, body);
  }

  @Get('analytics')
  getAnalytics(@Query('txLimit') txLimit?: string) {
    return this.financeService.getAnalyticsAndReports(txLimit ? Number(txLimit) : undefined);
  }
}

@Module({
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
