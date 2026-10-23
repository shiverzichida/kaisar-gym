import { BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, status?: string) {
    return this.prisma.member.findMany({
      where: {
        AND: [
          status && status !== 'ALL' ? { status } : {},
          search
            ? {
                OR: [
                  { memberCode: { contains: search, mode: 'insensitive' } },
                  { fullName: { contains: search, mode: 'insensitive' } },
                  { phone: { contains: search, mode: 'insensitive' } },
                  { nik: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
      include: {
        groupMembership: true,
        subscriptions: {
          include: { package: true },
          orderBy: { endDate: 'desc' },
        },
        leaves: {
          orderBy: { createdAt: 'desc' },
        },
        ptContracts: {
          include: { trainer: true, ptPackage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const member = await this.prisma.member.findFirst({
      where: {
        OR: [{ id }, { memberCode: id }],
      },
      include: {
        groupMembership: { include: { package: true } },
        subscriptions: {
          include: { package: true },
          orderBy: { endDate: 'desc' },
        },
        leaves: {
          orderBy: { createdAt: 'desc' },
        },
        ptContracts: {
          include: {
            trainer: true,
            ptPackage: true,
            sessionLogs: { orderBy: { sessionDate: 'desc' } },
          },
        },
        classBookings: {
          include: {
            schedule: { include: { studioClass: true, trainer: true } },
          },
          orderBy: { bookedAt: 'desc' },
        },
        transactions: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
        attendances: {
          orderBy: { checkInTime: 'desc' },
          take: 20,
        },
      },
    });
    if (!member) throw new NotFoundException('Member tidak ditemukan');
    return member;
  }

  async generateNextMemberCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.member.count();
    const nextNum = String(count + 1).padStart(4, '0');
    const code = `KG-${year}-${nextNum}`;
    const existing = await this.prisma.member.findUnique({ where: { memberCode: code } });
    if (existing) {
      return `KG-${year}-${String(count + 2).padStart(4, '0')}`;
    }
    return code;
  }

  async createMember(data: any) {
    const memberCode = await this.generateNextMemberCode();
    const passwordHash = await bcrypt.hash('kaisar123', 10);

    const member = await this.prisma.member.create({
      data: {
        memberCode,
        nik: data.nik || null,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        rtRw: data.rtRw || null,
        kecamatan: data.kecamatan || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        gender: data.gender || 'L',
        plateNumber: data.plateNumber || null,
        parkingActive: Boolean(data.plateNumber && data.packageId),
        status: data.packageId ? 'ACTIVE' : 'INACTIVE',
      },
    });

    // Auto-sync Member Portal account (username = memberCode)
    await this.prisma.user.upsert({
      where: { username: memberCode },
      update: { memberId: member.id },
      create: {
        username: memberCode,
        passwordHash,
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        role: 'MEMBER',
        memberId: member.id,
      },
    });

    if (data.packageId) {
      const pkg = await this.prisma.membershipPackage.findUnique({ where: { id: data.packageId } });
      if (pkg) {
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);
        await this.prisma.memberSubscription.create({
          data: {
            memberId: member.id,
            packageId: pkg.id,
            startDate,
            endDate,
            status: 'ACTIVE',
            notes: 'Registrasi Member Baru',
          },
        });
      }
    }

    await this.prisma.logAudit({
      userName: data.actorName || 'Kasir Front Desk',
      userRole: data.actorRole || 'CASHIER',
      action: 'INSERT',
      entityName: 'Member',
      entityId: member.id,
      afterJson: member,
    });

    return this.findOne(member.id);
  }

  async editSubscriptionDates(memberId: string, subId: string, body: { startDate: string; endDate: string; notes?: string; actorName?: string }) {
    const before = await this.prisma.memberSubscription.findUnique({ where: { id: subId } });
    if (!before) throw new NotFoundException('Paket tidak ditemukan');

    const newStart = new Date(body.startDate);
    const newEnd = new Date(body.endDate);
    const now = new Date();
    const isNowActive = newEnd >= now;

    const updated = await this.prisma.memberSubscription.update({
      where: { id: subId },
      data: {
        startDate: newStart,
        endDate: newEnd,
        status: isNowActive ? 'ACTIVE' : 'EXPIRED',
        notes: body.notes || before.notes,
      },
    });

    await this.prisma.member.update({
      where: { id: memberId },
      data: {
        status: isNowActive ? 'ACTIVE' : 'INACTIVE',
        parkingActive: isNowActive,
      },
    });

    await this.prisma.logAudit({
      userName: body.actorName || 'Admin',
      userRole: 'SUPER_ADMIN',
      action: 'UPDATE_PACKAGE_DATE',
      entityName: 'MemberSubscription',
      entityId: subId,
      beforeJson: before,
      afterJson: updated,
    });

    return updated;
  }

  // 3.3 Sistem Cuti Member (Hanya Cuti Terjadwal dengan Tanggal Mulai dan Selesai)
  async addLeave(memberId: string, body: { leaveType?: string; startDate: string; endDate: string; reason?: string; actorName?: string }) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: { subscriptions: { orderBy: { endDate: 'desc' } } },
    });
    if (!member || member.subscriptions.length === 0) {
      throw new BadRequestException('Member belum memiliki riwayat paket untuk cuti');
    }

    const latestSub = member.subscriptions[0];
    const start = new Date(body.startDate);

    // Scheduled or Retroactive Leave
    if (!body.endDate) throw new BadRequestException('Tanggal selesai wajib diisi untuk cuti terjadwal');
    const end = new Date(body.endDate);
    const diffMs = end.getTime() - start.getTime();
    const daysAdded = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const oldEndDate = new Date(latestSub.endDate);
    const newEndDate = new Date(oldEndDate.getTime() + daysAdded * 24 * 60 * 60 * 1000);
    const now = new Date();

    // Retroactive Leave restoration check: if cuti already passed and newEndDate > now, restore to ACTIVE
    const isCurrentlyOnLeave = start <= now && end >= now;
    const newMemberStatus = isCurrentlyOnLeave ? 'CUTI' : newEndDate >= now ? 'ACTIVE' : 'INACTIVE';

    const leave = await this.prisma.memberLeave.create({
      data: {
        memberId,
        subscriptionId: latestSub.id,
        leaveType: 'SCHEDULED',
        startDate: start,
        endDate: end,
        daysAdded,
        status: isCurrentlyOnLeave ? 'ACTIVE' : 'COMPLETED',
        reason: body.reason || 'Cuti Terjadwal',
        approvedBy: body.actorName || 'Manager Operasional',
      },
    });

    const updatedSub = await this.prisma.memberSubscription.update({
      where: { id: latestSub.id },
      data: {
        endDate: newEndDate,
        status: isCurrentlyOnLeave ? 'FROZEN' : newEndDate >= now ? 'ACTIVE' : 'EXPIRED',
      },
    });

    await this.prisma.member.update({
      where: { id: memberId },
      data: {
        status: newMemberStatus,
        parkingActive: newMemberStatus === 'ACTIVE',
      },
    });

    await this.prisma.logAudit({
      userName: body.actorName || 'Manager Operasional',
      userRole: 'OPS_MANAGER',
      action: 'LEAVE_SCHEDULED_ADD',
      entityName: 'MemberLeave',
      entityId: leave.id,
      beforeJson: { oldEndDate },
      afterJson: { newEndDate, daysAdded, restoredStatus: newMemberStatus, updatedSub },
    });

    return leave;
  }

  async resumeUnlimitedLeave(leaveId: string, actorName = 'Manager Operasional') {
    const leave = await this.prisma.memberLeave.findUnique({
      where: { id: leaveId },
      include: { subscription: true },
    });
    if (!leave || leave.status !== 'ACTIVE') {
      throw new BadRequestException('Data cuti tidak ditemukan atau sudah selesai');
    }

    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - new Date(leave.startDate).getTime());
    const daysFrozen = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const newEndDate = new Date(new Date(leave.subscription.endDate).getTime() + daysFrozen * 24 * 60 * 60 * 1000);

    const updatedLeave = await this.prisma.memberLeave.update({
      where: { id: leaveId },
      data: {
        endDate: now,
        daysAdded: daysFrozen,
        status: 'COMPLETED',
      },
    });

    await this.prisma.memberSubscription.update({
      where: { id: leave.subscriptionId },
      data: {
        endDate: newEndDate,
        status: 'ACTIVE',
      },
    });

    await this.prisma.member.update({
      where: { id: leave.memberId },
      data: { status: 'ACTIVE', parkingActive: true },
    });

    await this.prisma.logAudit({
      userName: actorName,
      userRole: 'OPS_MANAGER',
      action: 'LEAVE_RESUME',
      entityName: 'MemberLeave',
      entityId: leaveId,
      afterJson: { daysFrozen, newEndDate },
    });

    return updatedLeave;
  }

  async deleteLeave(leaveId: string, actorName = 'Manager Operasional') {
    const leave = await this.prisma.memberLeave.findUnique({
      where: { id: leaveId },
      include: { subscription: true },
    });
    if (!leave) throw new NotFoundException('Data cuti tidak ditemukan');

    const rolledBackEndDate = new Date(
      new Date(leave.subscription.endDate).getTime() - leave.daysAdded * 24 * 60 * 60 * 1000,
    );
    const now = new Date();
    const isStillActive = rolledBackEndDate >= now;

    await this.prisma.memberSubscription.update({
      where: { id: leave.subscriptionId },
      data: {
        endDate: rolledBackEndDate,
        status: isStillActive ? 'ACTIVE' : 'EXPIRED',
      },
    });

    await this.prisma.member.update({
      where: { id: leave.memberId },
      data: { status: isStillActive ? 'ACTIVE' : 'INACTIVE' },
    });

    await this.prisma.memberLeave.delete({ where: { id: leaveId } });

    await this.prisma.logAudit({
      userName: actorName,
      userRole: 'OPS_MANAGER',
      action: 'LEAVE_DELETE',
      entityName: 'MemberLeave',
      entityId: leaveId,
      beforeJson: leave,
      afterJson: { rolledBackEndDate },
    });

    return { deleted: true, rolledBackEndDate };
  }

  // 3.4 Aktivasi & Penjadwalan Mulai Paket Membership
  async activateMember(memberId: string, body: { startDate?: string; actorName?: string }) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        subscriptions: {
          include: { package: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!member) throw new NotFoundException('Member tidak ditemukan');
    if (!member.subscriptions || member.subscriptions.length === 0) {
      throw new BadRequestException('Member belum memiliki riwayat paket untuk diaktifkan');
    }

    // Ambil subscription terakhir (khususnya yang PENDING_ACTIVATION atau teranyar)
    const pendingSub = member.subscriptions.find((s) => s.status === 'PENDING_ACTIVATION');
    const targetSub = pendingSub || member.subscriptions[0];
    const durationDays = targetSub.package?.durationDays || 30;

    const now = new Date();
    let startDate: Date;
    if (body.startDate) {
      startDate = new Date(body.startDate);
      // Jika format YYYY-MM-DD, set jam sesuai sekarang agar akurat
      if (body.startDate.length === 10) {
        startDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
      }
    } else {
      startDate = new Date();
    }

    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Cek apakah tanggal aktivasi hari ini atau sebelumnya (sudah aktif)
    const isStartingNowOrPast = startDate <= now;
    const newStatus = isStartingNowOrPast ? 'ACTIVE' : 'PENDING_ACTIVATION';

    const updatedSub = await this.prisma.memberSubscription.update({
      where: { id: targetSub.id },
      data: {
        startDate,
        endDate,
        status: newStatus,
        notes: isStartingNowOrPast ? 'Paket Telah Diaktifkan' : `Aktivasi Dijadwalkan Mulai ${body.startDate}`,
      },
    });

    await this.prisma.member.update({
      where: { id: memberId },
      data: {
        status: newStatus,
        parkingActive: isStartingNowOrPast,
      },
    });

    await this.prisma.logAudit({
      userName: body.actorName || 'Kasir Front Desk',
      userRole: 'CASHIER',
      action: 'ACTIVATE_MEMBERSHIP',
      entityName: 'Member',
      entityId: memberId,
      beforeJson: { prevStatus: member.status, prevSub: targetSub },
      afterJson: { newStatus, startDate, endDate, updatedSub },
    });

    return this.findOne(memberId);
  }

  // Parse e-KTP Text
  async parseOcrKtp(rawText?: string) {
    if (!rawText || !rawText.trim()) {
      return {
        confidence: 0,
        extracted: {
          nik: '',
          fullName: '',
          birthDate: '',
          gender: 'L',
          address: '',
          rtRw: '',
          kecamatan: '',
        },
        rawText: '',
      };
    }

    const text = rawText.toUpperCase();
    const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    let nik = '';
    let fullName = '';
    let birthDate = '';
    let gender = 'L';
    let address = '';
    let rtRw = '';
    let kecamatan = '';

    // Cari NIK
    const nikMatch = text.match(/NIK\s*[:;]?\s*([0-9DIOBS]{16})/i) || text.match(/\b([0-9]{16})\b/);
    if (nikMatch) {
      nik = nikMatch[1]
        .replace(/[D]/g, '0')
        .replace(/[O]/g, '0')
        .replace(/[I]/g, '1')
        .replace(/[B]/g, '8')
        .replace(/[S]/g, '5');
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const upper = line.toUpperCase();

      if (!fullName && (upper.startsWith('NAMA') || upper.includes('NAMA :') || upper.includes('NAMA:'))) {
        const parts = line.split(/[:;]/);
        if (parts.length > 1) {
          fullName = parts.slice(1).join(':').replace(/^[^a-zA-Z]+/, '').trim().toUpperCase();
        }
      }

      if (!birthDate && (upper.includes('TEMPAT') || upper.includes('LAHIR') || upper.includes('TGL LAHIR'))) {
        const dateMatch = line.match(/(\d{1,2})[\s\-\/\.](\d{1,2})[\s\-\/\.](\d{4})/);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const month = dateMatch[2].padStart(2, '0');
          const year = dateMatch[3];
          birthDate = `${year}-${month}-${day}`;
        }
      }

      if (upper.includes('KELAMIN')) {
        if (upper.includes('PEREMPUAN') || upper.includes('WANITA')) gender = 'P';
        else if (upper.includes('LAKI') || upper.includes('PRIA')) gender = 'L';
      }

      if (!address && (upper.startsWith('ALAMAT') || upper.includes('ALAMAT :'))) {
        const parts = line.split(/[:;]/);
        if (parts.length > 1) {
          address = parts.slice(1).join(':').trim().toUpperCase();
        }
      }

      if (!rtRw && (upper.includes('RT/RW') || upper.includes('RT / RW'))) {
        const match = line.match(/(\d{2,3})\s*[\/\\]\s*(\d{2,3})/);
        if (match) {
          rtRw = `${match[1].padStart(3, '0')}/${match[2].padStart(3, '0')}`;
        }
      }

      if (!kecamatan && upper.includes('KECAMATAN')) {
        const parts = line.split(/[:;]/);
        if (parts.length > 1) {
          kecamatan = parts.slice(1).join(':').trim().toUpperCase();
        }
      }
    }

    const confidence = [nik, fullName, birthDate, address].filter(Boolean).length * 25;

    return {
      confidence: Math.max(70, confidence),
      extracted: {
        nik,
        fullName,
        birthDate,
        gender,
        address,
        rtRw,
        kecamatan,
      },
      rawText,
    };
  }

  async updateMember(id: string, data: any) {
    const existing = await this.prisma.member.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Member tidak ditemukan');

    const updated = await this.prisma.member.update({
      where: { id },
      data: {
        fullName: data.fullName ?? existing.fullName,
        phone: data.phone ?? existing.phone,
        email: data.email ?? existing.email,
        nik: data.nik ?? existing.nik,
        gender: data.gender ?? existing.gender,
        birthDate: data.birthDate ? new Date(data.birthDate) : existing.birthDate,
        address: data.address ?? existing.address,
        rtRw: data.rtRw ?? existing.rtRw,
        kecamatan: data.kecamatan ?? existing.kecamatan,
        plateNumber: data.plateNumber ?? existing.plateNumber,
        status: data.status ?? existing.status,
        parkingActive: data.parkingActive !== undefined ? data.parkingActive : existing.parkingActive,
        facePhotoUrl: data.facePhotoUrl ?? existing.facePhotoUrl,
        ktpPhotoUrl: data.ktpPhotoUrl ?? existing.ktpPhotoUrl,
      },
    });
    return updated;
  }

  async deleteMember(id: string) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) throw new NotFoundException('Member tidak ditemukan');

    await this.prisma.$transaction(async (tx) => {
      await tx.user.deleteMany({ where: { memberId: id } });
      await tx.classBooking.deleteMany({ where: { memberId: id } });
      await tx.memberAttendance.deleteMany({ where: { memberId: id } });

      const contracts = await tx.memberPtContract.findMany({ where: { memberId: id } });
      for (const c of contracts) {
        await tx.ptSessionLog.deleteMany({ where: { contractId: c.id } });
      }
      await tx.memberPtContract.deleteMany({ where: { memberId: id } });

      await tx.posTransaction.updateMany({
        where: { memberId: id },
        data: { memberId: null, guestName: `${member.fullName} (Ex-Member)` },
      });

      await tx.memberLeave.deleteMany({ where: { memberId: id } });
      await tx.memberSubscription.deleteMany({ where: { memberId: id } });
      await tx.member.delete({ where: { id } });
    });

    return { success: true, deletedCode: member.memberCode };
  }

  async bulkDelete(ids: string[]) {
    if (!ids || ids.length === 0) return { deletedCount: 0 };
    let deletedCount = 0;
    for (const id of ids) {
      try {
        await this.deleteMember(id);
        deletedCount++;
      } catch {}
    }
    return { success: true, deletedCount };
  }

  async fixDb() {
    const now = new Date();
    const expiredSubs = await this.prisma.memberSubscription.updateMany({
      where: {
        endDate: { lt: now },
        status: 'ACTIVE',
      },
      data: { status: 'EXPIRED' },
    });

    const allMembers = await this.prisma.member.findMany({
      include: {
        subscriptions: { where: { status: 'ACTIVE', endDate: { gte: now } } },
        leaves: { where: { status: 'ACTIVE' } },
      },
    });

    let updatedCount = 0;
    for (const m of allMembers) {
      if (m.leaves.length > 0) {
        if (m.status !== 'CUTI') {
          await this.prisma.member.update({ where: { id: m.id }, data: { status: 'CUTI' } });
          updatedCount++;
        }
      } else if (m.subscriptions.length > 0) {
        if (m.status !== 'ACTIVE') {
          await this.prisma.member.update({ where: { id: m.id }, data: { status: 'ACTIVE', parkingActive: true } });
          updatedCount++;
        }
      } else {
        if (m.status === 'ACTIVE') {
          await this.prisma.member.update({ where: { id: m.id }, data: { status: 'INACTIVE', parkingActive: false } });
          updatedCount++;
        }
      }
    }

    return {
      success: true,
      message: `Database berhasil diperbaiki & disinkronkan. ${expiredSubs.count} paket kadaluwarsa disesuaikan, ${updatedCount} status member diperbarui.`,
    };
  }

  async syncUsers() {
    const members = await this.prisma.member.findMany();
    let synced = 0;
    const defaultHash = await bcrypt.hash('kaisar123', 10);

    for (const m of members) {
      const existingUser = await this.prisma.user.findFirst({
        where: { OR: [{ memberId: m.id }, { username: m.memberCode }] },
      });
      if (!existingUser) {
        await this.prisma.user.create({
          data: {
            username: m.memberCode,
            passwordHash: defaultHash,
            fullName: m.fullName,
            phone: m.phone,
            role: 'MEMBER',
            memberId: m.id,
          },
        });
        synced++;
      }
    }
    return { success: true, syncedCount: synced, totalMembers: members.length };
  }

  async resetPasswords(memberIds?: string[]) {
    const defaultHash = await bcrypt.hash('kaisar123', 10);
    const where =
      memberIds && memberIds.length > 0 ? { memberId: { in: memberIds } } : { role: 'MEMBER' };

    const res = await this.prisma.user.updateMany({
      where,
      data: { passwordHash: defaultHash },
    });
    return { success: true, resetCount: res.count, defaultPassword: 'kaisar123' };
  }

  async generateCreds(memberIds?: string[]) {
    const members = await this.prisma.member.findMany({
      where: memberIds && memberIds.length > 0 ? { id: { in: memberIds } } : {},
      select: {
        id: true,
        memberCode: true,
        fullName: true,
        phone: true,
        status: true,
      },
    });

    return {
      success: true,
      credentials: members.map((m) => ({
        ...m,
        portalUrl: 'http://localhost:3000/portals',
        username: m.memberCode,
        password: 'kaisar123',
      })),
    };
  }
}

@Controller('members')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  findAll(@Query('search') search?: string, @Query('status') status?: string) {
    return this.membersService.findAll(search, status);
  }

  @Post('fix-db')
  fixDb() {
    return this.membersService.fixDb();
  }

  @Post('sync-users')
  syncUsers() {
    return this.membersService.syncUsers();
  }

  @Post('reset-passwords')
  resetPasswords(@Body() body: { memberIds?: string[] }) {
    return this.membersService.resetPasswords(body?.memberIds);
  }

  @Post('generate-creds')
  generateCreds(@Body() body: { memberIds?: string[] }) {
    return this.membersService.generateCreds(body?.memberIds);
  }

  @Post('bulk-delete')
  bulkDelete(@Body() body: { ids: string[] }) {
    return this.membersService.bulkDelete(body?.ids || []);
  }

  @Get('next-code')
  async getNextCode() {
    const code = await this.membersService.generateNextMemberCode();
    return { code };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.membersService.createMember(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.membersService.updateMember(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.membersService.deleteMember(id);
  }

  @Post('ocr-ktp')
  ocrKtp(@Body() body: { rawText?: string }) {
    return this.membersService.parseOcrKtp(body?.rawText);
  }

  @Patch(':id/subscriptions/:subId')
  editSubDates(@Param('id') id: string, @Param('subId') subId: string, @Body() body: any) {
    return this.membersService.editSubscriptionDates(id, subId, body);
  }

  @Post(':id/activate')
  activateMember(@Param('id') id: string, @Body() body: { startDate?: string; actorName?: string }) {
    return this.membersService.activateMember(id, body);
  }

  @Post(':id/leaves')
  addLeave(@Param('id') id: string, @Body() body: any) {
    return this.membersService.addLeave(id, body);
  }

  @Post('leaves/:leaveId/resume')
  resumeLeave(@Param('leaveId') leaveId: string) {
    return this.membersService.resumeUnlimitedLeave(leaveId);
  }

  @Delete('leaves/:leaveId')
  deleteLeave(@Param('leaveId') leaveId: string) {
    return this.membersService.deleteLeave(leaveId);
  }
}

@Module({
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}

