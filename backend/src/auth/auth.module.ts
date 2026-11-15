import { BadRequestException, Body, Controller, Delete, Get, Module, NotFoundException, Param, Patch, Post, UnauthorizedException, Injectable } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password?: string) {
    const raw = (username || '').trim().toLowerCase();
    const normalizedUsername =
      raw === 'admin'
        ? 'owner'
        : raw === 'cashier'
        ? 'kasir'
        : raw === 'marketing'
        ? 'sales'
        : raw;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: normalizedUsername, mode: 'insensitive' } },
          { email: { equals: normalizedUsername, mode: 'insensitive' } },
        ],
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Username atau akun tidak ditemukan');
    }

    const allowDemoQuickLogin = process.env.ALLOW_DEMO_LOGIN !== 'false';
    if (password === 'QUICK_DEMO') {
      if (!allowDemoQuickLogin) {
        throw new UnauthorizedException('Quick demo login dinonaktifkan');
      }
    } else {
      if (!password) {
        throw new UnauthorizedException('Password wajib diisi');
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedException('Password salah');
      }
    }

    await this.prisma.logAudit({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'LOGIN',
      entityName: 'User',
      entityId: user.id,
    });

    const payload = { sub: user.id, username: user.username, role: user.role, fullName: user.fullName };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
        memberId: user.memberId,
        trainerId: user.trainerId,
      },
    };
  }

  async listDemoAccounts() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        memberId: true,
        trainerId: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listStaffUsers() {
    return this.prisma.user.findMany({
      where: { role: { notIn: ['MEMBER'] } },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createStaffUser(body: {
    username: string;
    fullName: string;
    role: string;
    password: string;
    email?: string;
    phone?: string;
  }) {
    const username = String(body?.username || '').trim().toLowerCase();
    const fullName = String(body?.fullName || '').trim();
    const password = String(body?.password || '');
    if (!username || !fullName || password.length < 6) {
      throw new BadRequestException('Username, nama lengkap, dan password (min 6 karakter) wajib diisi');
    }

    const exists = await this.prisma.user.findUnique({ where: { username } });
    if (exists) throw new BadRequestException(`Username "${username}" sudah digunakan`);

    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: {
        username,
        fullName,
        role: body.role || 'CASHIER',
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async updateStaffUser(id: string, body: { fullName?: string; role?: string; email?: string; phone?: string; isActive?: boolean }) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Akun staff tidak ditemukan');
    const data: any = {};
    if (body.fullName !== undefined) data.fullName = String(body.fullName).trim();
    if (body.role !== undefined) data.role = body.role;
    if (body.email !== undefined) data.email = body.email?.trim() || null;
    if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        email: true,
        phone: true,
        isActive: true,
      },
    });
  }

  async resetUserPassword(id: string, newPassword: string) {
    const password = String(newPassword || '');
    if (password.length < 6) throw new BadRequestException('Password baru minimal 6 karakter');
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Akun tidak ditemukan');
    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { success: true };
  }

  async changeOwnPassword(body: { userId?: string; username?: string; currentPassword: string; newPassword: string }) {
    const newPass = String(body?.newPassword || '');
    if (newPass.length < 6) throw new BadRequestException('Password baru minimal 6 karakter');

    const user = await this.prisma.user.findFirst({
      where: body.userId ? { id: body.userId } : { username: String(body.username || '').trim().toLowerCase() },
    });
    if (!user) throw new NotFoundException('Akun tidak ditemukan');

    const valid = await bcrypt.compare(String(body.currentPassword || ''), user.passwordHash);
    if (!valid) throw new UnauthorizedException('Password lama salah');

    const passwordHash = await bcrypt.hash(newPass, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return { success: true };
  }

  async deleteStaffUser(id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Akun staff tidak ditemukan');
    try {
      await this.prisma.user.delete({ where: { id } });
      return { success: true };
    } catch {
      throw new BadRequestException(
        'Akun tidak dapat dihapus karena sudah memiliki riwayat transaksi atau shift. Silakan nonaktifkan akun ini.',
      );
    }
  }
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  async login(@Body() body: { username: string; password?: string }) {
    return this.authService.login(body.username, body.password);
  }

  @Get('demo-accounts')
  async getDemoAccounts() {
    return this.authService.listDemoAccounts();
  }

  @Get('users')
  listUsers() {
    return this.authService.listStaffUsers();
  }

  @Post('users')
  createUser(@Body() body: any) {
    return this.authService.createStaffUser(body);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.authService.updateStaffUser(id, body);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.authService.deleteStaffUser(id);
  }

  @Post('users/:id/reset-password')
  resetPassword(@Param('id') id: string, @Body() body: { newPassword: string }) {
    return this.authService.resetUserPassword(id, body?.newPassword);
  }

  @Post('change-password')
  changePassword(@Body() body: { userId?: string; username?: string; currentPassword: string; newPassword: string }) {
    return this.authService.changeOwnPassword(body);
  }
}

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret:
        process.env.JWT_SECRET ||
        (process.env.NODE_ENV === 'production'
          ? (() => {
              throw new Error('JWT_SECRET environment variable must be set in production');
            })()
          : 'dev-only-insecure-jwt-secret'),
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
