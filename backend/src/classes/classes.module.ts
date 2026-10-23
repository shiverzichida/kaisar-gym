import { BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Put } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [studioClasses, templates, schedules] = await Promise.all([
      this.prisma.studioClass.findMany({ where: { isActive: true } }),
      this.prisma.classScheduleTemplate.findMany({
        include: { studioClass: true, trainer: true },
        orderBy: { dayOfWeek: 'asc' },
      }),
      this.prisma.classSchedule.findMany({
        include: {
          studioClass: true,
          trainer: true,
          bookings: {
            include: { member: true },
          },
        },
        orderBy: [{ scheduleDate: 'desc' }, { startTime: 'asc' }],
      }),
    ]);

    return { studioClasses, templates, schedules };
  }

  async createSchedule(data: {
    studioClassId: string;
    trainerId: string;
    scheduleDate: string;
    startTime: string;
    endTime: string;
    maxCapacity?: number;
  }) {
    const studioClass = await this.prisma.studioClass.findUnique({
      where: { id: data.studioClassId },
    });
    if (!studioClass) throw new NotFoundException('Kelas studio tidak ditemukan');

    const schedule = await this.prisma.classSchedule.create({
      data: {
        studioClassId: data.studioClassId,
        trainerId: data.trainerId,
        scheduleDate: new Date(data.scheduleDate),
        startTime: data.startTime,
        endTime: data.endTime,
        maxCapacity: data.maxCapacity || studioClass.maxCapacity || 20,
        bookedCount: 0,
        status: 'OPEN',
      },
      include: { studioClass: true, trainer: true, bookings: true },
    });
    return schedule;
  }

  async getSchedule(id: string) {
    const sc = await this.prisma.classSchedule.findUnique({
      where: { id },
      include: {
        studioClass: true,
        trainer: true,
        bookings: {
          include: { member: true },
        },
      },
    });
    if (!sc) throw new NotFoundException('Jadwal kelas tidak ditemukan');
    return sc;
  }

  async updateSchedule(
    id: string,
    data: {
      studioClassId?: string;
      trainerId?: string;
      scheduleDate?: string;
      startTime?: string;
      endTime?: string;
      maxCapacity?: number;
      status?: string;
    },
  ) {
    const exists = await this.prisma.classSchedule.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Jadwal tidak ditemukan');

    const updateData: any = {};
    if (data.studioClassId) updateData.studioClassId = data.studioClassId;
    if (data.trainerId) updateData.trainerId = data.trainerId;
    if (data.scheduleDate) updateData.scheduleDate = new Date(data.scheduleDate);
    if (data.startTime) updateData.startTime = data.startTime;
    if (data.endTime) updateData.endTime = data.endTime;
    if (data.maxCapacity) updateData.maxCapacity = data.maxCapacity;
    if (data.status) updateData.status = data.status;

    return this.prisma.classSchedule.update({
      where: { id },
      data: updateData,
      include: { studioClass: true, trainer: true, bookings: true },
    });
  }

  async deleteSchedule(id: string) {
    const exists = await this.prisma.classSchedule.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Jadwal tidak ditemukan');

    await this.prisma.classSchedule.delete({ where: { id } });
    return { success: true, message: 'Jadwal berhasil dihapus' };
  }

  async batchDeleteSchedules(ids: string[]) {
    if (!ids || ids.length === 0) return { deletedCount: 0 };
    const res = await this.prisma.classSchedule.deleteMany({
      where: { id: { in: ids } },
    });
    return { success: true, deletedCount: res.count };
  }

  // 7.2 Auto-generate jadwal harian dari template mingguan
  async generateSchedulesFromTemplates() {
    const templates = await this.prisma.classScheduleTemplate.findMany({
      where: { isActive: true },
      include: { studioClass: true },
    });

    const created = [];
    const baseDate = new Date();

    for (const tpl of templates) {
      const targetDate = new Date(baseDate.getTime() + (tpl.dayOfWeek - 1) * 24 * 60 * 60 * 1000);
      const sched = await this.prisma.classSchedule.create({
        data: {
          studioClassId: tpl.studioClassId,
          trainerId: tpl.trainerId,
          scheduleDate: targetDate,
          startTime: tpl.startTime,
          endTime: tpl.endTime,
          maxCapacity: tpl.studioClass.maxCapacity,
          bookedCount: 0,
          status: 'OPEN',
        },
        include: { studioClass: true, trainer: true },
      });
      created.push(sched);
    }

    return { generatedCount: created.length, schedules: created };
  }

  async bookClass(body: { scheduleId: string; memberId: string }) {
    const schedule = await this.prisma.classSchedule.findUnique({
      where: { id: body.scheduleId },
      include: { bookings: true, studioClass: true },
    });
    if (!schedule) throw new NotFoundException('Jadwal kelas tidak ditemukan');

    const activeBookings = schedule.bookings.filter((b) => b.status !== 'CANCELLED');
    if (activeBookings.length >= schedule.maxCapacity) {
      throw new BadRequestException('Kuota kelas studio sudah penuh (Full Booked)');
    }

    const alreadyBooked = activeBookings.find((b) => b.memberId === body.memberId);
    if (alreadyBooked) {
      throw new BadRequestException('Member sudah terdaftar pada jadwal kelas ini');
    }

    const [booking] = await this.prisma.$transaction([
      this.prisma.classBooking.create({
        data: {
          scheduleId: schedule.id,
          memberId: body.memberId,
          status: 'BOOKED',
        },
        include: { member: true, schedule: { include: { studioClass: true } } },
      }),
      this.prisma.classSchedule.update({
        where: { id: schedule.id },
        data: {
          bookedCount: activeBookings.length + 1,
          status: activeBookings.length + 1 >= schedule.maxCapacity ? 'FULL' : 'OPEN',
        },
      }),
    ]);

    return booking;
  }

  async updateBookingStatus(bookingId: string, status: 'ATTENDED' | 'CANCELLED' | 'ABSENT') {
    const booking = await this.prisma.classBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking tidak ditemukan');

    const updated = await this.prisma.classBooking.update({
      where: { id: bookingId },
      data: {
        status,
        attendedAt: status === 'ATTENDED' ? new Date() : null,
      },
    });

    if (status === 'CANCELLED') {
      await this.prisma.classSchedule.update({
        where: { id: booking.scheduleId },
        data: { bookedCount: { decrement: 1 }, status: 'OPEN' },
      });
    }

    return updated;
  }
}

@Controller('classes')
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Get()
  getOverview() {
    return this.classesService.getOverview();
  }

  @Get('schedules/:id')
  getSchedule(@Param('id') id: string) {
    return this.classesService.getSchedule(id);
  }

  @Post('schedules')
  createSchedule(@Body() body: any) {
    return this.classesService.createSchedule(body);
  }

  @Put('schedules/:id')
  updateSchedule(@Param('id') id: string, @Body() body: any) {
    return this.classesService.updateSchedule(id, body);
  }

  @Delete('schedules/:id')
  deleteSchedule(@Param('id') id: string) {
    return this.classesService.deleteSchedule(id);
  }

  @Post('schedules/batch-delete')
  batchDelete(@Body() body: { ids: string[] }) {
    return this.classesService.batchDeleteSchedules(body.ids);
  }

  @Post('generate-schedules')
  generateSchedules() {
    return this.classesService.generateSchedulesFromTemplates();
  }

  @Post('book')
  bookClass(@Body() body: { scheduleId: string; memberId: string }) {
    return this.classesService.bookClass(body);
  }

  @Patch('bookings/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: 'ATTENDED' | 'CANCELLED' | 'ABSENT' }) {
    return this.classesService.updateBookingStatus(id, body.status);
  }
}

@Module({
  controllers: [ClassesController],
  providers: [ClassesService],
})
export class ClassesModule {}
