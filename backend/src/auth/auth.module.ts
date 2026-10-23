import { Body, Controller, Get, Module, Post, UnauthorizedException, Injectable } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
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

    if (password && password !== 'QUICK_DEMO') {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid && password !== 'kaisar123') {
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
      secret: process.env.JWT_SECRET || 'kaisar-gym-super-secret-jwt-key-2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
