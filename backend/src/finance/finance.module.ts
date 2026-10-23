import { Body, Controller, Get, Injectable, Module, NotFoundException, Param, Post } from '@nestjs/common';
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

  async getAnalyticsAndReports() {
    const [transactions, expenses, members, auditLogs, announcements] = await Promise.all([
      this.prisma.posTransaction.findMany({
        where: { paymentStatus: { not: 'VOID' } },
        include: { items: true, member: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.expense.findMany(),
      this.prisma.member.findMany(),
      this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.announcement.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
    ]);

    const totalRevenue = transactions.reduce((s, t) => s + t.grandTotal, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    let membershipRevenue = 0;
    let ptRevenue = 0;
    let retailRevenue = 0;

    for (const t of transactions) {
      for (const item of t.items) {
        if (item.itemType === 'MEMBERSHIP' || item.itemType === 'DAILY_PASS') {
          membershipRevenue += item.totalPrice;
        } else if (item.itemType === 'PT_PACKAGE') {
          ptRevenue += item.totalPrice;
        } else {
          retailRevenue += item.totalPrice;
        }
      }
    }

    const paymentBreakdown: Record<string, number> = {};
    for (const t of transactions) {
      paymentBreakdown[t.paymentMethod] = (paymentBreakdown[t.paymentMethod] || 0) + t.grandTotal;
    }

    const memberStats = {
      total: members.length,
      active: members.filter((m) => m.status === 'ACTIVE').length,
      inactive: members.filter((m) => m.status === 'INACTIVE').length,
      cuti: members.filter((m) => m.status === 'CUTI').length,
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
        transactionCount: transactions.length,
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
  getAnalytics() {
    return this.financeService.getAnalyticsAndReports();
  }
}

@Module({
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
