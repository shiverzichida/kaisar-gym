import { BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Post, Put, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketingService {
  constructor(private prisma: PrismaService) {}

  async listVouchers() {
    return this.prisma.promoVoucher.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createVoucher(body: any) {
    const code = String(body?.code || '').trim().toUpperCase();
    if (!code) throw new BadRequestException('Kode voucher wajib diisi');

    const existing = await this.prisma.promoVoucher.findUnique({ where: { code } });
    if (existing) throw new BadRequestException(`Kode voucher "${code}" sudah terdaftar`);

    const discountValue = Number(body?.discountValue ?? 0);
    const minPurchase = Number(body?.minPurchase ?? 0);
    const maxQuota = Number(body?.maxQuota ?? 100);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      throw new BadRequestException('Nilai diskon harus lebih besar dari 0');
    }
    if (!Number.isFinite(minPurchase) || minPurchase < 0 || !Number.isInteger(maxQuota) || maxQuota <= 0) {
      throw new BadRequestException('Minimal belanja dan kuota tidak valid');
    }

    return this.prisma.promoVoucher.create({
      data: {
        code,
        description: String(body?.description || body?.title || code).trim(),
        discountType: body?.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        discountValue,
        minPurchase,
        maxQuota,
        validUntil: body?.validUntil ? new Date(body.validUntil) : null,
        isActive: body?.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });
  }

  async updateVoucher(id: string, body: any) {
    const existing = await this.prisma.promoVoucher.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Voucher tidak ditemukan');

    const data: any = {};
    if (body.code !== undefined) data.code = String(body.code).trim().toUpperCase();
    if (body.description !== undefined || body.title !== undefined) {
      data.description = String(body.description ?? body.title).trim();
    }
    if (body.discountType !== undefined) data.discountType = body.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
    if (body.discountValue !== undefined) data.discountValue = Math.max(1, Number(body.discountValue));
    if (body.minPurchase !== undefined) data.minPurchase = Math.max(0, Number(body.minPurchase));
    if (body.maxQuota !== undefined) data.maxQuota = Math.max(1, Number(body.maxQuota));
    if (body.validUntil !== undefined) data.validUntil = body.validUntil ? new Date(body.validUntil) : null;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    return this.prisma.promoVoucher.update({ where: { id }, data });
  }

  async deleteVoucher(id: string) {
    const existing = await this.prisma.promoVoucher.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Voucher tidak ditemukan');
    await this.prisma.promoVoucher.delete({ where: { id } });
    return { success: true };
  }

  async listAnnouncements() {
    return this.prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createAnnouncement(body: any) {
    const title = String(body?.title || '').trim();
    const content = String(body?.content || '').trim();
    if (!title || !content) throw new BadRequestException('Judul dan isi pengumuman wajib diisi');

    return this.prisma.announcement.create({
      data: {
        title,
        content,
        category: body?.category || 'INFO',
        isActive: body?.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });
  }

  async updateAnnouncement(id: string, body: any) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pengumuman tidak ditemukan');
    const data: any = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.content !== undefined) data.content = String(body.content).trim();
    if (body.category !== undefined) data.category = body.category;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    return this.prisma.announcement.update({ where: { id }, data });
  }

  async deleteAnnouncement(id: string) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pengumuman tidak ditemukan');
    await this.prisma.announcement.delete({ where: { id } });
    return { success: true };
  }

  async getExpiringReminders(daysAhead = 7) {
    const clampedDays = Math.min(Math.max(1, Number(daysAhead) || 7), 30);
    const now = new Date();
    const pastWindow = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const futureWindow = new Date(now.getTime() + clampedDays * 24 * 60 * 60 * 1000);

    const subs = await this.prisma.memberSubscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'EXPIRED'] },
        endDate: { gte: pastWindow, lte: futureWindow },
      },
      include: {
        member: {
          select: { id: true, memberCode: true, fullName: true, phone: true, status: true },
        },
        package: { select: { id: true, name: true, normalPrice: true, promoPrice: true } },
      },
      orderBy: { endDate: 'asc' },
    });

    const seen = new Set<string>();
    const results = [];
    for (const sub of subs) {
      if (!sub.member || seen.has(sub.member.id)) continue;
      seen.add(sub.member.id);
      const diffDays = Math.ceil((new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      results.push({
        memberId: sub.member.id,
        memberCode: sub.member.memberCode,
        fullName: sub.member.fullName,
        phone: sub.member.phone,
        memberStatus: sub.member.status,
        packageName: sub.package?.name || 'Membership',
        packagePrice: sub.package?.promoPrice ?? sub.package?.normalPrice ?? 0,
        endDate: sub.endDate,
        daysRemaining: diffDays,
        urgency: diffDays < 0 ? 'EXPIRED' : diffDays <= 3 ? 'H3' : 'H7',
      });
    }
    return results;
  }
}

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('vouchers')
  listVouchers() {
    return this.marketingService.listVouchers();
  }

  @Post('vouchers')
  createVoucher(@Body() body: any) {
    return this.marketingService.createVoucher(body);
  }

  @Put('vouchers/:id')
  updateVoucher(@Param('id') id: string, @Body() body: any) {
    return this.marketingService.updateVoucher(id, body);
  }

  @Delete('vouchers/:id')
  deleteVoucher(@Param('id') id: string) {
    return this.marketingService.deleteVoucher(id);
  }

  @Get('announcements')
  listAnnouncements() {
    return this.marketingService.listAnnouncements();
  }

  @Post('announcements')
  createAnnouncement(@Body() body: any) {
    return this.marketingService.createAnnouncement(body);
  }

  @Put('announcements/:id')
  updateAnnouncement(@Param('id') id: string, @Body() body: any) {
    return this.marketingService.updateAnnouncement(id, body);
  }

  @Delete('announcements/:id')
  deleteAnnouncement(@Param('id') id: string) {
    return this.marketingService.deleteAnnouncement(id);
  }

  @Get('expiring-reminders')
  getExpiringReminders(@Query('days') days?: string) {
    return this.marketingService.getExpiringReminders(days ? Number(days) : 7);
  }
}

@Module({
  controllers: [MarketingController],
  providers: [MarketingService],
})
export class MarketingModule {}
