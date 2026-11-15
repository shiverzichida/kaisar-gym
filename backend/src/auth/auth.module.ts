import { Body, Controller, Get, Module, Post, UnauthorizedException, Injectable } from '@nestjs/common';
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
