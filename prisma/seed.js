const { PrismaClient, UserType } = require('../generated/prisma');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create addresses first
  const addresses = await Promise.all([
    prisma.address.create({
      data: {
        street: 'Rua das Flores, 123',
        number: '123',
        city: 'São Paulo',
        zip: '01234-567',
        country: 'Brazil',
      },
    }),
    prisma.address.create({
      data: {
        street: 'Av. Paulista, 456',
        number: '456',
        city: 'São Paulo',
        zip: '04567-890',
        country: 'Brazil',
      },
    }),
    prisma.address.create({
      data: {
        street: 'Rua do Comércio, 789',
        number: '789',
        city: 'Rio de Janeiro',
        zip: '12345-678',
        country: 'Brazil',
      },
    }),
    prisma.address.create({
      data: {
        street: '123 Main St',
        number: '123',
        city: 'New York',
        zip: '10001',
        country: 'USA',
      },
    }),
    prisma.address.create({
      data: {
        street: 'Rua das Acácias, 321',
        number: '321',
        city: 'Belo Horizonte',
        zip: '30000-000',
        country: 'Brazil',
      },
    }),
    prisma.address.create({
      data: {
        street: 'Av. Brasil, 987',
        number: '987',
        city: 'Salvador',
        zip: '40000-000',
        country: 'Brazil',
      },
    }),
  ]);

  // Simple password for demo purposes (in real apps, use proper hashing)
  const demoPassword = 'password123';

  // Create ROOT user
  const rootUser = await prisma.user.create({
    data: {
      userType: UserType.ROOT,
      name: 'Sistema Root',
      email: 'root@company.com',
      password: demoPassword,
      phone: '+55 11 99999-9999',
      document: '000.000.000-00',
      gender: 'Other',
      rg: '00.000.000-0',
      institution: 'Sistema',
      isForeign: false,
      verified: true,
      addressId: addresses[0].id,
    },
  });

  // Create ADMIN user
  const adminUser = await prisma.user.create({
    data: {
      userType: UserType.ADMIN,
      name: 'Maria Silva',
      email: 'admin@company.com',
      password: demoPassword,
      phone: '+55 11 98888-8888',
      document: '111.111.111-11',
      gender: 'Female',
      rg: '11.111.111-1',
      institution: 'Tech Company',
      isForeign: false,
      verified: true,
      addressId: addresses[1].id,
      createdByUserId: rootUser.id,
    },
  });

  // Create PROFESSOR users
  const professor1 = await prisma.user.create({
    data: {
      userType: UserType.PROFESSOR,
      name: 'Dr. João Santos',
      email: 'joao.santos@university.edu.br',
      password: demoPassword,
      phone: '+55 21 97777-7777',
      document: '222.222.222-22',
      gender: 'Male',
      rg: '22.222.222-2',
      institution: 'Universidade Federal do Rio de Janeiro',
      isForeign: false,
      verified: true,
      addressId: addresses[2].id,
      createdByUserId: adminUser.id,
    },
  });

  const professor2 = await prisma.user.create({
    data: {
      userType: UserType.PROFESSOR,
      name: 'Dra. Ana Costa',
      email: 'ana.costa@university.edu.br',
      password: demoPassword,
      phone: '+55 11 96666-6666',
      document: '333.333.333-33',
      gender: 'Female',
      rg: '33.333.333-3',
      institution: 'Universidade de São Paulo',
      isForeign: false,
      verified: true,
      addressId: addresses[3].id,
      createdByUserId: adminUser.id,
    },
  });

  // Create GUEST users (including foreign user)
  const guest1 = await prisma.user.create({
    data: {
      userType: UserType.GUEST,
      name: 'Carlos Oliveira',
      email: 'carlos@email.com',
      password: demoPassword,
      phone: '+55 11 95555-5555',
      document: '444.444.444-44',
      gender: 'Male',
      rg: '44.444.444-4',
      institution: 'Empresa ABC',
      isForeign: false,
      verified: false,
      addressId: addresses[4].id,
      createdByUserId: professor1.id,
    },
  });

  const foreignGuest = await prisma.user.create({
    data: {
      userType: UserType.GUEST,
      name: 'John Smith',
      email: 'john.smith@international.com',
      password: demoPassword,
      phone: '+1 555-123-4567',
      document: null,
      gender: 'Male',
      rg: null,
      institution: 'International Corp',
      isForeign: true,
      verified: true,
      addressId: addresses[5].id,
      createdByUserId: adminUser.id,
    },
  });

  // Create some receipts
  await Promise.all([
    prisma.receipt.create({
      data: {
        type: 'PAYMENT',
        url: 'https://example.com/receipt1.pdf',
        value: 100.0,
        userId: professor1.id,
      },
    }),
    prisma.receipt.create({
      data: {
        type: 'DOCENCY',
        url: 'https://example.com/receipt2.pdf',
        value: 250.0,
        userId: professor2.id,
      },
    }),
    prisma.receipt.create({
      data: {
        type: 'PAYMENT',
        url: 'https://example.com/receipt3.pdf',
        value: 75.5,
        userId: guest1.id,
      },
    }),
    prisma.receipt.create({
      data: {
        type: 'DOCENCY',
        url: 'https://example.com/receipt4.pdf',
        value: 300.0,
        userId: foreignGuest.id,
      },
    }),
  ]);

  // Create password reset tokens (some active, some expired)
  await Promise.all([
    prisma.passwordResetToken.create({
      data: {
        token: 'active-token-123',
        userId: guest1.id,
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        createdAt: new Date(),
        isActive: true,
      },
    }),
    prisma.passwordResetToken.create({
      data: {
        token: 'expired-token-456',
        userId: professor1.id,
        expiredAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        isActive: false,
      },
    }),
  ]);

  console.log('✅ Database seeding completed!');
  console.log(`
📊 Created:
- 6 Users (1 ROOT, 1 ADMIN, 2 PROFESSORS, 2 GUESTS)
- 4 Addresses (3 Brazilian, 1 International)
- 4 Receipts
- 2 Password Reset Tokens

👥 Sample Users:
- root@company.com (ROOT) - password: password123
- admin@company.com (ADMIN) - password: password123  
- joao.santos@university.edu.br (PROFESSOR) - password: password123
- ana.costa@university.edu.br (PROFESSOR) - password: password123
- carlos@email.com (GUEST) - password: password123
- john.smith@international.com (GUEST) - password: password123

🔗 User relationships:
- ROOT created ADMIN
- ADMIN created both PROFESSORS and foreign GUEST  
- PROFESSOR João created GUEST Carlos
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
