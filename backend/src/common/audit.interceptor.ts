import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

interface AuditRule {
  action: string;
  entityName: string;
}

const AUDIT_ROUTE_MAP: Record<string, AuditRule> = {
  // Master Membership Packages, PT Packages & Products
  'POST /pos/packages': { action: 'CREATE_PACKAGE', entityName: 'MembershipPackage' },
  'PUT /pos/packages/:id': { action: 'UPDATE_PACKAGE', entityName: 'MembershipPackage' },
  'DELETE /pos/packages/:id': { action: 'DELETE_PACKAGE', entityName: 'MembershipPackage' },
  'POST /pos/pt-packages': { action: 'CREATE_PT_PACKAGE', entityName: 'PtPackage' },
  'PUT /pos/pt-packages/:id': { action: 'UPDATE_PT_PACKAGE', entityName: 'PtPackage' },
  'DELETE /pos/pt-packages/:id': { action: 'DELETE_PT_PACKAGE', entityName: 'PtPackage' },
  'POST /pos/products': { action: 'CREATE_PRODUCT', entityName: 'Product' },
  'PUT /pos/products/:id': { action: 'UPDATE_PRODUCT', entityName: 'Product' },
  'DELETE /pos/products/:id': { action: 'DELETE_PRODUCT', entityName: 'Product' },

  // Finance, Inventory & Shifts
  'POST /finance/products': { action: 'CREATE_PRODUCT', entityName: 'Product' },
  'POST /finance/products/:id/restock': { action: 'RESTOCK_PRODUCT', entityName: 'Product' },
  'POST /finance/expenses': { action: 'CREATE_EXPENSE', entityName: 'Expense' },
  'POST /finance/shifts/open': { action: 'OPEN_SHIFT', entityName: 'CashierShift' },
  'POST /finance/shifts/:id/close': { action: 'CLOSE_SHIFT', entityName: 'CashierShift' },

  // Members & Groups
  'PATCH /members/:id': { action: 'UPDATE_MEMBER', entityName: 'Member' },
  'DELETE /members/:id': { action: 'DELETE_MEMBER', entityName: 'Member' },
  'POST /members/bulk-delete': { action: 'BULK_DELETE_MEMBER', entityName: 'Member' },
  'POST /groups': { action: 'CREATE_GROUP', entityName: 'GroupMembership' },
  'POST /groups/:id/members': { action: 'ADD_GROUP_MEMBER', entityName: 'GroupMembership' },

  // Trainers & PT Assignments / Salary
  'POST /trainers': { action: 'CREATE_TRAINER', entityName: 'Trainer' },
  'PUT /trainers/:id': { action: 'UPDATE_TRAINER', entityName: 'Trainer' },
  'DELETE /trainers/:id': { action: 'DELETE_TRAINER', entityName: 'Trainer' },
  'POST /trainers/assignments': { action: 'CREATE_PT_ASSIGNMENT', entityName: 'MemberPtContract' },
  'PATCH /trainers/assignments/:id/status': { action: 'UPDATE_PT_ASSIGNMENT', entityName: 'MemberPtContract' },
  'DELETE /trainers/assignments/:id': { action: 'DELETE_PT_ASSIGNMENT', entityName: 'MemberPtContract' },
  'POST /trainers/salary-requests': { action: 'CREATE_SALARY_REQUEST', entityName: 'TrainerSalaryRequest' },
  'PATCH /trainers/salary-requests/:id/status': { action: 'UPDATE_SALARY_REQUEST', entityName: 'TrainerSalaryRequest' },

  // Classes & Bookings
  'POST /classes/schedules': { action: 'CREATE_CLASS_SCHEDULE', entityName: 'ClassSchedule' },
  'PUT /classes/schedules/:id': { action: 'UPDATE_CLASS_SCHEDULE', entityName: 'ClassSchedule' },
  'DELETE /classes/schedules/:id': { action: 'DELETE_CLASS_SCHEDULE', entityName: 'ClassSchedule' },
  'POST /classes/schedules/batch-delete': { action: 'BULK_DELETE_SCHEDULES', entityName: 'ClassSchedule' },
  'POST /classes/generate-schedules': { action: 'GENERATE_CLASS_SCHEDULE', entityName: 'ClassSchedule' },
  'POST /classes/book': { action: 'BOOK_CLASS', entityName: 'ClassBooking' },
  'PATCH /classes/bookings/:id/status': { action: 'UPDATE_CLASS_BOOKING', entityName: 'ClassBooking' },
};

function decodeHeaderValue(val: unknown, fallback: string): string {
  if (typeof val !== 'string' || !val.trim()) return fallback;
  try {
    return decodeURIComponent(val).trim() || fallback;
  } catch {
    return val.trim() || fallback;
  }
}

function sanitizeJson(input: unknown): any {
  if (!input || typeof input !== 'object') return input ?? undefined;
  const skipKeys = new Set(['facePhotoUrl', 'ktpPhotoUrl', 'stnkPhotoUrl', 'passwordHash', 'password']);
  const out: Record<string, any> = {};
  for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
    if (skipKeys.has(key)) continue;
    if (typeof val === 'string' && val.length > 512) {
      out[key] = `${val.slice(0, 120)}...`;
      continue;
    }
    out[key] = val;
  }
  return out;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest();
    const method = String(req?.method || '').toUpperCase();
    if (!method || method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return next.handle();
    }

    const rawRoute = String(req?.route?.path || req?.path || '').replace(/^\/api/, '');
    const rule = AUDIT_ROUTE_MAP[`${method} ${rawRoute}`];
    if (!rule) return next.handle();

    const headers = req.headers || {};
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const userId = decodeHeaderValue(headers['x-actor-id'], '') || undefined;
    const userName = decodeHeaderValue(
      headers['x-actor-name'],
      String(body.actorName || body.cashierName || body.openedBy || body.closedBy || 'Administrator'),
    );
    const userRole = decodeHeaderValue(
      headers['x-actor-role'],
      String(body.actorRole || 'ADMIN'),
    );
    const ipAddress = String(
      (typeof headers['x-forwarded-for'] === 'string' ? headers['x-forwarded-for'].split(',')[0] : '') ||
        req.ip ||
        '127.0.0.1',
    ).trim();
    const paramId = req.params?.id ? String(req.params.id) : undefined;
    const sanitizedBody = sanitizeJson(body);

    return next.handle().pipe(
      tap((result) => {
        const entityId = (result && typeof result === 'object' && result.id ? String(result.id) : undefined) || paramId;
        const afterJson = sanitizeJson(result && typeof result === 'object' ? result : sanitizedBody);
        this.prisma
          .logAudit({
            userId,
            userName,
            userRole,
            action: rule.action,
            entityName: rule.entityName,
            entityId,
            ipAddress,
            afterJson,
          })
          .catch(() => {});
      }),
    );
  }
}
