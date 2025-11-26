const { PrismaClient, UserType } = require('../generated/prisma');
const argon2 = require('argon2');
const generateCpf = require('gerar-cpf');

const prisma = new PrismaClient();

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRG() {
  const n1 = randomInt(10, 99);
  const n2 = randomInt(100, 999);
  const n3 = randomInt(100, 999);
  const n4 = randomInt(1, 9);
  return `${n1}.${n2}.${n3}-${n4}`;
}

const BRAZILIAN_CITIES = [
  { city: 'São Paulo', state: 'SP', country: 'Brasil' },
  { city: 'Rio de Janeiro', state: 'RJ', country: 'Brasil' },
  { city: 'Porto Alegre', state: 'RS', country: 'Brasil' },
  { city: 'Curitiba', state: 'PR', country: 'Brasil' },
  { city: 'Belo Horizonte', state: 'MG', country: 'Brasil' },
  { city: 'Brasília', state: 'DF', country: 'Brasil' },
  { city: 'Salvador', state: 'BA', country: 'Brasil' },
  { city: 'Fortaleza', state: 'CE', country: 'Brasil' },
  { city: 'Recife', state: 'PE', country: 'Brasil' },
  { city: 'Florianópolis', state: 'SC', country: 'Brasil' },
];

const STREET_NAMES = [
  'Rua das Flores',
  'Av. Paulista',
  'Rua Oscar Freire',
  'Rua Augusta',
  'Av. Ipiranga',
  'Rua da Praia',
  'Av. Atlântica',
  'Rua das Laranjeiras',
  'Av. Beira Mar',
  'Rua XV de Novembro',
  'Av. Goiás',
  'Rua Sete de Setembro',
];

const FIRST_NAMES = [
  'João',
  'Maria',
  'Ana',
  'Pedro',
  'Carlos',
  'Beatriz',
  'Ricardo',
  'Fernanda',
  'Paulo',
  'Juliana',
  'Lucas',
  'Camila',
  'Felipe',
  'Amanda',
  'Rafael',
  'Patrícia',
  'Bruno',
  'Gabriela',
  'Rodrigo',
  'Larissa',
  'Diego',
  'Renata',
  'Thiago',
  'Vanessa',
  'Marcos',
  'Letícia',
  'André',
  'Mariana',
  'Guilherme',
  'Carolina',
];

const LAST_NAMES = [
  'Silva',
  'Santos',
  'Costa',
  'Oliveira',
  'Souza',
  'Almeida',
  'Ferreira',
  'Pereira',
  'Lima',
  'Rodrigues',
  'Mendes',
  'Gomes',
  'Martins',
  'Carvalho',
  'Ribeiro',
  'Barbosa',
];

const INSTITUTIONS = [
  'Universidade Federal do Rio de Janeiro',
  'Universidade de São Paulo',
  'Universidade Federal de Minas Gerais',
  'Universidade Federal do Rio Grande do Sul',
  'Universidade Estadual de Campinas',
  'Universidade Federal de Santa Catarina',
  'Universidade de Brasília',
  'Universidade Federal do Paraná',
];

async function main() {
  console.log('🌱 Iniciando seed com GRANDE VOLUME DE DADOS...\n');

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
  console.log('✓ Dados limpos\n');

  // Criar Endereços (200)
  console.log('📍 Criando 200 endereços...');
  const addresses = [];
  for (let i = 0; i < 200; i++) {
    const location = randomChoice(BRAZILIAN_CITIES);
    const street = randomChoice(STREET_NAMES);
    const address = await prisma.address.create({
      data: {
        street: street,
        number: `${randomInt(1, 9999)}`,
        city: location.city,
        zip: `${randomInt(10000, 99999)}-${randomInt(100, 999)}`,
        country: location.country,
      },
    });
    addresses.push(address);
  }
  console.log(`✓ ${addresses.length} endereços criados\n`);

  // Password (password123)
  const demoPassword = await argon2.hash(
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    },
  );

  // ROOT
  console.log('👤 Criando usuários...');
  const rootUser = await prisma.user.create({
    data: {
      userType: UserType.ROOT,
      name: 'Admin Root',
      email: 'root@promata.com',
      password: demoPassword,
      phone: '(51) 99999-9999',
      document: '00000000000',
      gender: 'Masculino',
      rg: '0000000000',
      institution: 'Pro-Mata',
      isForeign: false,
      verified: true,
      addressId: addresses[0].id,
    },
  });

  // ADMIN (10)
  const admins = [];
  for (let i = 0; i < 5; i++) {
    const firstName = randomChoice(FIRST_NAMES);
    const lastName = randomChoice(LAST_NAMES);
    const admin = await prisma.user.create({
      data: {
        userType: UserType.ADMIN,
        name: `${firstName} ${lastName}`,
        email: `admin${i + 1}@promata.com`,
        password: demoPassword,
        phone: `(${randomInt(11, 99)}) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        document: generateCpf(),
        gender: randomChoice(['Masculino', 'Feminino']),
        rg: generateRG(),
        institution: 'Pro-Mata',
        isForeign: false,
        verified: true,
        addressId: addresses[i + 1].id,
        createdByUserId: rootUser.id,
      },
    });
    admins.push(admin);
  }

  // PROFESSOR (60)
  const professors = [];
  for (let i = 0; i < 20; i++) {
    const firstName = randomChoice(FIRST_NAMES);
    const lastName = randomChoice(LAST_NAMES);
    const professor = await prisma.user.create({
      data: {
        userType: UserType.PROFESSOR,
        name: `Prof. ${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@university.br`,
        password: demoPassword,
        phone: `(${randomInt(11, 99)}) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        document: generateCpf(),
        gender: randomChoice(['Masculino', 'Feminino']),
        rg: generateRG(),
        institution: randomChoice(INSTITUTIONS),
        isForeign: false,
        verified: Math.random() > 0.1,
        addressId: addresses[11 + i].id,
        createdByUserId: randomChoice(admins).id,
      },
    });
    professors.push(professor);
  }

  // GUEST (80)
  const guests = [];
  for (let i = 0; i < 80; i++) {
    const firstName = randomChoice(FIRST_NAMES);
    const lastName = randomChoice(LAST_NAMES);
    const isForeign = Math.random() > 0.85;
    const guest = await prisma.user.create({
      data: {
        userType: UserType.GUEST,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
        password: demoPassword,
        phone: isForeign
          ? `+${randomInt(1, 99)} ${randomInt(100, 999)}-${randomInt(1000, 9999)}`
          : `(${randomInt(11, 99)}) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        document: isForeign ? null : generateCpf(),
        gender: randomChoice(['Masculino', 'Feminino']),
        rg: isForeign ? null : generateRG(),
        institution: isForeign
          ? 'International'
          : randomChoice(['Empresa Tech', 'ONG', 'Instituto']),
        isForeign: isForeign,
        verified: true,
        addressId: addresses[71 + i].id,
        createdByUserId: randomChoice([...admins, ...professors]).id,
      },
    });
    guests.push(guest);
  }
  console.log(
    `✓ 1 ROOT + ${admins.length} ADMIN + ${professors.length} PROFESSORES + ${guests.length} GUESTS\n`,
  );

  console.log('🖼️  Criando imagens...');

  urls = [
    'https://promata-storage-dev.s3.us-east-2.amazonaws.com/experiences/f5703517cae3b365e6d68f64151d144a', // Quarto rústico
    'https://promata-storage-dev.s3.us-east-2.amazonaws.com/experiences/22b83d04371d00f34b169837854ee133', // Trilha
    'https://promata-storage-dev.s3.us-east-2.amazonaws.com/experiences/05689650485fdbdf6fad3fb00471be28', // Laboratorio botanica
    'https://promata-storage-dev.s3.us-east-2.amazonaws.com/experiences/7ef417424a614afaf09907c0f32a8b8f', // Céu estrelado noturo (evento de observação de astros)
    'https://promata-storage-dev.s3.us-east-2.amazonaws.com/experiences/3eb2c7c8532bb128c638b8d6829844d7', // Evento de festa
    'https://promata-storage-dev.s3.us-east-2.amazonaws.com/experiences/5272a359d87cc8731e16ffee325fa5d4', // Quarto rustico 2
    'https://promata-storage-dev.s3.us-east-2.amazonaws.com/experiences/68bdcba34f92108815afa5e87cb4c17d', // Laboratorio rustico
  ];

  const images = [];
  for (let i = 0; i < urls.length; i++) {
    const image = await prisma.image.create({
      data: {
        url: urls[i],
        active: Math.random() > 0.05,
      },
    });
    images.push(image);
  }
  console.log(`✓ ${images.length} imagens\n`);

  // EXPERIÊNCIAS
  console.log('🏞️  Criando experiências...');
  const experiences = [];

  // TRILHAS (20)
  const trailNames = [
    'Trilha da Cascata',
    'Trilha Mata Atlântica',
    'Trilha do Mirante',
    'Trilha das Araucárias',
    'Trilha do Rio Verde',
    'Trilha da Serra',
    'Trilha dos Pássaros',
    'Trilha do Córrego',
    'Trilha das Bromélias',
    'Trilha do Pico Alto',
    'Trilha da Pedra Grande',
  ];

  for (let i = 0; i < trailNames.length; i++) {
    const difficulty = randomChoice(['LIGHT', 'MODERATED', 'HEAVY', 'EXTREME']);
    const length = randomInt(20, 150) / 10;
    const experience = await prisma.experience.create({
      data: {
        name: trailNames[i],
        description: `Trilha de ${length}km com nível ${difficulty}.`,
        category: 'TRAIL',
        capacity: randomInt(10, 30),
        price: randomInt(30, 100),
        weekDays: randomChoice([
          ['SATURDAY', 'SUNDAY'],
          ['FRIDAY', 'SATURDAY', 'SUNDAY'],
          ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        ]),
        durationMinutes: randomInt(120, 480),
        trailDifficulty: difficulty,
        trailLength: length,
        active: Math.random() > 0.1,
        imageId: randomChoice(images).id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      },
    });
    experiences.push(experience);
  }

  // HOSPEDAGENS (15)
  const hostingNames = [
    'Cabana Premium',
    'Chalé da Mata',
    'Casa na Árvore',
    'Camping Sustentável',
    'Alojamento Coletivo',
    'Refúgio da Serra',
    'Dormitório Eco',
    'Suíte Vista',
    'Chalé Familiar',
    'Camping Privativo',
    'Bangalô Rústico',
  ];

  for (let i = 0; i < hostingNames.length; i++) {
    const experience = await prisma.experience.create({
      data: {
        name: hostingNames[i],
        description: `Hospedagem ${hostingNames[i]} com estrutura completa.`,
        category: 'HOSTING',
        capacity: randomInt(2, 8),
        price: randomInt(80, 400),
        weekDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        durationMinutes: 1440,
        active: Math.random() > 0.05,
        imageId: randomChoice(images).id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      },
    });
    experiences.push(experience);
  }

  // LABORATÓRIOS (12)
  const labNames = [
    'Lab. Botânica',
    'Lab. Ecologia',
    'Lab. Genética',
    'Lab. Microbiologia',
    'Lab. Química Ambiental',
    'Lab. Solos',
    'Lab. Entomologia',
    'Lab. Zoologia',
    'Lab. Climatologia',
    'Lab. Análises Ambientais',
    'Lab. Multiuso',
  ];

  for (let i = 0; i < labNames.length; i++) {
    const experience = await prisma.experience.create({
      data: {
        name: labNames[i],
        description: `${labNames[i]} equipado para pesquisas.`,
        category: 'LABORATORY',
        capacity: randomInt(5, 15),
        price: randomInt(100, 300),
        weekDays: randomChoice([
          ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
          ['TUESDAY', 'THURSDAY'],
        ]),
        durationMinutes: randomInt(240, 480),
        active: Math.random() > 0.05,
        imageId: randomChoice(images).id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      },
    });
    experiences.push(experience);
  }

  // EVENTOS (35)
  const eventNames = [
    'Workshop Ambiental',
    'Observação de Aves',
    'Curso Fotografia',
    'Palestra Conservação',
    'Oficina Botânica',
    'Seminário Biodiversidade',
    'Workshop Fauna',
    'Curso Ecologia',
    'Palestra Clima',
    'Workshop Restauração',
    'Curso Ornitologia',
    'Seminário Sustentabilidade',
  ];

  for (let i = 0; i < 11; i++) {
    const month = randomInt(1, 12);
    const day = randomInt(1, 28);
    const startDate = new Date(2025, month - 1, day, randomInt(8, 14), 0, 0);
    const durationHours = randomInt(3, 8);
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + durationHours);

    const experience = await prisma.experience.create({
      data: {
        name: randomChoice(eventNames),
        description: `Evento especial. Duração: ${durationHours}h.`,
        category: 'EVENT',
        capacity: randomInt(20, 80),
        price: randomInt(50, 150),
        durationMinutes: durationHours * 60,
        active: Math.random() > 0.05,
        imageId: randomChoice(images).id,
        startDate: startDate,
        endDate: endDate,
      },
    });
    experiences.push(experience);
  }
  console.log(`✓ ${experiences.length} experiências\n`);

  // HIGHLIGHTS (17 total: 5 CAROUSEL + 3 de cada outra categoria)
  console.log('⭐ Criando highlights...');
  const highlightConfig = [
    { category: 'CAROUSEL', count: 5 },
    { category: 'TRAIL', count: 3 },
    { category: 'HOSTING', count: 3 },
    { category: 'LABORATORY', count: 3 },
    { category: 'EVENT', count: 3 },
  ];

  let highlightOrder = 1;
  for (const config of highlightConfig) {
    for (let i = 0; i < config.count; i++) {
      await prisma.highlight.create({
        data: {
          category: config.category,
          imageUrl: randomChoice(images).url,
          title: `Destaque ${config.category} ${i + 1}`,
          description: `Descrição ${config.category}`,
          order: highlightOrder++,
        },
      });
    }
  }
  console.log(`✓ ${highlightOrder - 1} highlights\n`);

  // RESERVAS E RELACIONADOS
  console.log('📅 Criando reservas (pode levar alguns minutos)...');

  const allUsers = [rootUser, ...admins, ...professors, ...guests];
  let totalReservationGroups = 0;
  let totalReservations = 0;
  let totalMembers = 0;
  let totalDocuments = 0;
  let totalRequests = 0;
  const paymentReceiptCandidates = [];

  // 1200+ reservas ao longo de 2025
  for (let month = 1; month <= 12; month++) {
    const reservationsThisMonth = randomInt(80, 120);

    for (let i = 0; i < reservationsThisMonth; i++) {
      const randomUser = randomChoice(allUsers);
      const randomExperience = randomChoice(experiences.filter((e) => e.active));

      const createdDate = new Date(2025, month - 1, randomInt(1, 28), randomInt(8, 20), 0, 0);
      const startDate = new Date(2025, month - 1, randomInt(1, 28), randomInt(8, 18), 0, 0);

      let endDate = new Date(startDate);
      if (randomExperience.category === 'HOSTING') {
        endDate = addDays(startDate, randomInt(1, 5));
      } else if (randomExperience.durationMinutes) {
        endDate.setMinutes(startDate.getMinutes() + randomExperience.durationMinutes);
      }

      const includePeopleStep = Math.random() > 0.2;
      const workflowRandom = Math.random();
      const requestFlow = ['CREATED'];

      if (includePeopleStep) {
        requestFlow.push('PEOPLE_REQUESTED', 'PEOPLE_SENT');
      }

      let finalPaymentState = null;
      let isCanceled = false;

      if (workflowRandom < 0.55) {
        requestFlow.push('PAYMENT_REQUESTED', 'PAYMENT_SENT', 'PAYMENT_APPROVED');
        finalPaymentState = 'APPROVED';
      } else if (workflowRandom < 0.7) {
        requestFlow.push('CANCELED_REQUESTED', 'CANCELED');
        isCanceled = true;
      } else if (workflowRandom < 0.85) {
        requestFlow.push('PAYMENT_REQUESTED', 'PAYMENT_SENT');
        finalPaymentState = 'PENDING';
      } else {
        requestFlow.push('PAYMENT_REQUESTED', 'PAYMENT_SENT', 'PAYMENT_REJECTED');
        finalPaymentState = 'REJECTED';
      }

      const isGroupActive = !isCanceled && finalPaymentState !== 'REJECTED';

      // ReservationGroup
      const reservationGroup = await prisma.reservationGroup.create({
        data: {
          userId: randomUser.id,
          active: isGroupActive,
          createdAt: createdDate,
          notes: Math.random() > 0.7 ? `Notas mês ${month}` : null,
        },
      });
      totalReservationGroups++;

      // Members (1-8 por grupo)
      const numMembers = randomInt(1, 8);
      for (let m = 0; m < numMembers; m++) {
        const firstName = randomChoice(FIRST_NAMES);
        const lastName = randomChoice(LAST_NAMES);
        await prisma.member.create({
          data: {
            name: `${firstName} ${lastName}`,
            document: Math.random() > 0.3 ? generateCpf() : null,
            gender: randomChoice(['Masculino', 'Feminino']),
            phone:
              Math.random() > 0.5
                ? `(${randomInt(11, 99)}) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`
                : null,
            birthDate: randomDate(new Date(1950, 0, 1), new Date(2010, 11, 31)),
            reservationGroupId: reservationGroup.id,
          },
        });
        totalMembers++;
      }

      // Reservation
      const reservation = await prisma.reservation.create({
        data: {
          userId: randomUser.id,
          experienceId: randomExperience.id,
          reservationGroupId: reservationGroup.id,
          startDate: startDate,
          endDate: endDate,
          price: randomExperience.price,
          active: isGroupActive,
          createdAt: createdDate,
          membersCount: numMembers,
        },
      });
      totalReservations++;

      // Documents (40%)
      if (Math.random() > 0.6) {
        const numDocs = randomInt(1, 3);
        for (let d = 0; d < numDocs; d++) {
          await prisma.document.create({
            data: {
              reservationId: reservation.id,
              url: `https://storage.promata.com/doc-${totalDocuments + 1}.pdf`,
              uploadedByUserId: randomUser.id,
              uploadedAt: addDays(createdDate, randomInt(0, 5)),
            },
          });
          totalDocuments++;
        }
      }

      // Requests (workflow)
      for (let r = 0; r < requestFlow.length; r++) {
        const type = requestFlow[r];
        await prisma.requests.create({
          data: {
            type: type,
            description: `${type} - ${reservation.id.substring(0, 8)}`,
            createdByUserId: r === 0 ? randomUser.id : randomChoice(admins).id,
            reservationGroupId: reservationGroup.id,
            professorId: randomUser.userType === UserType.PROFESSOR ? randomUser.id : null,
            createdAt: addDays(createdDate, r),
          },
        });
        totalRequests++;
      }

      if (finalPaymentState && Math.random() > 0.6) {
        paymentReceiptCandidates.push({
          reservationGroupId: reservationGroup.id,
          userId: randomUser.id,
          baseDate: addDays(createdDate, requestFlow.length - 1),
          paymentState: finalPaymentState,
        });
      }
    }

    console.log(`  ✓ Mês ${month}/12`);
  }
  console.log(`✓ ${totalReservationGroups} grupos`);
  console.log(`✓ ${totalReservations} reservas`);
  console.log(`✓ ${totalMembers} membros`);
  console.log(`✓ ${totalDocuments} documentos`);
  console.log(`✓ ${totalRequests} requests\n`);

  // RECEIPTS (400+)
  console.log('🧾 Criando 400+ receipts...');
  let totalReceipts = 0;

  // Receipts de pagamento vinculados aos grupos de reserva
  for (let i = 0; i < paymentReceiptCandidates.length; i++) {
    const candidate = paymentReceiptCandidates[i];

    let status = 'PENDING';
    if (candidate.paymentState === 'APPROVED') {
      status = 'ACTIVE';
    } else if (candidate.paymentState === 'REJECTED') {
      status = 'EXPIRED';
    }

    const receipt = await prisma.receipt.create({
      data: {
        type: 'PAYMENT',
        url: `https://storage.promata.com/receipt-${candidate.reservationGroupId.substring(0, 8)}-${
          i + 1
        }.pdf`,
        value: randomInt(50, 500),
        status: status,
        userId: candidate.userId,
        createdAt: candidate.baseDate,
      },
    });

    await prisma.reservationGroup.update({
      where: { id: candidate.reservationGroupId },
      data: { receiptId: receipt.id },
    });

    totalReceipts++;
  }

  // Receipts de docência para professores (não vinculados a reservas)
  const docencyReceiptsCount = 50;
  for (let i = 0; i < docencyReceiptsCount; i++) {
    const professor = randomChoice(professors);
    const status = randomChoice(['PENDING', 'ACTIVE', 'EXPIRED']);

    await prisma.receipt.create({
      data: {
        type: 'DOCENCY',
        url: `https://storage.promata.com/docency-receipt-${i + 1}.pdf`,
        value: randomInt(200, 1500),
        status: status,
        userId: professor.id,
        createdAt: randomDate(new Date(2025, 0, 1), new Date(2025, 11, 31)),
      },
    });

    totalReceipts++;
  }

  console.log(`✓ ${totalReceipts} receipts\n`);

  // PASSWORD RESET TOKENS (20)
  console.log('🔑 Criando tokens...');
  for (let i = 0; i < 20; i++) {
    const randomUser = randomChoice([...professors, ...guests]);
    const isActive = Math.random() > 0.5;
    const expiredAt = isActive
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        token: `token-${randomUser.id.substring(0, 8)}-${Date.now()}-${i}`,
        userId: randomUser.id,
        expiredAt: expiredAt,
        createdAt: new Date(Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000),
        isActive: isActive,
      },
    });
  }
  console.log(`✓ 20 tokens\n`);

  console.log('✅ SEED COMPLETO!\n');
  console.log(`
📊 RESUMO FINAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 USUÁRIOS: ${1 + admins.length + professors.length + guests.length} total
   • 1 ROOT
   • ${admins.length} ADMIN
   • ${professors.length} PROFESSORES  
   • ${guests.length} GUESTS

📍 DADOS BÁSICOS:
   • ${addresses.length} Endereços
   • ${images.length} Imagens
   • ${experiences.length} Experiências
   • ${highlightOrder - 1} Highlights

📅 RESERVAS E RELACIONADOS:
   • ${totalReservationGroups} Grupos de Reserva
   • ${totalReservations} Reservas
   • ${totalMembers} Membros
   • ${totalDocuments} Documentos
   • ${totalRequests} Requests (workflow)

💰 FINANCEIRO:
   • ${totalReceipts} Receipts
   • 20 Tokens de Reset

🔑 ACESSO:
   Email: root@promata.com
   Password: password123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
