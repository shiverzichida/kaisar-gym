const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function seedTrainers() {
  const list = [
    { code: 'PT-035', fullName: 'Herry Chandra', phone: '08442321732', isActive: true },
    { code: 'PT-034', fullName: 'Juliana', phone: '08122500849', isActive: true },
    { code: 'PT-033', fullName: 'Hafizh', phone: '0895701958941', isActive: true },
    { code: 'PT-032', fullName: 'SELLY', phone: '08123456789', isActive: false },
    { code: 'PT-031', fullName: 'MEI', phone: '08565123', isActive: true },
  ];

  for (const item of list) {
    const existing = await prisma.trainer.findUnique({ where: { code: item.code } });
    if (!existing) {
      await prisma.trainer.create({
        data: {
          code: item.code,
          fullName: item.fullName,
          phone: item.phone,
          specialization: 'Pilates & Functional Trainer',
          trainerType: 'PILATES_INSTRUCTOR',
          isActive: item.isActive,
        },
      });
    }
  }

  // Add sample classes for MEI
  const mei = await prisma.trainer.findUnique({ where: { code: 'PT-031' } });
  if (mei) {
    const sampleClasses = [
      'PILATES MIX',
      'PILATES BODY FIT',
      'Pilates Reformer Ring',
      'Reformer Booty And Abs',
      'Reformer Burn',
      'Reformer Flow',
      'Reformer Strength',
      'Tower Flow',
      'Tower Strength',
    ];

    for (let i = 0; i < sampleClasses.length; i++) {
      const cName = sampleClasses[i];
      const code = 'CLS-' + cName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      let sc = await prisma.studioClass.findUnique({ where: { code } });
      if (!sc) {
        sc = await prisma.studioClass.create({
          data: {
            code,
            name: cName,
            category: 'PILATES',
            roomName: 'Ruang Pilates Sanctuary',
            maxCapacity: 12,
            isPaid: true,
            price: 150000,
          },
        });
      }

      const existingTpl = await prisma.classScheduleTemplate.findFirst({
        where: { studioClassId: sc.id, trainerId: mei.id },
      });
      if (!existingTpl) {
        await prisma.classScheduleTemplate.create({
          data: {
            studioClassId: sc.id,
            trainerId: mei.id,
            dayOfWeek: (i % 7) + 1,
            startTime: '09:00',
            endTime: '10:00',
            isActive: true,
          },
        });
      }
    }
  }

  console.log('Screenshot trainers seeded successfully!');
}

seedTrainers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
