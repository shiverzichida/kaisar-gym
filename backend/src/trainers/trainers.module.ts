import { BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrainersService {
  constructor(private prisma: PrismaService) {}

  // Skema Komisi Kaisar Gym: Flat 50% Gym : 50% PT (Bukan Tiering & Bukan Sales Closing)
  calculateFlatCommission(contracts: any[]) {
    let completedSessionsCount = 0;
    let totalContractValue = 0;
    let earnedPtCommission = 0;
    let earnedGymRevenue = 0;
    let potentialPtCommission = 0;
    let potentialGymRevenue = 0;

    const contractBreakdown = (contracts || []).map((c) => {
      const normalPrice = c.normalPrice > 0 ? c.normalPrice : (c.ptPackage?.price || 0);
      const discountPct = c.discountPct || 0;
      const effectivePrice = c.totalPrice > 0 ? c.totalPrice : Math.round(normalPrice * (1 - discountPct / 100));
      const totalSessions = c.totalSessions > 0 ? c.totalSessions : (c.ptPackage?.sessionCount || 1);
      const remainingSessions = c.remainingSessions !== undefined ? c.remainingSessions : totalSessions;
      const completedSessions = Math.max(0, totalSessions - remainingSessions);

      const unitPricePerSession = totalSessions > 0 ? Math.round(effectivePrice / totalSessions) : 0;
      const ptSessionFee = Math.round(unitPricePerSession * 0.5);
      const gymSessionFee = unitPricePerSession - ptSessionFee; // ensures exact balance

      const contractEarnedPt = completedSessions * ptSessionFee;
      const contractEarnedGym = completedSessions * gymSessionFee;
      const contractPotentialPt = Math.round(effectivePrice * 0.5);
      const contractPotentialGym = effectivePrice - contractPotentialPt;

      completedSessionsCount += completedSessions;
      totalContractValue += effectivePrice;
      earnedPtCommission += contractEarnedPt;
      earnedGymRevenue += contractEarnedGym;
      potentialPtCommission += contractPotentialPt;
      potentialGymRevenue += contractPotentialGym;

      return {
        contractId: c.id,
        memberId: c.memberId,
        memberName: c.member?.fullName || 'Member',
        memberCode: c.member?.memberCode || '-',
        packageName: c.ptPackage?.name || 'Paket PT',
        totalSessions,
        remainingSessions,
        completedSessions,
        effectivePrice,
        unitPricePerSession,
        ptSessionFee,
        gymSessionFee,
        contractEarnedPt,
        contractEarnedGym,
        status: c.status,
      };
    });

    return {
      completedSessionsCount,
      totalContractValue,
      earnedPtCommission,
      earnedGymRevenue,
      potentialPtCommission,
      potentialGymRevenue,
      contractBreakdown,
      splitPctPt: 50,
      splitPctGym: 50,
      commissionModelLabel: 'Bagi Hasil Flat 50% PT : 50% Gym',
    };
  }

  // Deprecated helper kept for compatibility if needed
  calculateGraduatedCommission(sessionCount: number, t1: number, t2: number, t3: number): number {
    return sessionCount * 100000;
  }

  async findAll() {
    const trainers = await this.prisma.trainer.findMany({
      include: {
        ptContracts: {
          include: { member: true, ptPackage: true },
          orderBy: { createdAt: 'desc' },
        },
        ptSessionLogs: {
          include: { member: true },
          orderBy: { sessionDate: 'desc' },
        },
        salaryRequests: {
          orderBy: { createdAt: 'desc' },
        },
        classSchedules: {
          include: { studioClass: true },
          orderBy: { scheduleDate: 'asc' },
        },
        scheduleTemplates: {
          include: { studioClass: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    return trainers.map((t) => {
      const comm = this.calculateFlatCommission(t.ptContracts);
      const completedSessionsTotal = Math.max(t.ptSessionLogs.length, comm.completedSessionsCount);

      // Extract unique assigned classes
      const classMap = new Map<string, { id: string; name: string; isPrimary: boolean }>();
      (t.scheduleTemplates || []).forEach((st, idx) => {
        if (st.studioClass && !classMap.has(st.studioClass.id)) {
          classMap.set(st.studioClass.id, {
            id: st.studioClass.id,
            name: st.studioClass.name,
            isPrimary: idx === 0,
          });
        }
      });
      (t.classSchedules || []).forEach((cs) => {
        if (cs.studioClass && !classMap.has(cs.studioClass.id)) {
          classMap.set(cs.studioClass.id, {
            id: cs.studioClass.id,
            name: cs.studioClass.name,
            isPrimary: classMap.size === 0,
          });
        }
      });
      const assignedClasses = Array.from(classMap.values());

      const email = `${t.fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;

      return {
        ...t,
        email,
        assignedClasses,
        contractBreakdown: comm.contractBreakdown,
        metrics: {
          activeClientsCount: t.ptContracts.filter((c) => c.status === 'ACTIVE' && c.remainingSessions > 0).length,
          completedSessionsThisMonth: completedSessionsTotal,
          currentTier: 'Bagi Hasil Flat 50:50',
          commissionModel: 'FLAT_50_50',
          commissionModelLabel: 'Bagi Hasil Flat 50% PT : 50% Gym',
          ptSharePct: 50,
          gymSharePct: 50,
          totalContractValue: comm.totalContractValue,
          estimatedSessionCommission: comm.earnedPtCommission,
          gymEarnedRevenue: comm.earnedGymRevenue,
          potentialPtCommission: comm.potentialPtCommission,
          potentialGymRevenue: comm.potentialGymRevenue,
          estimatedSalesCommission: 0,
          totalEstimatedTakeHome: comm.earnedPtCommission,
        },
      };
    });
  }

  async findOne(id: string) {
    const t = await this.prisma.trainer.findUnique({
      where: { id },
      include: {
        ptContracts: {
          include: { member: true, ptPackage: true },
          orderBy: { createdAt: 'desc' },
        },
        ptSessionLogs: {
          include: { member: true },
          orderBy: { sessionDate: 'desc' },
        },
        salaryRequests: {
          orderBy: { createdAt: 'desc' },
        },
        classSchedules: {
          include: { studioClass: true },
          orderBy: { scheduleDate: 'asc' },
        },
        scheduleTemplates: {
          include: { studioClass: true },
        },
      },
    });
    if (!t) throw new NotFoundException('Trainer tidak ditemukan');

    const comm = this.calculateFlatCommission(t.ptContracts);
    const completedSessionsTotal = Math.max(t.ptSessionLogs.length, comm.completedSessionsCount);

    const classMap = new Map<string, { id: string; name: string; isPrimary: boolean }>();
    (t.scheduleTemplates || []).forEach((st, idx) => {
      if (st.studioClass && !classMap.has(st.studioClass.id)) {
        classMap.set(st.studioClass.id, {
          id: st.studioClass.id,
          name: st.studioClass.name,
          isPrimary: idx === 0,
        });
      }
    });
    (t.classSchedules || []).forEach((cs) => {
      if (cs.studioClass && !classMap.has(cs.studioClass.id)) {
        classMap.set(cs.studioClass.id, {
          id: cs.studioClass.id,
          name: cs.studioClass.name,
          isPrimary: classMap.size === 0,
        });
      }
    });
    const assignedClasses = Array.from(classMap.values());
    const email = `${t.fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;

    return {
      ...t,
      email,
      assignedClasses,
      contractBreakdown: comm.contractBreakdown,
      metrics: {
        activeClientsCount: t.ptContracts.filter((c) => c.status === 'ACTIVE' && c.remainingSessions > 0).length,
        completedSessionsThisMonth: completedSessionsTotal,
        currentTier: 'Bagi Hasil Flat 50:50',
        commissionModel: 'FLAT_50_50',
        commissionModelLabel: 'Bagi Hasil Flat 50% PT : 50% Gym',
        ptSharePct: 50,
        gymSharePct: 50,
        totalContractValue: comm.totalContractValue,
        estimatedSessionCommission: comm.earnedPtCommission,
        gymEarnedRevenue: comm.earnedGymRevenue,
        potentialPtCommission: comm.potentialPtCommission,
        potentialGymRevenue: comm.potentialGymRevenue,
        estimatedSalesCommission: 0,
        totalEstimatedTakeHome: comm.earnedPtCommission,
      },
    };
  }

  async createTrainer(body: {
    fullName: string;
    code?: string;
    phone?: string;
    specialization?: string;
    trainerType?: string;
    isActive?: boolean;
    classIds?: string[];
  }) {
    let code = body.code;
    if (!code) {
      const count = await this.prisma.trainer.count();
      code = `PT-${String(count + 31).padStart(3, '0')}`;
    }

    const trainer = await this.prisma.trainer.create({
      data: {
        code,
        fullName: body.fullName,
        phone: body.phone || '08123456789',
        specialization: body.specialization || 'Personal Trainer',
        trainerType: body.trainerType || 'FULL_TIME',
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    if (body.classIds && body.classIds.length > 0) {
      for (const classId of body.classIds) {
        await this.prisma.classScheduleTemplate.create({
          data: {
            studioClassId: classId,
            trainerId: trainer.id,
            dayOfWeek: 1,
            startTime: '08:00',
            endTime: '09:00',
            isActive: true,
          },
        });
      }
    }

    return trainer;
  }

  async updateTrainer(id: string, body: any) {
    const updateData: any = {};
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.code !== undefined) updateData.code = body.code;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.specialization !== undefined) updateData.specialization = body.specialization;
    if (body.trainerType !== undefined) updateData.trainerType = body.trainerType;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const trainer = await this.prisma.trainer.update({
      where: { id },
      data: updateData,
    });

    if (body.classIds && Array.isArray(body.classIds)) {
      await this.prisma.classScheduleTemplate.deleteMany({ where: { trainerId: id } });
      for (const classId of body.classIds) {
        await this.prisma.classScheduleTemplate.create({
          data: {
            studioClassId: classId,
            trainerId: id,
            dayOfWeek: 1,
            startTime: '08:00',
            endTime: '09:00',
            isActive: true,
          },
        });
      }
    }

    return trainer;
  }

  async deleteTrainer(id: string) {
    await this.prisma.classScheduleTemplate.deleteMany({ where: { trainerId: id } });
    await this.prisma.classSchedule.deleteMany({ where: { trainerId: id } });
    await this.prisma.ptSessionLog.deleteMany({ where: { contract: { trainerId: id } } });
    await this.prisma.memberPtContract.deleteMany({ where: { trainerId: id } });
    await this.prisma.salaryRequest.deleteMany({ where: { trainerId: id } });
    await this.prisma.trainer.delete({ where: { id } });
    return { success: true, message: 'Trainer berhasil dihapus' };
  }

  // 6.3 Pelacakan Sesi & Sign-Off Check-In
  async signOffSession(body: {
    contractId: string;
    musclesTrained: string;
    weightLiftedNote?: string;
    evaluationNote?: string;
    signedOffBy?: string;
    forceOverride?: boolean;
  }) {
    const contract = await this.prisma.memberPtContract.findUnique({
      where: { id: body.contractId },
      include: { member: true, trainer: true },
    });
    if (!contract) throw new NotFoundException('Kontrak sesi PT tidak ditemukan');
    if (contract.remainingSessions <= 0) {
      throw new BadRequestException('Kuota sesi PT member ini sudah habis (0 sesi tersisa)');
    }

    // Prevent accidental double-click sign-off within 5 seconds
    const fiveSecsAgo = new Date(Date.now() - 5 * 1000);
    const duplicate = await this.prisma.ptSessionLog.findFirst({
      where: {
        contractId: contract.id,
        sessionDate: { gte: fiveSecsAgo },
      },
    });
    if (duplicate && !body.forceOverride) {
      throw new BadRequestException('Sesi latihan untuk klien ini baru saja di-sign-off beberapa detik lalu (Proteksi Klik Ganda)');
    }

    const newRemaining = contract.remainingSessions - 1;

    const [log, updatedContract] = await this.prisma.$transaction([
      this.prisma.ptSessionLog.create({
        data: {
          contractId: contract.id,
          memberId: contract.memberId,
          trainerId: contract.trainerId,
          musclesTrained: body.musclesTrained,
          weightLiftedNote: body.weightLiftedNote || null,
          evaluationNote: body.evaluationNote || null,
          signedOffBy: body.signedOffBy || contract.trainer.fullName,
        },
        include: { member: true, trainer: true },
      }),
      this.prisma.memberPtContract.update({
        where: { id: contract.id },
        data: {
          remainingSessions: newRemaining,
          status: newRemaining === 0 ? 'COMPLETED' : 'ACTIVE',
        },
      }),
    ]);

    await this.prisma.logAudit({
      userName: body.signedOffBy || contract.trainer.fullName,
      userRole: 'TRAINER',
      action: 'PT_SESSION_SIGNOFF',
      entityName: 'PtSessionLog',
      entityId: log.id,
      beforeJson: { remainingSessions: contract.remainingSessions },
      afterJson: { remainingSessions: newRemaining, musclesTrained: body.musclesTrained },
    });

    return { log, updatedContract };
  }

  // PT Assignments Management (Full Feature & Lifecycle)
  async getAssignments(query?: { search?: string; trainerId?: string; status?: string }) {
    const where: any = {};
    if (query?.trainerId && query.trainerId !== 'ALL' && query.trainerId !== '') {
      where.trainerId = query.trainerId;
    }
    if (query?.status && query.status !== 'ALL' && query.status !== '') {
      where.status = query.status;
    }
    if (query?.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { member: { fullName: { contains: term, mode: 'insensitive' } } },
        { member: { memberCode: { contains: term, mode: 'insensitive' } } },
        { trainer: { fullName: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const contracts = await this.prisma.memberPtContract.findMany({
      where,
      include: {
        member: true,
        trainer: true,
        ptPackage: true,
        sessionLogs: {
          orderBy: { sessionDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return contracts.map((c) => {
      const normalPrice = c.normalPrice > 0 ? c.normalPrice : c.ptPackage?.price || 0;
      const discountPct = c.discountPct || 0;
      const totalPrice = c.totalPrice > 0 ? c.totalPrice : Math.round(normalPrice * (1 - discountPct / 100));

      return {
        ...c,
        normalPrice,
        discountPct,
        totalPrice,
      };
    });
  }

  async getAssignmentById(id: string) {
    const contract = await this.prisma.memberPtContract.findUnique({
      where: { id },
      include: {
        member: true,
        trainer: true,
        ptPackage: true,
        sessionLogs: {
          orderBy: { sessionDate: 'desc' },
        },
      },
    });
    if (!contract) throw new NotFoundException('Kontrak PT tidak ditemukan');

    const normalPrice = contract.normalPrice > 0 ? contract.normalPrice : contract.ptPackage?.price || 0;
    const discountPct = contract.discountPct || 0;
    const totalPrice = contract.totalPrice > 0 ? contract.totalPrice : Math.round(normalPrice * (1 - discountPct / 100));

    return {
      ...contract,
      normalPrice,
      discountPct,
      totalPrice,
    };
  }

  async createAssignment(body: {
    memberId: string;
    trainerId: string;
    ptPackageId?: string;
    totalSessions?: number;
    normalPrice?: number;
    discountPct?: number;
    totalPrice?: number;
    validityDays?: number;
    notes?: string;
  }) {
    if (!body.memberId || !body.trainerId) {
      throw new BadRequestException('Member dan Trainer wajib dipilih');
    }

    let pkg = body.ptPackageId ? await this.prisma.ptPackage.findUnique({ where: { id: body.ptPackageId } }) : null;
    if (!pkg) {
      pkg = await this.prisma.ptPackage.findFirst({ where: { isActive: true }, orderBy: { sessionCount: 'asc' } });
    }

    const totalSessions = Number(body.totalSessions || pkg?.sessionCount || 12);
    const validityDays = Number(body.validityDays || pkg?.validityDays || 60);
    const normalPrice = Number(body.normalPrice !== undefined ? body.normalPrice : pkg?.price || 2000000);
    const discountPct = Number(body.discountPct || 0);
    const totalPrice = Number(body.totalPrice !== undefined ? body.totalPrice : Math.round(normalPrice * (1 - discountPct / 100)));

    const now = new Date();
    const expiryDate = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    return this.prisma.memberPtContract.create({
      data: {
        memberId: body.memberId,
        trainerId: body.trainerId,
        ptPackageId: pkg?.id || '',
        totalSessions,
        remainingSessions: totalSessions,
        normalPrice,
        discountPct,
        totalPrice,
        startDate: now,
        expiryDate,
        status: 'ACTIVE',
        notes: body.notes || 'Penetapan PT Manual / Admin',
      },
      include: { member: true, trainer: true, ptPackage: true },
    });
  }

  async updateAssignment(
    id: string,
    body: {
      totalSessions?: number;
      remainingSessions?: number;
      expiryDate?: string;
      status?: string;
      notes?: string;
      normalPrice?: number;
      discountPct?: number;
      totalPrice?: number;
      trainerId?: string;
    },
  ) {
    const existing = await this.prisma.memberPtContract.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Kontrak PT tidak ditemukan');

    const data: any = {};
    if (body.totalSessions !== undefined) data.totalSessions = Number(body.totalSessions);
    if (body.remainingSessions !== undefined) data.remainingSessions = Number(body.remainingSessions);
    if (body.expiryDate) data.expiryDate = new Date(body.expiryDate);
    if (body.status) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.normalPrice !== undefined) data.normalPrice = Number(body.normalPrice);
    if (body.discountPct !== undefined) data.discountPct = Number(body.discountPct);
    if (body.totalPrice !== undefined) data.totalPrice = Number(body.totalPrice);
    if (body.trainerId) data.trainerId = body.trainerId;

    return this.prisma.memberPtContract.update({
      where: { id },
      data,
      include: { member: true, trainer: true, ptPackage: true },
    });
  }

  async transferAssignment(id: string, body: { newTrainerId: string; reason?: string; transferredBy?: string }) {
    const existing = await this.prisma.memberPtContract.findUnique({
      where: { id },
      include: { trainer: true, member: true },
    });
    if (!existing) throw new NotFoundException('Kontrak PT tidak ditemukan');

    const newTrainer = await this.prisma.trainer.findUnique({ where: { id: body.newTrainerId } });
    if (!newTrainer) throw new NotFoundException('Trainer tujuan transfer tidak ditemukan');

    const prevTrainerName = existing.trainer?.fullName || 'Trainer Sebelumnya';
    const noteAdd = `[Transfer dari ${prevTrainerName} ke ${newTrainer.fullName}: ${body.reason || 'Permintaan Klien/Rotasi Trainer'}]`;
    const newNotes = existing.notes ? `${existing.notes} | ${noteAdd}` : noteAdd;

    const updated = await this.prisma.memberPtContract.update({
      where: { id },
      data: {
        trainerId: body.newTrainerId,
        notes: newNotes,
      },
      include: { member: true, trainer: true, ptPackage: true },
    });

    await this.prisma.logAudit({
      userName: body.transferredBy || 'Administrator',
      userRole: 'OPS_MANAGER',
      action: 'PT_ASSIGNMENT_TRANSFER',
      entityName: 'MemberPtContract',
      entityId: id,
      beforeJson: { trainerId: existing.trainerId, trainerName: prevTrainerName },
      afterJson: { trainerId: newTrainer.id, trainerName: newTrainer.fullName, reason: body.reason },
    });

    return updated;
  }

  async deleteAssignment(id: string) {
    const existing = await this.prisma.memberPtContract.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Kontrak PT tidak ditemukan');

    return this.prisma.memberPtContract.delete({
      where: { id },
    });
  }

  async importAssignments(items: Array<{
    memberCodeOrName: string;
    trainerCodeOrName: string;
    packageCodeOrName?: string;
    sessions?: number;
    normalPrice?: number;
    discountPct?: number;
    totalPrice?: number;
  }>) {
    const allMembers = await this.prisma.member.findMany();
    const allTrainers = await this.prisma.trainer.findMany();
    const allPackages = await this.prisma.ptPackage.findMany();

    const createdList = [];
    for (const item of items) {
      const member = allMembers.find(
        (m) =>
          m.memberCode.toLowerCase() === item.memberCodeOrName?.trim().toLowerCase() ||
          m.fullName.toLowerCase().includes(item.memberCodeOrName?.trim().toLowerCase()),
      );
      const trainer = allTrainers.find(
        (t) =>
          t.code.toLowerCase() === item.trainerCodeOrName?.trim().toLowerCase() ||
          t.fullName.toLowerCase().includes(item.trainerCodeOrName?.trim().toLowerCase()),
      );
      if (!member || !trainer) continue;

      const pkg =
        allPackages.find(
          (p) =>
            p.code.toLowerCase() === item.packageCodeOrName?.trim().toLowerCase() ||
            p.name.toLowerCase().includes(item.packageCodeOrName?.trim().toLowerCase()),
        ) || allPackages[0];

      const sessions = Number(item.sessions || pkg?.sessionCount || 12);
      const normalPrice = Number(item.normalPrice || pkg?.price || 2000000);
      const discountPct = Number(item.discountPct || 0);
      const totalPrice = Number(item.totalPrice || Math.round(normalPrice * (1 - discountPct / 100)));

      const now = new Date();
      const expiryDate = new Date(now.getTime() + (pkg?.validityDays || 60) * 24 * 60 * 60 * 1000);

      const contract = await this.prisma.memberPtContract.create({
        data: {
          memberId: member.id,
          trainerId: trainer.id,
          ptPackageId: pkg.id,
          totalSessions: sessions,
          remainingSessions: sessions,
          normalPrice,
          discountPct,
          totalPrice,
          startDate: now,
          expiryDate,
          status: 'ACTIVE',
          notes: 'Imported via Template Excel/CSV',
        },
      });
      createdList.push(contract);
    }
    return { count: createdList.length, items: createdList };
  }

  async getSalaryRequests(trainerId?: string) {
    const where = trainerId ? { trainerId } : {};
    return this.prisma.salaryRequest.findMany({
      where,
      include: {
        trainer: {
          select: {
            id: true,
            code: true,
            fullName: true,
            phone: true,
            specialization: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSalaryRequest(body: {
    trainerId: string;
    monthYear?: string;
    amount?: number;
    completedSessions?: number;
    notes?: string;
  }) {
    const all = await this.findAll();
    const trainer = all.find((t) => t.id === body.trainerId);
    if (!trainer) throw new NotFoundException('Trainer tidak ditemukan');

    const completedSessions =
      body.completedSessions !== undefined
        ? body.completedSessions
        : trainer.metrics.completedSessionsThisMonth;
    const totalAmount =
      body.amount !== undefined && body.amount > 0
        ? body.amount
        : (trainer.metrics.totalEstimatedTakeHome > 0
            ? trainer.metrics.totalEstimatedTakeHome
            : 2650000);

    return this.prisma.salaryRequest.create({
      data: {
        trainerId: trainer.id,
        monthYear: body.monthYear || '2026-10',
        completedSessions: completedSessions || 0,
        sessionCommission: totalAmount,
        salesCommission: 0,
        totalAmount: totalAmount,
        status: 'PENDING',
        notes: body.notes || 'Klaim transfer komisi bagi hasil 50% Kaisar Gym',
      },
      include: {
        trainer: {
          select: {
            id: true,
            code: true,
            fullName: true,
            phone: true,
            specialization: true,
          },
        },
      },
    });
  }

  async updateSalaryRequestStatus(id: string, body: { status: string; approvedBy?: string; notes?: string }) {
    const existing = await this.prisma.salaryRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pengajuan gaji tidak ditemukan');

    return this.prisma.salaryRequest.update({
      where: { id },
      data: {
        status: body.status,
        approvedBy: body.approvedBy || 'Manager Operasional (POS)',
        ...(body.notes ? { notes: body.notes } : {}),
      },
      include: {
        trainer: {
          select: {
            id: true,
            code: true,
            fullName: true,
            phone: true,
            specialization: true,
          },
        },
      },
    });
  }
}

@Controller('trainers')
export class TrainersController {
  constructor(private trainersService: TrainersService) {}

  @Get()
  findAll() {
    return this.trainersService.findAll();
  }

  @Post()
  createTrainer(@Body() body: any) {
    return this.trainersService.createTrainer(body);
  }

  @Put(':id')
  updateTrainer(@Param('id') id: string, @Body() body: any) {
    return this.trainersService.updateTrainer(id, body);
  }

  @Delete(':id')
  deleteTrainer(@Param('id') id: string) {
    return this.trainersService.deleteTrainer(id);
  }

  @Get('assignments')
  getAssignments(@Query() query: any) {
    return this.trainersService.getAssignments(query);
  }

  @Get('assignments/:id')
  getAssignmentById(@Param('id') id: string) {
    return this.trainersService.getAssignmentById(id);
  }

  @Get('salary-requests')
  getSalaryRequests(@Query('trainerId') trainerId?: string) {
    return this.trainersService.getSalaryRequests(trainerId);
  }

  @Post('salary-requests')
  createSalaryRequest(@Body() body: any) {
    return this.trainersService.createSalaryRequest(body);
  }

  @Patch('salary-requests/:id/status')
  updateSalaryStatus(@Param('id') id: string, @Body() body: { status: string; approvedBy?: string; notes?: string }) {
    return this.trainersService.updateSalaryRequestStatus(id, body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trainersService.findOne(id);
  }

  @Post('assignments')
  createAssignment(@Body() body: any) {
    return this.trainersService.createAssignment(body);
  }

  @Patch('assignments/:id')
  updateAssignment(@Param('id') id: string, @Body() body: any) {
    return this.trainersService.updateAssignment(id, body);
  }

  @Post('assignments/:id/transfer')
  transferAssignment(@Param('id') id: string, @Body() body: any) {
    return this.trainersService.transferAssignment(id, body);
  }

  @Delete('assignments/:id')
  deleteAssignment(@Param('id') id: string) {
    return this.trainersService.deleteAssignment(id);
  }

  @Post('assignments/import')
  importAssignments(@Body() body: { items: any[] }) {
    return this.trainersService.importAssignments(body.items || []);
  }

  @Post('sign-off')
  signOff(@Body() body: any) {
    return this.trainersService.signOffSession(body);
  }
}

@Module({
  controllers: [TrainersController],
  providers: [TrainersService],
})
export class TrainersModule {}

