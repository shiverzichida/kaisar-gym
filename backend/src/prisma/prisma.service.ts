import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async logAudit(params: {
    userId?: string;
    userName: string;
    userRole: string;
    action: string;
    entityName: string;
    entityId?: string;
    ipAddress?: string;
    beforeJson?: any;
    afterJson?: any;
  }) {
    return this.auditLog.create({
      data: {
        userId: params.userId || null,
        userName: params.userName || 'System',
        userRole: params.userRole || 'SUPER_ADMIN',
        action: params.action,
        entityName: params.entityName,
        entityId: params.entityId || null,
        ipAddress: params.ipAddress || '127.0.0.1',
        beforeJson: params.beforeJson ? JSON.parse(JSON.stringify(params.beforeJson)) : undefined,
        afterJson: params.afterJson ? JSON.parse(JSON.stringify(params.afterJson)) : undefined,
      },
    });
  }
}
