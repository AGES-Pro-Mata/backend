const {
  PrismaClient,
  UserType,
  Category,
  WeekDay,
  TrailDifficulty,
  ReceiptType,
  ReceiptStatus,
  RequestType,
  HighlightCategory,
} = require('../generated/prisma');
const argon2 = require('argon2');

const prisma = new PrismaClient();
const crypto = require('crypto');

// Helper function to generate random date in 2025
function randomDate2025(startMonth = 1, endMonth = 12) {
  const month = Math.floor(Math.random() * (endMonth - startMonth + 1)) + startMonth;
  const day = Math.floor(Math.random() * 28) + 1; // Safe for all months
  const hour = Math.floor(Math.random() * 12) + 8; // 8am - 8pm
  return new Date(2025, month - 1, day, hour, 0, 0);
}

// Helper to add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  console.log('🌱 Starting database seeding with 2025 full-year data...');

  // Limpar dados existentes
  console.log('🧹 Limpando dados existentes...');
  await prisma.document.deleteMany();
  await prisma.member.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.requests.deleteMany();
  await prisma.reservationGroup.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.image.deleteMany();
  await prisma.highlight.deleteMany();
  await prisma.user.deleteMany();
  await prisma.address.deleteMany();

  // Criar Endereços
  console.log('📍 Criando endereços...');
  const addresses = await Promise.all([
    prisma.address.create({
      data: {
        street: 'Rua das Flores',
        number: '123',
        city: 'São Paulo',
        zip: '01234-567',
        country: 'Brasil',
      },
    }),
    prisma.address.create({
      data: {
        street: 'Av. Paulista',
        number: '1000',
        city: 'São Paulo',
        zip: '01310-100',
        country: 'Brasil',
      },
    }),
    prisma.address.create({
      data: {
        street: 'Rua Oscar Freire',
        number: '500',
        city: 'São Paulo',
        zip: '01426-001',
        country: 'Brasil',
      },
    }),
    prisma.address.create({
      data: {
        street: 'Rua Augusta',
        number: '2000',
        city: 'São Paulo',
        zip: '01304-001',
        country: 'Brasil',
      },
    }),
    prisma.address.create({
      data: {
        street: 'Av. Ipiranga',
        number: '344',
        city: 'Porto Alegre',
        zip: '90160-090',
        country: 'Brasil',
      },
    }),
    prisma.address.create({
      data: {
        street: 'Rua da Praia',
        number: '700',
        city: 'Porto Alegre',
        zip: '90010-270',
        country: 'Brasil',
      },
    }),
    prisma.address.create({
      data: {
        street: 'Av. Atlântica',
        number: '1500',
        city: 'Rio de Janeiro',
        zip: '22021-001',
        country: 'Brasil',
      },
    }),
    prisma.address.create({
      data: {
        street: 'Rua das Laranjeiras',
        number: '320',
        city: 'Rio de Janeiro',
        zip: '22240-005',
        country: 'Brasil',
      },
    }),
    prisma.address.create({
      data: {
        street: '123 Main Street',
        number: '456',
        city: 'New York',
        zip: '10001',
        country: 'United States',
      },
    }),
    prisma.address.create({
      data: {
        street: 'Calle Mayor',
        number: '78',
        city: 'Madrid',
        zip: '28013',
        country: 'Spain',
      },
    }),
    prisma.address.create({
      data: {
        street: 'Rua XV de Novembro, 500',
        number: '500',
        city: 'Curitiba',
        zip: '80000-000',
        country: 'Brazil',
      },
    }),
    prisma.address.create({
      data: {
        street: 'Av. Goiás, 250',
        number: '250',
        city: 'Goiânia',
        zip: '74000-000',
        country: 'Brazil',
      },
    }),
  ]);

  // Simple password for demo purposes
  // password123
  const demoPassword = await argon2.hash(
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    },
  );

  const rootUser = await prisma.user.create({
    data: {
      userType: UserType.ROOT,
      name: 'Admin Root',
      email: 'root@sistema.com',
      password: demoPassword,
      phone: '11999999999',
      document: '11111111111',
      gender: 'Masculino',
      rg: '111111111',
      institution: 'Sistema',
      isForeign: false,
      verified: true,
      addressId: addresses[0].id,
    },
  });

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
      institution: 'Pro-Mata',
      isForeign: false,
      verified: true,
      addressId: addresses[1].id,
      createdByUserId: rootUser.id,
    },
  });

  // Create PROFESSOR users
  const professors = await Promise.all([
    prisma.user.create({
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
    }),
    prisma.user.create({
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
    }),
    prisma.user.create({
      data: {
        userType: UserType.PROFESSOR,
        name: 'Dr. Ricardo Almeida',
        email: 'ricardo.almeida@ufmg.br',
        password: demoPassword,
        phone: '+55 31 95555-5555',
        document: '888.888.888-88',
        gender: 'Male',
        rg: '88.888.888-8',
        institution: 'Universidade Federal de Minas Gerais',
        isForeign: false,
        verified: true,
        addressId: addresses[4].id,
        createdByUserId: adminUser.id,
      },
    }),
  ]);

  // Create GUEST users
  const guests = await Promise.all([
    prisma.user.create({
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
        verified: true,
        addressId: addresses[5].id,
        createdByUserId: professors[0].id,
      },
    }),
    prisma.user.create({
      data: {
        userType: UserType.GUEST,
        name: 'John Smith',
        email: 'john.smith@international.com',
        password: demoPassword,
        phone: '+1 555-123-4567',
        document: null,
        gender: 'Male',
        rg: null,
        institution: 'International Research Institute',
        isForeign: true,
        verified: true,
        addressId: addresses[6].id,
        createdByUserId: adminUser.id,
      },
    }),
    prisma.user.create({
      data: {
        userType: UserType.GUEST,
        name: 'Beatriz Mendes',
        email: 'beatriz.mendes@gmail.com',
        password: demoPassword,
        phone: '+55 41 94444-4444',
        document: '999.999.999-99',
        gender: 'Female',
        rg: '99.999.999-9',
        institution: 'ONG Natureza Viva',
        isForeign: false,
        verified: true,
        addressId: addresses[7].id,
        createdByUserId: professors[1].id,
      },
    }),
  ]);

  // Create Images for Experiences
  const images = await Promise.all([
    prisma.image.create({
      data: { url: 'https://images.unsplash.com/photo-1551632811-561732d1e306' },
    }),
    prisma.image.create({
      data: { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b' },
    }),
    prisma.image.create({
      data: { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4' },
    }),
    prisma.image.create({
      data: { url: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c' },
    }),
    prisma.image.create({
      data: { url: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c' },
    }),
    prisma.image.create({
      data: { url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb' },
    }),
    prisma.image.create({
      data: { url: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5' },
    }),
    prisma.image.create({
      data: { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d' },
    }),
    prisma.image.create({
      data: { url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801' },
    }),
    prisma.image.create({
      data: { url: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e' },
    }),
    prisma.image.create({
      data: { url: 'https://images.unsplash.com/photo-1571863533956-01c88e79957e' },
    }),
    prisma.image.create({
      data: { url: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952' },
    }),
    prisma.image.create({
      data: { url: 'https://images.unsplash.com/photo-1587691592099-24045742c181' },
    }),
    prisma.image.create({
      data: { url: 'https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0' },
    }),
    prisma.image.create({
      data: { url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf' },
    }),
  ]);

  // Create Experiences (Trails, Hosting, Laboratory, Events)
  const experiences = await Promise.all([
    // TRAILS
    prisma.experience.create({
      data: {
        name: 'Trilha da Cascata',
        description:
          'Caminhada de 5km até a bela Cascata das Antas, passando por mata nativa preservada.',
        category: 'TRAIL',
        capacity: 15,
        price: 50.0,
        weekDays: ['SATURDAY', 'SUNDAY'],
        durationMinutes: 240,
        trailDifficulty: 'MODERATED',
        trailLength: 5.0,
        active: true,
        imageId: images[0].id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Trilha Mata Atlântica',
        description:
          'Percurso educativo pela Mata Atlântica, com paradas para observação de fauna e flora.',
        category: 'TRAIL',
        capacity: 20,
        price: 40.0,
        weekDays: ['FRIDAY', 'SATURDAY', 'SUNDAY'],
        durationMinutes: 180,
        trailDifficulty: 'LIGHT',
        trailLength: 3.5,
        active: true,
        imageId: images[1].id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      },
    }),

    // HOSTING
    prisma.experience.create({
      data: {
        name: 'Hospedagem Cabana Ecológica',
        description:
          'Cabanas confortáveis no meio da mata, com energia solar e banheiro compostável.',
        category: 'HOSTING',
        capacity: 4,
        price: 200.0,
        weekDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        durationMinutes: 1440, // 24h
        active: true,
        imageId: images[2].id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Camping Sustentável',
        description: 'Área de camping com estrutura básica, banheiros e chuveiros quentes.',
        category: 'HOSTING',
        capacity: 30,
        price: 50.0,
        weekDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        durationMinutes: 1440,
        active: true,
        imageId: images[3].id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      },
    }),

    // LABORATORY
    prisma.experience.create({
      data: {
        name: 'Laboratório de Biodiversidade',
        description:
          'Uso do laboratório equipado para pesquisas de biodiversidade, microscópios e reagentes.',
        category: 'LABORATORY',
        capacity: 10,
        price: 150.0,
        weekDays: ['TUESDAY', 'WEDNESDAY', 'THURSDAY'],
        durationMinutes: 480, // 8h
        active: true,
        imageId: images[4].id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Laboratório de Botânica',
        description: 'Espaço para estudos botânicos com herbário, estufas e materiais de coleta.',
        category: 'LABORATORY',
        capacity: 8,
        price: 120.0,
        weekDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        durationMinutes: 480,
        active: true,
        imageId: images[5].id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      },
    }),

    // EVENTS
    prisma.experience.create({
      data: {
        name: 'Workshop de Educação Ambiental',
        description: 'Workshop sobre conservação da Mata Atlântica e desenvolvimento sustentável.',
        category: 'EVENT',
        capacity: 50,
        price: 80.0,
        durationMinutes: 360, // 6h
        active: true,
        imageId: images[6].id,
        startDate: new Date('2025-02-15T09:00:00'),
        endDate: new Date('2025-02-15T15:00:00'),
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Observação de Aves Noturnas',
        description:
          'Evento especial para observação e identificação de aves noturnas com guia especializado.',
        category: 'EVENT',
        capacity: 25,
        price: 60.0,
        durationMinutes: 240,
        active: true,
        imageId: images[7].id,
        startDate: new Date('2025-03-20T19:00:00'),
        endDate: new Date('2025-03-20T23:00:00'),
      },
    }),
  ]);

  // Create Highlights
  await Promise.all([
    prisma.highlight.create({
      data: {
        category: 'CAROUSEL',
        imageUrl: images[4].url,
        title: 'Bem-vindo ao Pro-Mata',
        description: 'Centro de Pesquisa e Conservação da Mata Atlântica',
        order: 1,
      },
    }),
    prisma.highlight.create({
      data: {
        category: 'CAROUSEL',
        imageUrl: images[5].url,
        title: 'Biodiversidade Única',
        description: 'Mais de 400 espécies de fauna e flora catalogadas',
        order: 2,
      },
    }),
    prisma.highlight.create({
      data: {
        category: 'TRAIL',
        imageUrl: images[6].url,
        title: 'Trilhas Ecológicas',
        description: 'Explore a natureza em trilhas guiadas',
        order: 1,
      },
    }),
    prisma.highlight.create({
      data: {
        category: 'LABORATORY',
        imageUrl: images[2].url,
        title: 'Pesquisa Científica',
        description: 'Infraestrutura completa para pesquisa',
        order: 1,
      },
    }),
    prisma.highlight.create({
      data: {
        category: 'HOSTING',
        imageUrl: images[1].url,
        title: 'Hospedagem Sustentável',
        description: 'Fique imerso na natureza',
        order: 1,
      },
    }),
    prisma.highlight.create({
      data: {
        category: 'EVENT',
        imageUrl: images[2].url,
        title: 'Eventos Educativos',
        description: 'Workshops e palestras sobre conservação',
        order: 1,
      },
    }),
  ]);

  console.log('Creating reservations throughout 2025...');

  // Generate reservations for the entire year 2025
  const allUsers = [adminUser, ...professors, ...guests];
  const reservationGroups = [];
  const reservations = [];
  let totalMembers = 0;
  let totalDocuments = 0;
  let totalRequests = 0;

  // Create reservations spread throughout the year
  for (let month = 1; month <= 12; month++) {
    // Each month: 3-5 reservations
    const reservationsThisMonth = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < reservationsThisMonth; i++) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const randomExperience = experiences[Math.floor(Math.random() * experiences.length)];

      const createdDate = new Date(2025, month - 1, Math.floor(Math.random() * 28) + 1, 10, 0, 0);
      const startDate = new Date(2025, month - 1, Math.floor(Math.random() * 28) + 1, 8, 0, 0);
      const endDate = addDays(
        startDate,
        randomExperience.category === 'HOSTING' ? Math.floor(Math.random() * 3) + 1 : 0,
      );

      if (randomExperience.category !== 'HOSTING') {
        endDate.setHours(startDate.getHours() + Math.floor(randomExperience.durationMinutes / 60));
      }

      const reservationGroup = await prisma.reservationGroup.create({
        data: {
          userId: randomUser.id,
          active: Math.random() > 0.1, // 90% active
          createdAt: createdDate,
        },
      });
      reservationGroups.push(reservationGroup);

      const reservation = await prisma.reservation.create({
        data: {
          userId: randomUser.id,
          experienceId: randomExperience.id,
          reservationGroupId: reservationGroup.id,
          startDate: startDate,
          endDate: endDate,
          notes: `Reserva para ${randomExperience.name} - ${month}/${2025}`,
          active: reservationGroup.active,
          createdAt: createdDate,
        },
      });
      reservations.push(reservation);

      // Create members for this reservation
      const numMembers = Math.floor(Math.random() * 5) + 1;
      for (let m = 0; m < numMembers; m++) {
        await prisma.member.create({
          data: {
            name: `Participante ${totalMembers + m + 1}`,
            document:
              Math.random() > 0.2
                ? `${Math.floor(Math.random() * 900 + 100)}.${Math.floor(Math.random() * 900 + 100)}.${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 90 + 10)}`
                : null,
            gender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)],
            reservationGroupId: reservationGroup.id,
          },
        });
      }
      totalMembers += numMembers;

      // Create documents (50% chance)
      if (Math.random() > 0.5) {
        await prisma.document.create({
          data: {
            reservationId: reservation.id,
            url: `https://example.com/documents/doc-${totalDocuments + 1}.pdf`,
            uploadedByUserId: randomUser.id,
          },
        });
        totalDocuments++;
      }

      // Create workflow requests
      const requestTypes = ['CREATED', 'PEOPLE_SENT', 'DOCUMENT_REQUESTED', 'APPROVED'];
      const statusFlow = Math.random() > 0.3 ? requestTypes : ['CREATED', 'CANCELED'];

      for (let r = 0; r < statusFlow.length; r++) {
        await prisma.requests.create({
          data: {
            type: statusFlow[r],
            description: `${statusFlow[r]} - Reserva ${reservation.id.substring(0, 8)}`,
            createdByUserId: r === 0 ? randomUser.id : adminUser.id,
            reservationGroupId: reservationGroup.id,
            createdAt: addDays(createdDate, r),
          },
        });
        totalRequests++;
      }
    }
  }

  // Create receipts spread throughout the year
  console.log('Creating receipts throughout 2025...');
  const receipts = [];
  for (let month = 1; month <= 12; month++) {
    const receiptsThisMonth = Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < receiptsThisMonth; i++) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const receiptType = Math.random() > 0.5 ? 'PAYMENT' : 'DOCENCY';
      const value =
        receiptType === 'PAYMENT'
          ? Math.floor(Math.random() * 200) + 50
          : Math.floor(Math.random() * 300) + 100;
      const status = ['PENDING', 'ACTIVE', 'EXPIRED'][Math.floor(Math.random() * 3)];

      const receipt = await prisma.receipt.create({
        data: {
          type: receiptType,
          url: `https://example.com/receipts/receipt-${month}-${i}.pdf`,
          value: value,
          status: status,
          userId: randomUser.id,
          createdAt: new Date(2025, month - 1, Math.floor(Math.random() * 28) + 1),
        },
      });
      receipts.push(receipt);
    }
  }

  // Create password reset tokens
  await Promise.all([
    prisma.passwordResetToken.create({
      data: {
        token: 'active-token-123',
        userId: guests[0].id,
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        isActive: true,
      },
    }),
    prisma.passwordResetToken.create({
      data: {
        token: 'expired-token-456',
        userId: professors[0].id,
        expiredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isActive: false,
      },
    }),
  ]);

  console.log('✅ Seed concluído com sucesso!');
  console.log(`
📊 Created (2025 Full Year Data):
- ${allUsers.length} Users (1 ROOT, 1 ADMIN, ${professors.length} PROFESSORS, ${guests.length} GUESTS)
- ${addresses.length} Addresses
- ${receipts.length} Receipts (spread throughout 2025)
- 2 Password Reset Tokens
- ${images.length} Images
- ${experiences.length} Experiences (2 Trails, 2 Hosting, 2 Labs, 2 Events)
- 6 Highlights
- ${reservationGroups.length} Reservation Groups
- ${reservations.length} Reservations (Jan-Dec 2025)
- ${totalMembers} Members
- ${totalDocuments} Documents
- ${totalRequests} Requests (workflow tracking)

👥 Sample Users:
- root@company.com (ROOT) - password: password123
- admin@company.com (ADMIN) - password: password123
- joao.santos@university.edu.br (PROFESSOR) - password: password123
- ana.costa@university.edu.br (PROFESSOR) - password: password123
- ricardo.almeida@ufmg.br (PROFESSOR) - password: password123
- carlos@email.com (GUEST) - password: password123
- john.smith@international.com (GUEST) - password: password123
- beatriz.mendes@gmail.com (GUEST) - password: password123

🎯 Experiences Available:
TRAILS:
  - Trilha da Cascata (MODERATED, 5km, R$50)
  - Trilha Mata Atlântica (LIGHT, 3.5km, R$40)
HOSTING:
  - Cabana Ecológica (R$200/day)
  - Camping Sustentável (R$50/day)
LABORATORY:
  - Lab. Biodiversidade (R$150/8h)
  - Lab. Botânica (R$120/8h)
EVENTS:
  - Workshop Educação Ambiental (R$80)
  - Observação de Aves Noturnas (R$60)

📈 Data Distribution:
- Reservations: ~${Math.floor(reservations.length / 12)} per month average
- Receipts: ~${Math.floor(receipts.length / 12)} per month average
- Status: ~${Math.floor((reservations.filter((r) => r.active).length / reservations.length) * 100)}% active reservations

💡 Ready for Metabase Dashboards:
- Monthly reservation trends
- Revenue by category and period
- Capacity utilization by experience
- User type distribution
- Workflow status tracking
- Payment status analysis
  `);
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
