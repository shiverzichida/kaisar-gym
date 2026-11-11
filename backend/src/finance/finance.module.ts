import { Body, Controller, Get, Injectable, Module, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    const existing = await this.prisma.cashierShift.findFirst({ where: { status: 'OPEN' } });
    if (existing) return existing;

    const floatVal = Number(body.startingCashFloat || 500000);
    return this.prisma.cashierShift.create({
      data: {
        cashierName: body.cashierName || 'Kasir Front Desk',
        startingCashFloat: floatVal,
        expectedEndingCash: floatVal,
        status: 'OPEN',
        notes: body.notes || 'Pembukaan Shift Baru',
      },
    });
  }

  async closeShift(id: string, body: { actualEndingCash: number; notes?: string }) {
    return this.prisma.cashierShift.update({
      where: { id },
      data: {
        endTime: new Date(),
        actualEndingCash: Number(body.actualEndingCash),
        status: 'CLOSED',
        notes: body.notes || 'Closing Shift Harian',
      },
    });
  }

  async addExpense(body: { category: string; description: string; amount: number; recordedBy: string }) {
    const activeShift = await this.prisma.cashierShift.findFirst({ where: { status: 'OPEN' } });
    const amount = Number(body.amount);

    const expense = await this.prisma.expense.create({
      data: {
        shiftId: activeShift?.id || null,
        category: body.category || 'OPERASIONAL',
        description: body.description,
        amount,
        recordedBy: body.recordedBy || 'Kasir Front Desk',
      },
    });

    if (activeShift) {
      await this.prisma.cashierShift.update({
        where: { id: activeShift.id },
        data: {
          totalExpenseOut: { increment: amount },
          expectedEndingCash: { decrement: amount },
        },
      });
    }

    return expense;
  }

  async adjustProductStockOpname(productId: string, body: { newStock: number; notes: string; recordedBy?: string }) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');

    const diff = Number(body.newStock) - product.stock;
    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { stock: Number(body.newStock) },
    });

    await this.prisma.stockLog.create({
      data: {
        productId,
        changeQty: diff,
        finalStock: Number(body.newStock),
        type: 'OPNAME',
        notes: body.notes || 'Penyesuaian Stock Opname Manual',
        recordedBy: body.recordedBy || 'Admin Inventory',
      },
    });

    return updated;
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

    // 10.2 Peak Hours Heatmap (Jam Sibuk Gym)
    const peakHoursHeatmap = [
      { hour: '06:00', visitors: 14, label: 'Pagi Awal' },
      { hour: '08:00', visitors: 28, label: 'Pagi Ramai' },
      { hour: '10:00', visitors: 19, label: 'Menjelang Siang' },
      { hour: '12:00', visitors: 15, label: 'Istirahat Siang' },
      { hour: '15:00', visitors: 22, label: 'Sore' },
      { hour: '17:00', visitors: 46, label: 'Peak Pulang Kantor' },
      { hour: '19:00', visitors: 58, label: 'Peak Utama Malam' },
      { hour: '21:00', visitors: 24, label: 'Penutupan' },
    ];

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
