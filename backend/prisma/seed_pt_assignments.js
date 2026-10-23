const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Ensuring Trainers from screenshot exist ---');
  // Indah, Rio Junior Putra, Juliana
  const tIndah = await prisma.trainer.upsert({
    where: { code: 'TR-INDAH' },
    update: {},
    create: {
      code: 'TR-INDAH',
      fullName: 'Indah',
      specialization: 'Fat Loss, Pilates & Strength',
      trainerType: 'FULL_TIME',
      phone: '081234567891',
      tier1Rate: 85000,
      tier2Rate: 105000,
      tier3Rate: 130000,
      salesCommissionPct: 5,
    },
  });

  const tRio = await prisma.trainer.upsert({
    where: { code: 'TR-RIO' },
    update: {},
    create: {
      code: 'TR-RIO',
      fullName: 'Rio Junior Putra',
      specialization: 'Hypertrophy & Bodybuilding',
      trainerType: 'FULL_TIME',
      phone: '081234567892',
      tier1Rate: 85000,
      tier2Rate: 105000,
      tier3Rate: 130000,
      salesCommissionPct: 5,
    },
  });

  const tJuliana = await prisma.trainer.upsert({
    where: { code: 'TR-JULIANA' },
    update: {},
    create: {
      code: 'TR-JULIANA',
      fullName: 'Juliana',
      specialization: 'Functional Training & Mobility',
      trainerType: 'FULL_TIME',
      phone: '081234567893',
      tier1Rate: 85000,
      tier2Rate: 105000,
      tier3Rate: 130000,
      salesCommissionPct: 5,
    },
  });

  console.log('--- Ensuring Members from screenshot exist ---');
  // Gunawan hartadijaya, Vincent Tehae, Vivian Lie
  const mGunawan = await prisma.member.upsert({
    where: { memberCode: 'KG-2026-0008' },
    update: {},
    create: {
      memberCode: 'KG-2026-0008',
      fullName: 'Gunawan hartadijaya',
      phone: '081299887711',
      email: 'gunawan.h@gmail.com',
      gender: 'L',
      status: 'ACTIVE',
      parkingActive: true,
    },
  });

  const mVincent = await prisma.member.upsert({
    where: { memberCode: 'KG-2026-0009' },
    update: {},
    create: {
      memberCode: 'KG-2026-0009',
      fullName: 'Vincent Tehae',
      phone: '081299887722',
      email: 'vincent.tehae@gmail.com',
      gender: 'L',
      status: 'ACTIVE',
      parkingActive: true,
    },
  });

  const mVivian = await prisma.member.upsert({
    where: { memberCode: 'KG-2026-0010' },
    update: {},
    create: {
      memberCode: 'KG-2026-0010',
      fullName: 'Vivian Lie',
      phone: '081299887733',
      email: 'vivian.lie@gmail.com',
      gender: 'P',
      status: 'ACTIVE',
      parkingActive: true,
    },
  });

  const pt12 = await prisma.ptPackage.findFirst({ where: { sessionCount: 12 } }) ||
    await prisma.ptPackage.create({
      data: { code: 'PT-12', name: 'Paket 12 Sesi PT', sessionCount: 12, validityDays: 60, price: 2000000 },
    });

  const pt24 = await prisma.ptPackage.findFirst({ where: { sessionCount: 24 } }) ||
    await prisma.ptPackage.create({
      data: { code: 'PT-24', name: 'Paket 24 Sesi PT', sessionCount: 24, validityDays: 90, price: 3750000 },
    });

  console.log('--- Adding Sample PT Assignments from screenshot ---');
  const existingGunawan = await prisma.memberPtContract.findFirst({ where: { memberId: mGunawan.id } });
  if (!existingGunawan) {
    await prisma.memberPtContract.create({
      data: {
        memberId: mGunawan.id,
        trainerId: tIndah.id,
        ptPackageId: pt24.id,
        totalSessions: 24,
        remainingSessions: 24,
        normalPrice: 3750000,
        discountPct: 0,
        totalPrice: 3750000,
        invoiceRef: 'INV-20261019-0008',
        startDate: new Date('2026-10-19'),
        expiryDate: new Date('2027-01-19'),
        status: 'ACTIVE',
        notes: 'Paket PT 24 Sesi - Target Recomp',
      },
    });
  }

  const existingVincent = await prisma.memberPtContract.findFirst({ where: { memberId: mVincent.id } });
  if (!existingVincent) {
    await prisma.memberPtContract.create({
      data: {
        memberId: mVincent.id,
        trainerId: tRio.id,
        ptPackageId: pt12.id,
        totalSessions: 12,
        remainingSessions: 12,
        normalPrice: 2000000,
        discountPct: 0,
        totalPrice: 2000000,
        invoiceRef: 'INV-20261019-0009',
        startDate: new Date('2026-10-19'),
        expiryDate: new Date('2026-12-19'),
        status: 'ACTIVE',
        notes: 'Paket PT 12 Sesi - Strength Foundation',
      },
    });
  }

  const existingVivian = await prisma.memberPtContract.findFirst({ where: { memberId: mVivian.id } });
  if (!existingVivian) {
    await prisma.memberPtContract.create({
      data: {
        memberId: mVivian.id,
        trainerId: tJuliana.id,
        ptPackageId: pt12.id,
        totalSessions: 12,
        remainingSessions: 12,
        normalPrice: 2000000,
        discountPct: 0,
        totalPrice: 2000000,
        invoiceRef: 'INV-20261019-0010',
        startDate: new Date('2026-10-19'),
        expiryDate: new Date('2026-12-19'),
        status: 'ACTIVE',
        notes: 'Paket PT 12 Sesi - Posture & Mobility',
      },
    });
  }

  console.log('✅ Sample PT Assignments successfully synchronized!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
