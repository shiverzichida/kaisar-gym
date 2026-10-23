import { BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Post, Put } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PosService {
  constructor(private prisma: PrismaService) {}

  async getPosCatalog() {
    const [packages, ptPackages, products, trainers, vouchers, activeShift, recentTransactions] = await Promise.all([
      this.prisma.membershipPackage.findMany({ where: { isActive: true }, orderBy: { normalPrice: 'asc' } }),
      this.prisma.ptPackage.findMany({ where: { isActive: true }, orderBy: { sessionCount: 'asc' } }),
      this.prisma.product.findMany({ where: { isActive: true }, orderBy: { category: 'asc' } }),
      this.prisma.trainer.findMany({ where: { isActive: true } }),
      this.prisma.promoVoucher.findMany({ where: { isActive: true } }),
      this.prisma.cashierShift.findFirst({ where: { status: 'OPEN' }, orderBy: { startTime: 'desc' } }),
      this.prisma.posTransaction.findMany({
        include: { member: true, items: true },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
    ]);

    return { packages, ptPackages, products, trainers, vouchers, activeShift, recentTransactions };
  }

  async checkout(body: {
    memberId?: string;
    guestName?: string;
    cashierName: string;
    salesPerson?: string;
    items: Array<{
      itemType: 'MEMBERSHIP' | 'PT_PACKAGE' | 'RETAIL_PRODUCT' | 'SERVICE_FEE' | 'DAILY_PASS';
      itemId?: string;
      itemName: string;
      qty: number;
      unitPrice: number;
      trainerId?: string;
    }>;
    discountAmount?: number;
    promoCode?: string;
    paymentMethod: string;
    cashAmount?: number;
    nonCashAmount?: number;
    paymentRef?: string;
  }) {
    if (!body.items || body.items.length === 0) {
      throw new BadRequestException('Keranjang belanja masih kosong');
    }

    const subtotal = body.items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
    let discountAmount = Number(body.discountAmount || 0);

    if (body.promoCode) {
      const voucher = await this.prisma.promoVoucher.findUnique({ where: { code: body.promoCode.toUpperCase() } });
      if (voucher && voucher.isActive && voucher.usedCount < voucher.maxQuota && subtotal >= voucher.minPurchase) {
        if (voucher.discountType === 'PERCENTAGE') {
          discountAmount += Math.round((subtotal * voucher.discountValue) / 100);
        } else {
          discountAmount += voucher.discountValue;
        }
      }
    }

    const grandTotal = Math.max(0, subtotal - discountAmount);
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.posTransaction.count();
    const invoiceNumber = `INV-${todayStr}-${String(count + 1).padStart(4, '0')}`;

    const activeShift = await this.prisma.cashierShift.findFirst({ where: { status: 'OPEN' } });

    let cashAmount = Number(body.cashAmount || 0);
    let nonCashAmount = Number(body.nonCashAmount || 0);
    if (body.paymentMethod === 'CASH') {
      cashAmount = cashAmount || grandTotal;
      nonCashAmount = 0;
    } else if (body.paymentMethod !== 'SPLIT' && body.paymentMethod !== 'PARTIAL') {
      cashAmount = 0;
      nonCashAmount = grandTotal;
    }
    const changeAmount = Math.max(0, cashAmount + nonCashAmount - grandTotal);

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.posTransaction.create({
        data: {
          invoiceNumber,
          memberId: body.memberId || null,
          guestName: body.guestName || (body.memberId ? null : 'Tamu Walk-In (Daily Pass)'),
          cashierName: body.cashierName || 'Kasir Front Desk',
          salesPerson: body.salesPerson || null,
          shiftId: activeShift?.id || null,
          subtotal,
          discountAmount,
          promoCode: body.promoCode || null,
          grandTotal,
          paymentMethod: body.paymentMethod,
          cashAmount: Math.min(cashAmount, grandTotal),
          nonCashAmount,
          changeAmount,
          paymentRef: body.paymentRef || null,
          paymentStatus: body.paymentMethod === 'PARTIAL' ? 'PARTIAL' : 'PAID',
          items: {
            create: body.items.map((it) => ({
              itemType: it.itemType,
              itemId: it.itemId || null,
              itemName: it.itemName,
              qty: it.qty,
              unitPrice: it.unitPrice,
              totalPrice: it.qty * it.unitPrice,
              trainerId: it.trainerId || null,
            })),
          },
        },
        include: { items: true, member: true },
      });

      // Process each cart item side-effects
      for (const item of body.items) {
        // 1. Stacked Membership Duration or Pending Activation logic
        if (item.itemType === 'MEMBERSHIP' && body.memberId && item.itemId) {
          const pkg = await tx.membershipPackage.findUnique({ where: { id: item.itemId } });
          if (pkg) {
            const activeSub = await tx.memberSubscription.findFirst({
              where: { memberId: body.memberId, status: 'ACTIVE', endDate: { gt: new Date() } },
              orderBy: { endDate: 'desc' },
            });

            if (activeSub) {
              // Perpanjangan bertumpuk untuk member yang masih aktif
              const startDate = new Date(activeSub.endDate);
              const endDate = new Date(startDate.getTime() + pkg.durationDays * item.qty * 24 * 60 * 60 * 1000);

              await tx.memberSubscription.create({
                data: {
                  memberId: body.memberId,
                  packageId: pkg.id,
                  startDate,
                  endDate,
                  status: 'ACTIVE',
                  invoiceRef: invoiceNumber,
                  notes: 'Perpanjangan Paket (Stacked Duration)',
                },
              });

              await tx.member.update({
                where: { id: body.memberId },
                data: { status: 'ACTIVE', parkingActive: true },
              });
            } else {
              // Pembelian paket baru / member non-aktif -> Menunggu Aktivasi
              const startDate = new Date();
              const endDate = new Date(startDate.getTime() + pkg.durationDays * item.qty * 24 * 60 * 60 * 1000);

              await tx.memberSubscription.create({
                data: {
                  memberId: body.memberId,
                  packageId: pkg.id,
                  startDate,
                  endDate,
                  status: 'PENDING_ACTIVATION',
                  invoiceRef: invoiceNumber,
                  notes: 'Lunas di Kasir POS (Menunggu Aktivasi)',
                },
              });

              await tx.member.update({
                where: { id: body.memberId },
                data: { status: 'PENDING_ACTIVATION', parkingActive: false },
              });
            }
          }
        }

        // 2. PT Package Contract creation
        if (item.itemType === 'PT_PACKAGE' && body.memberId && item.itemId) {
          const ptPkg = await tx.ptPackage.findUnique({ where: { id: item.itemId } });
          const defaultTrainer = await tx.trainer.findFirst({ where: { isActive: true } });
          const assignedTrainerId = item.trainerId || defaultTrainer?.id;

          if (ptPkg && assignedTrainerId) {
            const now = new Date();
            const expiryDate = new Date(now.getTime() + ptPkg.validityDays * 24 * 60 * 60 * 1000);
            const itemNormalPrice = (item.unitPrice || ptPkg.price) * item.qty;
            const discountRatio = subtotal > 0 ? discountAmount / subtotal : 0;
            const itemDiscountPct = Math.min(100, Math.round(discountRatio * 100));
            const itemTotalPrice = Math.max(0, Math.round(itemNormalPrice * (1 - discountRatio)));

            await tx.memberPtContract.create({
              data: {
                memberId: body.memberId,
                trainerId: assignedTrainerId,
                ptPackageId: ptPkg.id,
                totalSessions: ptPkg.sessionCount * item.qty,
                remainingSessions: ptPkg.sessionCount * item.qty,
                normalPrice: itemNormalPrice,
                discountPct: itemDiscountPct,
                totalPrice: itemTotalPrice,
                invoiceRef: invoiceNumber,
                startDate: now,
                expiryDate,
                status: 'ACTIVE',
              },
            });
          }
        }

        // 3. Retail Product Inventory Deduction & Stock Card
        if (item.itemType === 'RETAIL_PRODUCT' && item.itemId) {
          const product = await tx.product.findUnique({ where: { id: item.itemId } });
          if (product) {
            const newStock = Math.max(0, product.stock - item.qty);
            await tx.product.update({
              where: { id: product.id },
              data: { stock: newStock },
            });
            await tx.stockLog.create({
              data: {
                productId: product.id,
                changeQty: -item.qty,
                finalStock: newStock,
                type: 'SALE',
                notes: `Penjualan POS ${invoiceNumber}`,
                recordedBy: body.cashierName,
              },
            });
          }
        }
      }

      // Update Active Shift Totals
      if (activeShift) {
        const netCash = body.paymentMethod === 'CASH' ? grandTotal : body.paymentMethod === 'SPLIT' ? Math.min(cashAmount, grandTotal) : 0;
        const netQris = body.paymentMethod === 'QRIS' ? grandTotal : 0;
        const netEdc =
          body.paymentMethod.startsWith('EDC_')
            ? grandTotal
            : body.paymentMethod === 'SPLIT'
            ? nonCashAmount
            : 0;

        await tx.cashierShift.update({
          where: { id: activeShift.id },
          data: {
            totalCashIn: { increment: netCash },
            totalQrisIn: { increment: netQris },
            totalEdcIn: { increment: netEdc },
            expectedEndingCash: { increment: netCash },
          },
        });
      }

      if (body.promoCode) {
        await tx.promoVoucher.updateMany({
          where: { code: body.promoCode.toUpperCase() },
          data: { usedCount: { increment: 1 } },
        });
      }

      return transaction;
    });

    await this.prisma.logAudit({
      userName: body.cashierName || 'Kasir Front Desk',
      userRole: 'CASHIER',
      action: 'POS_CHECKOUT',
      entityName: 'PosTransaction',
      entityId: result.id,
      afterJson: result,
    });

    return result;
  }

  async voidTransaction(id: string, body: { reason: string; voidedBy: string }) {
    const trx = await this.prisma.posTransaction.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!trx) throw new NotFoundException('Transaksi tidak ditemukan');
    if (trx.paymentStatus === 'VOID') throw new BadRequestException('Transaksi sudah di-void sebelumnya');

    const updated = await this.prisma.$transaction(async (tx) => {
      // Restore retail product stock
      for (const item of trx.items) {
        if (item.itemType === 'RETAIL_PRODUCT' && item.itemId) {
          const prod = await tx.product.findUnique({ where: { id: item.itemId } });
          if (prod) {
            const restored = prod.stock + item.qty;
            await tx.product.update({ where: { id: prod.id }, data: { stock: restored } });
            await tx.stockLog.create({
              data: {
                productId: prod.id,
                changeQty: item.qty,
                finalStock: restored,
                type: 'VOID',
                notes: `Void Nota ${trx.invoiceNumber}: ${body.reason}`,
                recordedBy: body.voidedBy,
              },
            });
          }
        }
      }

      return tx.posTransaction.update({
        where: { id },
        data: {
          paymentStatus: 'VOID',
          voidReason: body.reason,
          voidedBy: body.voidedBy || 'Manager Operasional',
        },
      });
    });

    await this.prisma.logAudit({
      userName: body.voidedBy || 'Manager Operasional',
      userRole: 'OPS_MANAGER',
      action: 'VOID_TRANSACTION',
      entityName: 'PosTransaction',
      entityId: id,
      beforeJson: trx,
      afterJson: updated,
    });

    return updated;
  }

  async getMembershipPackage(id: string) {
    const pkg = await this.prisma.membershipPackage.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundException('Paket membership tidak ditemukan');
    return pkg;
  }

  async getPtPackage(id: string) {
    const pt = await this.prisma.ptPackage.findUnique({ where: { id } });
    if (!pt) throw new NotFoundException('Paket PT tidak ditemukan');
    return pt;
  }

  async getProduct(id: string) {
    const prod = await this.prisma.product.findUnique({ where: { id } });
    if (!prod) throw new NotFoundException('Produk tidak ditemukan');
    return prod;
  }

  // ══════════════ MEMBERSHIP PACKAGES CRUD ══════════════
  async createMembershipPackage(data: any) {
    if (!data.name) throw new BadRequestException('Nama paket wajib diisi');
    const count = await this.prisma.membershipPackage.count();
    const code = data.code || `PKG-${String(count + 1).padStart(3, '0')}`;
    return this.prisma.membershipPackage.create({
      data: {
        code,
        name: data.name,
        category: data.category || 'REGULAR',
        durationDays: Number(data.durationDays || 30),
        normalPrice: Number(data.normalPrice || 0),
        promoPrice: data.promoPrice ? Number(data.promoPrice) : null,
        description: data.description || null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
  }

  async updateMembershipPackage(id: string, data: any) {
    const pkg = await this.prisma.membershipPackage.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundException('Paket membership tidak ditemukan');

    return this.prisma.membershipPackage.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : pkg.name,
        category: data.category !== undefined ? data.category : pkg.category,
        durationDays: data.durationDays !== undefined ? Number(data.durationDays) : pkg.durationDays,
        normalPrice: data.normalPrice !== undefined ? Number(data.normalPrice) : pkg.normalPrice,
        promoPrice: data.promoPrice !== undefined ? (data.promoPrice ? Number(data.promoPrice) : null) : pkg.promoPrice,
        description: data.description !== undefined ? data.description : pkg.description,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : pkg.isActive,
      },
    });
  }

  async deleteMembershipPackage(id: string) {
    const subCount = await this.prisma.memberSubscription.count({ where: { packageId: id } });
    if (subCount > 0) {
      return this.prisma.membershipPackage.update({
        where: { id },
        data: { isActive: false },
      });
    }
    return this.prisma.membershipPackage.delete({ where: { id } });
  }

  // ══════════════ PT PACKAGES CRUD ══════════════
  async createPtPackage(data: any) {
    if (!data.name) throw new BadRequestException('Nama paket PT wajib diisi');
    const count = await this.prisma.ptPackage.count();
    const code = data.code || `PT-${String(count + 1).padStart(3, '0')}`;
    return this.prisma.ptPackage.create({
      data: {
        code,
        name: data.name,
        sessionCount: Number(data.sessionCount || 10),
        validityDays: Number(data.validityDays || 30),
        price: Number(data.price || 0),
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
  }

  async updatePtPackage(id: string, data: any) {
    const pt = await this.prisma.ptPackage.findUnique({ where: { id } });
    if (!pt) throw new NotFoundException('Paket PT tidak ditemukan');

    return this.prisma.ptPackage.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : pt.name,
        sessionCount: data.sessionCount !== undefined ? Number(data.sessionCount) : pt.sessionCount,
        validityDays: data.validityDays !== undefined ? Number(data.validityDays) : pt.validityDays,
        price: data.price !== undefined ? Number(data.price) : pt.price,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : pt.isActive,
      },
    });
  }

  async deletePtPackage(id: string) {
    const contractCount = await this.prisma.memberPtContract.count({ where: { ptPackageId: id } });
    if (contractCount > 0) {
      return this.prisma.ptPackage.update({
        where: { id },
        data: { isActive: false },
      });
    }
    return this.prisma.ptPackage.delete({ where: { id } });
  }

  // ══════════════ RETAIL PRODUCTS / SERVICES CRUD ══════════════
  async createProduct(data: any) {
    if (!data.name) throw new BadRequestException('Nama produk wajib diisi');
    const sku = data.sku || `PRD-${Date.now().toString().slice(-4)}`;
    return this.prisma.product.create({
      data: {
        sku,
        name: data.name,
        category: data.category || 'SUPPLEMENT',
        costPrice: Number(data.costPrice || 0),
        sellingPrice: Number(data.sellingPrice || 0),
        stock: Number(data.stock || 0),
        minStockAlert: Number(data.minStockAlert || 5),
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
  }

  async updateProduct(id: string, data: any) {
    const prod = await this.prisma.product.findUnique({ where: { id } });
    if (!prod) throw new NotFoundException('Produk tidak ditemukan');

    return this.prisma.product.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : prod.name,
        category: data.category !== undefined ? data.category : prod.category,
        costPrice: data.costPrice !== undefined ? Number(data.costPrice) : prod.costPrice,
        sellingPrice: data.sellingPrice !== undefined ? Number(data.sellingPrice) : prod.sellingPrice,
        stock: data.stock !== undefined ? Number(data.stock) : prod.stock,
        minStockAlert: data.minStockAlert !== undefined ? Number(data.minStockAlert) : prod.minStockAlert,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : prod.isActive,
      },
    });
  }

  async deleteProduct(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

@Controller('pos')
export class PosController {
  constructor(private posService: PosService) {}

  @Get('catalog')
  getCatalog() {
    return this.posService.getPosCatalog();
  }

  @Post('checkout')
  checkout(@Body() body: any) {
    return this.posService.checkout(body);
  }

  @Post('transactions/:id/void')
  voidTrx(@Param('id') id: string, @Body() body: { reason: string; voidedBy: string }) {
    return this.posService.voidTransaction(id, body);
  }

  // Membership Packages
  @Get('packages/:id')
  getPackage(@Param('id') id: string) {
    return this.posService.getMembershipPackage(id);
  }

  @Post('packages')
  createPackage(@Body() body: any) {
    return this.posService.createMembershipPackage(body);
  }

  @Put('packages/:id')
  updatePackage(@Param('id') id: string, @Body() body: any) {
    return this.posService.updateMembershipPackage(id, body);
  }

  @Delete('packages/:id')
  deletePackage(@Param('id') id: string) {
    return this.posService.deleteMembershipPackage(id);
  }

  // PT Packages
  @Get('pt-packages/:id')
  getPtPackage(@Param('id') id: string) {
    return this.posService.getPtPackage(id);
  }

  @Post('pt-packages')
  createPtPackage(@Body() body: any) {
    return this.posService.createPtPackage(body);
  }

  @Put('pt-packages/:id')
  updatePtPackage(@Param('id') id: string, @Body() body: any) {
    return this.posService.updatePtPackage(id, body);
  }

  @Delete('pt-packages/:id')
  deletePtPackage(@Param('id') id: string) {
    return this.posService.deletePtPackage(id);
  }

  // Retail Products
  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.posService.getProduct(id);
  }

  @Post('products')
  createProduct(@Body() body: any) {
    return this.posService.createProduct(body);
  }

  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.posService.updateProduct(id, body);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.posService.deleteProduct(id);
  }
}

@Module({
  controllers: [PosController],
  providers: [PosService],
})
export class PosModule {}
