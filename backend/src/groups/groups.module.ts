import { BadRequestException, Body, Controller, Get, Injectable, Module, NotFoundException, Param, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.groupMembership.findMany({
      include: {
        package: true,
        members: {
          include: {
            subscriptions: {
              include: { package: true },
              orderBy: { endDate: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGroup(data: any) {
    const count = await this.prisma.groupMembership.count();
    const code = `GRP-${data.groupType?.slice(0, 4) || 'CORP'}-${String(count + 1).padStart(3, '0')}`;

    const group = await this.prisma.groupMembership.create({
      data: {
        code,
        name: data.name,
        groupType: data.groupType || 'CORPORATE',
        maxSlots: Number(data.maxSlots || 10),
        packageId: data.packageId || null,
        picMemberId: data.picMemberId || null,
        status: 'INACTIVE',
      },
    });

    if (data.picMemberId) {
      await this.prisma.member.update({
        where: { id: data.picMemberId },
        data: { groupMembershipId: group.id, isGroupPic: true },
      });
    }

    return group;
  }

  async addMemberToGroup(groupId: string, memberId: string, isPic = false) {
    const group = await this.prisma.groupMembership.findUnique({
      where: { id: groupId },
      include: { members: true },
    });
    if (!group) throw new NotFoundException('Grup tidak ditemukan');
    if (group.members.length >= group.maxSlots) {
      throw new BadRequestException(`Slot grup penuh (Maksimal ${group.maxSlots} anggota)`);
    }

    await this.prisma.member.update({
      where: { id: memberId },
      data: {
        groupMembershipId: groupId,
        isGroupPic: isPic,
      },
    });

    if (isPic) {
      await this.prisma.groupMembership.update({
        where: { id: groupId },
        data: { picMemberId: memberId },
      });
    }

    return this.findAll();
  }

  // 4.3 Fitur "Aktifkan Sekali Semua" (1-Click Group Activation)
  async activateAllGroupMembers(groupId: string, body?: { packageId?: string; startDate?: string; actorName?: string }) {
    const group = await this.prisma.groupMembership.findUnique({
      where: { id: groupId },
      include: {
        package: true,
        members: {
          include: {
            subscriptions: { orderBy: { endDate: 'desc' }, take: 1 },
          },
        },
      },
    });
    if (!group) throw new NotFoundException('Grup tidak ditemukan');

    // Detect package from PIC member or group setting or request body
    const picMember = group.members.find((m) => m.isGroupPic || m.id === group.picMemberId);
    const picSub = picMember?.subscriptions?.[0];

    const targetPackageId = body?.packageId || group.packageId || picSub?.packageId;
    if (!targetPackageId) {
      throw new BadRequestException('Pilih paket membership terlebih dahulu untuk mengaktifkan grup');
    }

    const pkg = await this.prisma.membershipPackage.findUnique({ where: { id: targetPackageId } });
    if (!pkg) throw new NotFoundException('Paket tidak ditemukan');

    const startDate = body?.startDate
      ? new Date(body.startDate)
      : picSub?.startDate
      ? new Date(picSub.startDate)
      : new Date();
    const endDate = new Date(startDate.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);

    // Activate group and all members in 1 transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.groupMembership.update({
        where: { id: groupId },
        data: {
          status: 'ACTIVE',
          packageId: pkg.id,
          startDate,
          endDate,
        },
      });

      for (const m of group.members) {
        await tx.memberSubscription.create({
          data: {
            memberId: m.id,
            packageId: pkg.id,
            startDate,
            endDate,
            status: 'ACTIVE',
            notes: `[1-CLICK] Aktivasi Grup: ${group.name}`,
          },
        });

        await tx.member.update({
          where: { id: m.id },
          data: {
            status: 'ACTIVE',
            parkingActive: Boolean(m.plateNumber),
          },
        });
      }
    });

    await this.prisma.logAudit({
      userName: body?.actorName || 'Manager Operasional',
      userRole: 'OPS_MANAGER',
      action: 'GROUP_1CLICK_ACTIVATE',
      entityName: 'GroupMembership',
      entityId: groupId,
      afterJson: {
        groupName: group.name,
        activatedMembersCount: group.members.length,
        package: pkg.name,
        startDate,
        endDate,
      },
    });

    return {
      success: true,
      activatedCount: group.members.length,
      startDate,
      endDate,
    };
  }
}

@Controller('groups')
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.groupsService.createGroup(body);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() body: { memberId: string; isPic?: boolean }) {
    return this.groupsService.addMemberToGroup(id, body.memberId, body.isPic);
  }

  @Post(':id/activate-all')
  activateAll(@Param('id') id: string, @Body() body: any) {
    return this.groupsService.activateAllGroupMembers(id, body);
  }
}

@Module({
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
