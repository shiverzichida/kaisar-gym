import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Serializes critical operations inside a PostgreSQL transaction advisory lock. */
  async runWithAdvisoryLock<T>(
    lockKey: number | string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    let numericKey: number;
    if (typeof lockKey === 'number') {
      numericKey = Math.trunc(lockKey);
    } else {
      let h = 2166136261;
      for (let i = 0; i < lockKey.length; i++) {
        h ^= lockKey.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      numericKey = (h >>> 0) & 0x7fffffff;
    }

    return this.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`DO $$ BEGIN PERFORM pg_advisory_xact_lock(${numericKey}); END $$;`);
        return fn(tx);
      },
      { maxWait: 25000, timeout: 30000 },
    );
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
