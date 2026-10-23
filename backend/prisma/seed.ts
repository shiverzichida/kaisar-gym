import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Kaisar Gym PostgreSQL Database...');

  const passwordHash = await bcrypt.hash('kaisar123', 10);

  // 1. Master Membership Packages
  const pkgDayPass = await prisma.membershipPackage.upsert({
    where: { code: 'PKG-DAY' },
    update: {},
    create: {
      code: 'PKG-DAY',
      name: 'Daily Pass (1 Hari)',
      category: 'DAY_PASS',
      durationDays: 1,
      normalPrice: 75000,
      promoPrice: 50000,
      description: 'Tiket masuk harian semua alat gym',
    },
  });

  const pkgReg1M = await prisma.membershipPackage.upsert({
    where: { code: 'PKG-REG-1M' },
    update: {},
    create: {
      code: 'PKG-REG-1M',
      name: 'Reguler Gym 1 Bulan',
      category: 'REGULAR',
      durationDays: 30,
      normalPrice: 350000,
      promoPrice: 299000,
      description: 'Akses penuh area gym & kardio 30 hari',
    },
  });

  const pkgStudio1M = await prisma.membershipPackage.upsert({
    where: { code: 'PKG-STD-1M' },
    update: {},
    create: {
      code: 'PKG-STD-1M',
      name: 'Gym + All Studio Class 1 Bulan',
      category: 'GYM_STUDIO',
      durationDays: 30,
      normalPrice: 550000,
      promoPrice: 475000,
      description: 'Akses gym + kelas Zumba, Yoga, Body Combat, Spinning',
    },
  });

  const pkgPromo3Plus1 = await prisma.membershipPackage.upsert({
    where: { code: 'PKG-PROMO-4M' },
    update: {},
    create: {
      code: 'PKG-PROMO-4M',
      name: 'Promo 3+1 Bulan (120 Hari)',
      category: 'REGULAR',
      durationDays: 120,
      normalPrice: 1200000,
      promoPrice: 950000,
      description: 'Bayar 3 bulan gratis 1 bulan (Total 120 Hari)',
    },
  });

  const pkgVip12M = await prisma.membershipPackage.upsert({
    where: { code: 'PKG-VIP-12M' },
    update: {},
    create: {
      code: 'PKG-VIP-12M',
      name: 'VIP All-Access 12 Bulan',
      category: 'VIP',
      durationDays: 365,
      normalPrice: 4200000,
      promoPrice: 3499000,
      description: 'Akses VIP 1 tahun + Loker + Parkir Gratis + Semua Kelas Studio',
    },
  });

  const pkgCorp = await prisma.membershipPackage.upsert({
    where: { code: 'PKG-CORP-3M' },
    update: {},
    create: {
      code: 'PKG-CORP-3M',
      name: 'Corporate B2B 3 Bulan (10 Slot)',
      category: 'CORPORATE',
      durationDays: 90,
      normalPrice: 7500000,
      promoPrice: 6500000,
      description: 'Paket kerjasama perusahaan 90 hari',
    },
  });

  // 2. Master PT Packages
  const pt4 = await prisma.ptPackage.upsert({
    where: { code: 'PT-04' },
    update: {},
    create: { code: 'PT-04', name: 'Paket 4 Sesi PT', sessionCount: 4, validityDays: 30, price: 800000 },
  });
  const pt8 = await prisma.ptPackage.upsert({
    where: { code: 'PT-08' },
    update: {},
    create: { code: 'PT-08', name: 'Paket 8 Sesi PT', sessionCount: 8, validityDays: 45, price: 1500000 },
  });
  const pt12 = await prisma.ptPackage.upsert({
    where: { code: 'PT-12' },
    update: {},
    create: { code: 'PT-12', name: 'Paket 12 Sesi PT', sessionCount: 12, validityDays: 60, price: 2100000 },
  });
  const pt24 = await prisma.ptPackage.upsert({
    where: { code: 'PT-24' },
    update: {},
    create: { code: 'PT-24', name: 'Paket 24 Sesi PT', sessionCount: 24, validityDays: 90, price: 3800000 },
  });

  // 3. Master Retail Products
  const productsData = [
    { sku: 'PRD-WHEY-01', name: 'Optimum Whey Isolate 1 Serving', category: 'SUPPLEMENT', costPrice: 22000, sellingPrice: 35000, stock: 45, minStockAlert: 10 },
    { sku: 'PRD-CREA-01', name: 'Creatine Monohydrate 300g', category: 'SUPPLEMENT', costPrice: 180000, sellingPrice: 265000, stock: 12, minStockAlert: 5 },
    { sku: 'PRD-WATER-01', name: 'Air Mineral Kaisar 600ml', category: 'BEVERAGE', costPrice: 2500, sellingPrice: 6000, stock: 120, minStockAlert: 24 },
    { sku: 'PRD-PRE-01', name: 'C4 Pre-Workout Shot', category: 'BEVERAGE', costPrice: 28000, sellingPrice: 45000, stock: 4, minStockAlert: 8 },
    { sku: 'PRD-JERSEY-01', name: 'Jersey Dry-Fit Kaisar Gym', category: 'MERCHANDISE', costPrice: 65000, sellingPrice: 125000, stock: 18, minStockAlert: 5 },
    { sku: 'SRV-ADMIN', name: 'Biaya Registrasi Admin & Kartu', category: 'SERVICE', costPrice: 0, sellingPrice: 50000, stock: 999, minStockAlert: 0 },
    { sku: 'SRV-LOCKER', name: 'Sewa Loker Pribadi 1 Bulan', category: 'SERVICE', costPrice: 0, sellingPrice: 75000, stock: 30, minStockAlert: 3 },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  // 4. Trainers
  const trainer1 = await prisma.trainer.upsert({
    where: { code: 'TR-001' },
    update: {},
    create: {
      code: 'TR-001',
      fullName: 'Coach Hendra Pratama',
      specialization: 'Hypertrophy, Fat Loss & Strength Conditioning',
      trainerType: 'FULL_TIME',
      phone: '081288990011',
      tier1Rate: 80000,
      tier2Rate: 100000,
      tier3Rate: 125000,
      salesCommissionPct: 5,
    },
  });

  const trainer2 = await prisma.trainer.upsert({
    where: { code: 'TR-002' },
    update: {},
    create: {
      code: 'TR-002',
      fullName: 'Coach Sarah Wijaya',
      specialization: 'Pilates Reformer, Core Mobility & Zumba',
      trainerType: 'PILATES_INSTRUCTOR',
      phone: '081288990022',
      tier1Rate: 90000,
      tier2Rate: 110000,
      tier3Rate: 135000,
      salesCommissionPct: 6,
    },
  });

  const trainer3 = await prisma.trainer.upsert({
    where: { code: 'TR-003' },
    update: {},
    create: {
      code: 'TR-003',
      fullName: 'Coach Riko Saputra',
      specialization: 'Functional Boxing, Body Combat & HIIT',
      trainerType: 'FREELANCE',
      phone: '081288990033',
      tier1Rate: 75000,
      tier2Rate: 95000,
      tier3Rate: 115000,
      salesCommissionPct: 5,
    },
  });

  // 5. Corporate Group
  const now = new Date();
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const in25Days = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);
  const past5Days = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  const corpGroup = await prisma.groupMembership.upsert({
    where: { code: 'GRP-CORP-001' },
    update: {},
    create: {
      code: 'GRP-CORP-001',
      name: 'PT Nusantara Digital Tech (Corporate)',
      groupType: 'CORPORATE',
      maxSlots: 10,
      packageId: pkgCorp.id,
      startDate: now,
      endDate: in60Days,
      status: 'ACTIVE',
    },
  });

  // 6. Members
  const member1 = await prisma.member.upsert({
    where: { memberCode: 'KG-2026-0001' },
    update: {},
    create: {
      memberCode: 'KG-2026-0001',
      nik: '3174011505950001',
      fullName: 'Budi Santoso',
      phone: '081122334455',
      email: 'budi.santoso@email.com',
      address: 'Jl. Sudirman No. 45, RT 04/RW 02, Kebayoran Baru',
      rtRw: '004/002',
      kecamatan: 'Kebayoran Baru',
      gender: 'L',
      plateNumber: 'B 1928 KSR',
      parkingActive: true,
      status: 'ACTIVE',
      groupMembershipId: corpGroup.id,
      isGroupPic: true,
    },
  });

  await prisma.groupMembership.update({
    where: { id: corpGroup.id },
    data: { picMemberId: member1.id },
  });

  const member2 = await prisma.member.upsert({
    where: { memberCode: 'KG-2026-0002' },
    update: {},
    create: {
      memberCode: 'KG-2026-0002',
      nik: '3174025408980002',
      fullName: 'Siti Aminah',
      phone: '081233445566',
      email: 'siti.aminah@email.com',
      address: 'Jl. Kemang Raya No. 12, Mampang Prapatan',
      rtRw: '001/005',
      kecamatan: 'Mampang Prapatan',
      gender: 'P',
      plateNumber: 'B 4412 SAA',
      parkingActive: true,
      status: 'ACTIVE',
    },
  });

  const member3 = await prisma.member.upsert({
    where: { memberCode: 'KG-2026-0003' },
    update: {},
    create: {
      memberCode: 'KG-2026-0003',
      nik: '3173051211920003',
      fullName: 'Andi Wijaya',
      phone: '081344556677',
      email: 'andi.wijaya@email.com',
      address: 'Jl. Tebet Barat Dalam VIII No. 9',
      rtRw: '008/003',
      kecamatan: 'Tebet',
      gender: 'L',
      status: 'CUTI',
    },
  });

  const member4 = await prisma.member.upsert({
    where: { memberCode: 'KG-2026-0004' },
    update: {},
    create: {
      memberCode: 'KG-2026-0004',
      nik: '3171042203960004',
      fullName: 'Dewi Lestari',
      phone: '081566778899',
      email: 'dewi.lestari@email.com',
      address: 'Jl. Cempaka Putih Tengah No. 21',
      gender: 'P',
      status: 'INACTIVE',
    },
  });

  const member5 = await prisma.member.upsert({
    where: { memberCode: 'KG-2026-0005' },
    update: {},
    create: {
      memberCode: 'KG-2026-0005',
      nik: '3174081909940005',
      fullName: 'Rian Pratama',
      phone: '081788990011',
      email: 'rian.pratama@nusantara.id',
      address: 'Jl. Kuningan Mulia Kav. 9',
      gender: 'L',
      status: 'ACTIVE',
      groupMembershipId: corpGroup.id,
      isGroupPic: false,
    },
  });

  // 7. Member Subscriptions
  const existingSubs = await prisma.memberSubscription.count();
  if (existingSubs === 0) {
    await prisma.memberSubscription.createMany({
      data: [
        {
          memberId: member1.id,
          packageId: pkgVip12M.id,
          startDate: now,
          endDate: in60Days,
          status: 'ACTIVE',
          invoiceRef: 'INV-20261017-0001',
        },
        {
          memberId: member2.id,
          packageId: pkgStudio1M.id,
          startDate: now,
          endDate: in25Days,
          status: 'ACTIVE',
          invoiceRef: 'INV-20261017-0002',
        },
        {
          memberId: member3.id,
          packageId: pkgPromo3Plus1.id,
          startDate: now,
          endDate: in60Days,
          status: 'FROZEN',
          notes: 'Sedang dinas luar kota 14 hari',
          invoiceRef: 'INV-20261015-0009',
        },
        {
          memberId: member4.id,
          packageId: pkgReg1M.id,
          startDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
          endDate: past5Days,
          status: 'EXPIRED',
          invoiceRef: 'INV-20260910-0004',
        },
        {
          memberId: member5.id,
          packageId: pkgCorp.id,
          startDate: now,
          endDate: in60Days,
          status: 'ACTIVE',
          notes: 'Aktivasi Grup Corporate PT Nusantara Digital Tech',
        },
      ],
    });
  }

  // 8. PT Contracts & Session Logs
  const existingContracts = await prisma.memberPtContract.count();
  if (existingContracts === 0) {
    const contract1 = await prisma.memberPtContract.create({
      data: {
        memberId: member1.id,
        trainerId: trainer1.id,
        ptPackageId: pt12.id,
        totalSessions: 12,
        remainingSessions: 9,
        startDate: now,
        expiryDate: in60Days,
        status: 'ACTIVE',
      },
    });

    await prisma.ptSessionLog.createMany({
      data: [
        {
          contractId: contract1.id,
          memberId: member1.id,
          trainerId: trainer1.id,
          musclesTrained: 'Chest & Triceps',
          weightLiftedNote: 'Incline Dumbbell Press 28kg x 10, Cable Pushdown 25kg x 12',
          evaluationNote: 'Form stabil, progres beban naik 2.5kg dari minggu lalu',
          signedOffBy: 'Coach Hendra Pratama',
        },
        {
          contractId: contract1.id,
          memberId: member1.id,
          trainerId: trainer1.id,
          musclesTrained: 'Back & Biceps',
          weightLiftedNote: 'Lat Pulldown 55kg x 10, Barbell Row 50kg x 10',
          evaluationNote: 'Mind-muscle connection punggung membaik',
          signedOffBy: 'Coach Hendra Pratama',
        },
        {
          contractId: contract1.id,
          memberId: member1.id,
          trainerId: trainer1.id,
          musclesTrained: 'Legs & Core',
          weightLiftedNote: 'Barbell Squat 80kg x 8, Romanian Deadlift 70kg x 10',
          evaluationNote: 'Kedalaman squat bagus, perhatikan pernapasan bracing core',
          signedOffBy: 'Coach Hendra Pratama',
        },
      ],
    });
  }

  // 9. Studio Classes & Schedules
  const zumbaClass = await prisma.studioClass.upsert({
    where: { code: 'CLS-ZUMBA' },
    update: {},
    create: {
      code: 'CLS-ZUMBA',
      name: 'Zumba Burn Party',
      category: 'ZUMBA',
      roomName: 'Studio A (Lantai 2)',
      maxCapacity: 20,
      isPaid: false,
      price: 0,
    },
  });

  const pilatesClass = await prisma.studioClass.upsert({
    where: { code: 'CLS-PILATES' },
    update: {},
    create: {
      code: 'CLS-PILATES',
      name: 'Pilates Reformer Signature',
      category: 'PILATES_REFORMER',
      roomName: 'Pilates Sanctuary Studio',
      maxCapacity: 10,
      isPaid: true,
      price: 150000,
    },
  });

  const combatClass = await prisma.studioClass.upsert({
    where: { code: 'CLS-COMBAT' },
    update: {},
    create: {
      code: 'CLS-COMBAT',
      name: 'LesMills Body Combat',
      category: 'BODY_COMBAT',
      roomName: 'Studio A (Lantai 2)',
      maxCapacity: 25,
      isPaid: false,
      price: 0,
    },
  });

  const existingSchedules = await prisma.classSchedule.count();
  if (existingSchedules === 0) {
    await prisma.classScheduleTemplate.createMany({
      data: [
        { studioClassId: zumbaClass.id, trainerId: trainer2.id, dayOfWeek: 1, startTime: '18:30', endTime: '19:30' },
        { studioClassId: pilatesClass.id, trainerId: trainer2.id, dayOfWeek: 3, startTime: '09:00', endTime: '10:00' },
        { studioClassId: combatClass.id, trainerId: trainer3.id, dayOfWeek: 5, startTime: '19:00', endTime: '20:00' },
      ],
    });

    const sched1 = await prisma.classSchedule.create({
      data: {
        studioClassId: zumbaClass.id,
        trainerId: trainer2.id,
        scheduleDate: now,
        startTime: '18:30',
        endTime: '19:30',
        maxCapacity: 20,
        bookedCount: 2,
        status: 'OPEN',
      },
    });

    const sched2 = await prisma.classSchedule.create({
      data: {
        studioClassId: pilatesClass.id,
        trainerId: trainer2.id,
        scheduleDate: now,
        startTime: '10:00',
        endTime: '11:00',
        maxCapacity: 10,
        bookedCount: 1,
        status: 'OPEN',
      },
    });

    await prisma.classBooking.createMany({
      data: [
        { scheduleId: sched1.id, memberId: member1.id, status: 'BOOKED' },
        { scheduleId: sched1.id, memberId: member2.id, status: 'ATTENDED', attendedAt: now },
        { scheduleId: sched2.id, memberId: member2.id, status: 'BOOKED' },
      ],
    });
  }

  // 10. Users (7 Roles)
  const usersToSeed = [
    { username: 'owner', fullName: 'Kaisar Putra (Owner)', role: 'SUPER_ADMIN', email: 'owner@kaisargym.id' },
    { username: 'manager', fullName: 'Dimas Prakoso (Ops Manager)', role: 'OPS_MANAGER', email: 'manager@kaisargym.id' },
    { username: 'studio', fullName: 'Nadia Kusuma (Studio Manager)', role: 'STUDIO_MANAGER', email: 'studio@kaisargym.id' },
    { username: 'kasir', fullName: 'Rina Marlina (Front Desk)', role: 'CASHIER', email: 'kasir@kaisargym.id' },
    { username: 'sales', fullName: 'Kevin Sanjaya (Marketing)', role: 'MARKETING', email: 'sales@kaisargym.id' },
    { username: 'trainer', fullName: 'Coach Hendra Pratama', role: 'TRAINER', trainerId: trainer1.id, email: 'hendra@kaisargym.id' },
    { username: 'KG-2026-0001', fullName: 'Budi Santoso', role: 'MEMBER', memberId: member1.id, email: 'budi.santoso@email.com' },
  ];

  for (const u of usersToSeed) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { memberId: u.memberId, trainerId: u.trainerId },
      create: {
        username: u.username,
        passwordHash,
        fullName: u.fullName,
        role: u.role,
        email: u.email,
        memberId: u.memberId,
        trainerId: u.trainerId,
      },
    });
  }

  // 11. Promos, Shift, Transactions, Expenses & Announcements
  await prisma.promoVoucher.upsert({
    where: { code: 'KAISAR10' },
    update: {},
    create: {
      code: 'KAISAR10',
      description: 'Diskon 10% Semua Paket Membership & PT',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minPurchase: 250000,
      maxQuota: 100,
      usedCount: 4,
    },
  });

  await prisma.promoVoucher.upsert({
    where: { code: 'HEMAT50RB' },
    update: {},
    create: {
      code: 'HEMAT50RB',
      description: 'Potongan Langsung Rp 50.000',
      discountType: 'FIXED',
      discountValue: 50000,
      minPurchase: 300000,
      maxQuota: 50,
      usedCount: 2,
    },
  });

  const existingShift = await prisma.cashierShift.findFirst({ where: { status: 'OPEN' } });
  let activeShiftId = existingShift?.id;
  if (!existingShift) {
    const shift = await prisma.cashierShift.create({
      data: {
        cashierName: 'Rina Marlina (Front Desk)',
        startingCashFloat: 500000,
        totalCashIn: 525000,
        totalEdcIn: 2100000,
        totalQrisIn: 475000,
        totalExpenseOut: 85000,
        expectedEndingCash: 940000,
        status: 'OPEN',
        notes: 'Shift Pagi - Siang',
      },
    });
    activeShiftId = shift.id;

    await prisma.posTransaction.create({
      data: {
        invoiceNumber: 'INV-20261017-0001',
        memberId: member1.id,
        cashierName: 'Rina Marlina (Front Desk)',
        salesPerson: 'Kevin Sanjaya',
        shiftId: shift.id,
        subtotal: 2625000,
        discountAmount: 0,
        grandTotal: 2625000,
        paymentMethod: 'SPLIT',
        cashAmount: 525000,
        nonCashAmount: 2100000,
        paymentRef: 'BCA-EDC-998123',
        paymentStatus: 'PAID',
        items: {
          create: [
            { itemType: 'PT_PACKAGE', itemId: pt12.id, itemName: 'Paket 12 Sesi PT (Coach Hendra)', qty: 1, unitPrice: 2100000, totalPrice: 2100000, trainerId: trainer1.id },
            { itemType: 'MEMBERSHIP', itemId: pkgStudio1M.id, itemName: 'Gym + All Studio Class 1 Bulan', qty: 1, unitPrice: 475000, totalPrice: 475000 },
            { itemType: 'SERVICE_FEE', itemName: 'Biaya Registrasi Admin & Kartu', qty: 1, unitPrice: 50000, totalPrice: 50000 },
          ],
        },
      },
    });

    await prisma.posTransaction.create({
      data: {
        invoiceNumber: 'INV-20261017-0002',
        memberId: member2.id,
        cashierName: 'Rina Marlina (Front Desk)',
        salesPerson: 'Kevin Sanjaya',
        shiftId: shift.id,
        subtotal: 475000,
        discountAmount: 0,
        grandTotal: 475000,
        paymentMethod: 'QRIS',
        cashAmount: 0,
        nonCashAmount: 475000,
        paymentRef: 'QRIS-MIDTRANS-7721',
        paymentStatus: 'PAID',
        items: {
          create: [
            { itemType: 'MEMBERSHIP', itemId: pkgStudio1M.id, itemName: 'Gym + All Studio Class 1 Bulan', qty: 1, unitPrice: 475000, totalPrice: 475000 },
          ],
        },
      },
    });

    await prisma.expense.create({
      data: {
        shiftId: shift.id,
        category: 'KEBERSIHAN',
        description: 'Isi ulang 5 galon air minum & cairan disinfektan alat gym',
        amount: 85000,
        recordedBy: 'Rina Marlina (Front Desk)',
      },
    });
  }

  const existingAnnouncements = await prisma.announcement.count();
  if (existingAnnouncements === 0) {
    await prisma.announcement.createMany({
      data: [
        {
          title: '[PROMO OKTOBER] Paket 3+1 Bulan Hemat Rp 250.000!',
          content: 'Perpanjang membership Anda bulan ini dan dapatkan gratis tambahan 30 hari aktif. Gunakan kode voucher KAISAR10 di kasir!',
          category: 'PROMO',
        },
        {
          title: '[KELAS BARU] Pilates Reformer Signature bersama Coach Sarah',
          content: 'Kini tersedia mesin Pilates Reformer terbaru di lantai 2. Booking slot Anda langsung dari Portal Member.',
          category: 'INFO',
        },
      ],
    });
  }

  console.log('✅ Seeding Kaisar Gym selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
