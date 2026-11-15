import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.module';

describe('AuthService security checks', () => {
  const makeService = (passwordHash: string) => {
    const prisma: any = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'u-1',
          username: 'owner',
          fullName: 'Kaisar Putra',
          role: 'SUPER_ADMIN',
          email: 'owner@kaisargym.com',
          isActive: true,
          passwordHash,
          memberId: null,
          trainerId: null,
        }),
      },
      logAudit: jest.fn().mockResolvedValue(undefined),
    };
    const jwtService: any = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
    };
    return new AuthService(prisma, jwtService);
  };

  afterEach(() => {
    delete process.env.ALLOW_DEMO_LOGIN;
  });

  it('rejects missing password', async () => {
    const hash = await bcrypt.hash('secret-pass', 10);
    const service = makeService(hash);
    await expect(service.login('owner', '')).rejects.toThrow(UnauthorizedException);
    await expect(service.login('owner', undefined)).rejects.toThrow(UnauthorizedException);
  });

  it('does not accept hardcoded kaisar123 when user changed password', async () => {
    const hash = await bcrypt.hash('new-strong-password', 10);
    const service = makeService(hash);
    await expect(service.login('owner', 'kaisar123')).rejects.toThrow(UnauthorizedException);

    const res = await service.login('owner', 'new-strong-password');
    expect(res.accessToken).toBe('signed-jwt-token');
  });

  it('blocks QUICK_DEMO when ALLOW_DEMO_LOGIN=false', async () => {
    process.env.ALLOW_DEMO_LOGIN = 'false';
    const hash = await bcrypt.hash('kaisar123', 10);
    const service = makeService(hash);
    await expect(service.login('owner', 'QUICK_DEMO')).rejects.toThrow(UnauthorizedException);
  });
});
