import { Body, Controller, Get, Injectable, Module, NotFoundException, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // Haversine formula to compute distance in meters between staff GPS and Kaisar Gym building
  calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dp = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dp / 2) * Math.sin(dp / 2) +
      Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  async getAttendanceLogs() {
    const [memberLogs, staffLogs] = await Promise.all([
      this.prisma.memberAttendance.findMany({
        include: {
          member: {
            include: {
              subscriptions: { include: { package: true }, orderBy: { endDate: 'desc' }, take: 1 },
            },
          },
        },
        orderBy: { checkInTime: 'desc' },
        take: 40,
      }),
      this.prisma.staffAttendance.findMany({
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
    ]);

    return { memberLogs, staffLogs };
  }

  // 8.1 & 8.2 Absensi Member Masuk Gym & Turnstile Gate Verification
  async checkInMember(body: { query: string; method?: string }) {
    const member = await this.prisma.member.findFirst({
      where: {
        OR: [
          { memberCode: { equals: body.query.trim(), mode: 'insensitive' } },
          { id: body.query.trim() },
          { fullName: { contains: body.query.trim(), mode: 'insensitive' } },
        ],
      },
      include: {
        groupMembership: true,
        subscriptions: {
          include: { package: true },
          orderBy: { endDate: 'desc' },
        },
        ptContracts: {
          where: { status: 'ACTIVE', remainingSessions: { gt: 0 } },
          include: { trainer: true },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Member dengan kode/nama "${body.query}" tidak ditemukan`);
    }

    let latestSub = member.subscriptions[0];
    const now = new Date();

    // Auto-activate member if activation date has arrived
    if (member.status === 'PENDING_ACTIVATION' && latestSub) {
      const subStart = new Date(latestSub.startDate);
      const subEnd = new Date(latestSub.endDate);
      if (subStart <= now && subEnd >= now) {
        await this.prisma.member.update({
          where: { id: member.id },
          data: { status: 'ACTIVE', parkingActive: true },
        });
        await this.prisma.memberSubscription.update({
          where: { id: latestSub.id },
          data: { status: 'ACTIVE' },
        });
        member.status = 'ACTIVE';
      }
    }

    const daysRemaining = latestSub
      ? Math.ceil((new Date(latestSub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const isCorporateActive = member.groupMembership?.status === 'ACTIVE';
    const isAllowed =
      member.status === 'ACTIVE' && ((latestSub && daysRemaining >= 0) || isCorporateActive);

    const denialReason = isAllowed
      ? null
      : member.status === 'PENDING_ACTIVATION'
      ? 'PAKET BELUM DIAKTIFKAN (MENUNGGU AKTIVASI DI FRONT DESK)'
      : member.status === 'CUTI'
      ? 'PAKET SEDANG CUTI'
      : member.status === 'BLACKLIST'
      ? 'AKUN MEMBER DIBLACKLIST'
      : 'PAKET MEMBERSHIP TELAH HABIS (EXPIRED) - TAWARKAN PERPANJANGAN';

    const log = await this.prisma.memberAttendance.create({
      data: {
        memberId: member.id,
        method: body.method || 'QR_SCAN',
        gateStatus: isAllowed ? 'ALLOWED' : 'DENIED',
        denialReason,
      },
      include: { member: true },
    });

    return {
      allowed: isAllowed,
      beepSound: isAllowed ? 'BEEP_GREEN_SUCCESS' : 'BEEP_RED_ALERT',
      turnstileCommand: isAllowed ? 'OPEN_RELAY_GATE_01' : 'LOCK_GATE_01',
      denialReason,
      daysRemaining: Math.max(0, daysRemaining),
      member,
      latestSubscription: latestSub || null,
      log,
    };
  }

  // 8.3 Absensi Staf & Trainer (Selfie + Geolocation Attendance)
  async clockInStaffSelfie(body: {
    staffName: string;
    role: string;
    type: 'CLOCK_IN' | 'CLOCK_OUT';
    latitude: number;
    longitude: number;
    isMockLocation?: boolean;
    selfiePhotoUrl?: string;
  }) {
    const gymLat = Number(process.env.GYM_LAT || -6.2088);
    const gymLng = Number(process.env.GYM_LNG || 106.8456);
    const maxRadius = Number(process.env.GYM_MAX_RADIUS_METERS || 250);

    const distanceMeters = this.calculateDistanceMeters(
      Number(body.latitude),
      Number(body.longitude),
      gymLat,
      gymLng,
    );
    const isWithinGeofence = distanceMeters <= maxRadius && !body.isMockLocation;

    const record = await this.prisma.staffAttendance.create({
      data: {
        staffName: body.staffName,
        role: body.role || 'STAFF',
        type: body.type || 'CLOCK_IN',
        latitude: Number(body.latitude),
        longitude: Number(body.longitude),
        distanceMeters,
        isWithinGeofence,
        isMockLocation: Boolean(body.isMockLocation),
        selfiePhotoUrl: body.selfiePhotoUrl || 'CAPTURED_LIVE_WEBCAM_SELFIE',
      },
    });

    return {
      record,
      gymCoordinates: { gymLat, gymLng, maxRadius },
      verdict: body.isMockLocation
        ? 'DITOLAK: Fake GPS / Mock Location Terdeteksi!'
        : isWithinGeofence
        ? `BERHASIL: Berada di Area Kaisar Gym (${distanceMeters}m dari titik pusat)`
        : `PERINGATAN DILUAR RADIUS: Jarak ${distanceMeters}m (Maksimal ${maxRadius}m)`,
    };
  }
}

@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Get()
  getLogs() {
    return this.attendanceService.getAttendanceLogs();
  }

  @Post('member-checkin')
  checkInMember(@Body() body: { query: string; method?: string }) {
    return this.attendanceService.checkInMember(body);
  }

  @Post('staff-selfie')
  clockInStaff(@Body() body: any) {
    return this.attendanceService.clockInStaffSelfie(body);
  }
}

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
