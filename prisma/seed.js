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

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

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
  ]);

  // Criar Usuários ROOT e ADMIN primeiro
  console.log('👤 Criando usuários...');

  // Senha senha123
  const hashedPassword = await argon2.hash(
    '55a5e9e78207b4df8699d60886fa070079463547b095d1a05bc719bb4e6cd251',
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
      password: hashedPassword,
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
      name: 'Carlos Silva',
      email: 'carlos.admin@sistema.com',
      password: hashedPassword,
      phone: '11988888888',
      document: '22222222222',
      gender: 'Masculino',
      rg: '222222222',
      institution: 'Administração',
      isForeign: false,
      verified: true,
      addressId: addresses[1].id,
      createdByUserId: rootUser.id,
    },
  });

  // Criar Professores
  const professors = await Promise.all([
    prisma.user.create({
      data: {
        userType: UserType.PROFESSOR,
        name: 'Dr. Maria Santos',
        email: 'maria.santos@universidade.edu.br',
        password: hashedPassword,
        phone: '11977777777',
        document: '33333333333',
        gender: 'Feminino',
        rg: '333333333',
        institution: 'Universidade Federal',
        isForeign: false,
        verified: true,
        addressId: addresses[2].id,
        createdByUserId: adminUser.id,
      },
    }),
    prisma.user.create({
      data: {
        userType: UserType.PROFESSOR,
        name: 'Prof. João Oliveira',
        email: 'joao.oliveira@universidade.edu.br',
        password: hashedPassword,
        phone: '11966666666',
        document: '44444444444',
        gender: 'Masculino',
        rg: '444444444',
        institution: 'Universidade Estadual',
        isForeign: false,
        verified: true,
        addressId: addresses[3].id,
        createdByUserId: adminUser.id,
      },
    }),
    prisma.user.create({
      data: {
        userType: UserType.PROFESSOR,
        name: 'Dra. Ana Paula Costa',
        email: 'ana.costa@instituto.edu.br',
        password: hashedPassword,
        phone: '51955555555',
        document: '55555555555',
        gender: 'Feminino',
        rg: '555555555',
        institution: 'Instituto de Pesquisa',
        isForeign: false,
        verified: true,
        addressId: addresses[4].id,
        createdByUserId: adminUser.id,
      },
    }),
  ]);

  // Criar Hóspedes
  const guests = await Promise.all([
    prisma.user.create({
      data: {
        userType: UserType.GUEST,
        name: 'Pedro Almeida',
        email: 'pedro.almeida@email.com',
        password: hashedPassword,
        phone: '11944444444',
        document: '66666666666',
        gender: 'Masculino',
        rg: '666666666',
        isForeign: false,
        verified: true,
        addressId: addresses[5].id,
        createdByUserId: adminUser.id,
      },
    }),
    prisma.user.create({
      data: {
        userType: UserType.GUEST,
        name: 'Juliana Ferreira',
        email: 'juliana.ferreira@email.com',
        password: hashedPassword,
        phone: '21933333333',
        document: '77777777777',
        gender: 'Feminino',
        rg: '777777777',
        isForeign: false,
        verified: true,
        addressId: addresses[6].id,
        createdByUserId: adminUser.id,
      },
    }),
    prisma.user.create({
      data: {
        userType: UserType.GUEST,
        name: 'Ricardo Souza',
        email: 'ricardo.souza@email.com',
        password: hashedPassword,
        phone: '21922222222',
        document: '88888888888',
        gender: 'Masculino',
        rg: '888888888',
        isForeign: false,
        verified: true,
        addressId: addresses[7].id,
        createdByUserId: adminUser.id,
      },
    }),
    prisma.user.create({
      data: {
        userType: UserType.GUEST,
        name: 'Fernanda Lima',
        email: 'fernanda.lima@email.com',
        password: hashedPassword,
        phone: '11911111111',
        document: '99999999999',
        gender: 'Feminino',
        rg: '999999999',
        isForeign: false,
        verified: false,
        addressId: addresses[8].id,
        createdByUserId: adminUser.id,
      },
    }),
    prisma.user.create({
      data: {
        userType: UserType.GUEST,
        name: 'John Smith',
        email: 'john.smith@email.com',
        password: hashedPassword,
        phone: '+1234567890',
        gender: 'Masculino',
        isForeign: true,
        verified: true,
        createdByUserId: adminUser.id,
      },
    }),
    prisma.user.create({
      data: {
        userType: UserType.GUEST,
        name: 'María García',
        email: 'maria.garcia@email.com',
        password: hashedPassword,
        phone: '+34612345678',
        gender: 'Feminino',
        isForeign: true,
        verified: true,
        addressId: addresses[9].id,
        createdByUserId: adminUser.id,
      },
    }),
  ]);

  // Criar Imagens
  console.log('🖼️ Criando imagens...');
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

  // Criar Experiências - TRILHAS
  console.log('🏔️ Criando experiências - Trilhas...');
  const trails = await Promise.all([
    prisma.experience.create({
      data: {
        name: 'Trilha da Cachoeira',
        description:
          'Uma trilha leve com destino a uma linda cachoeira. Ideal para famílias e iniciantes.',
        category: Category.TRAIL,
        capacity: 15,
        price: 50.0,
        weekDays: [WeekDay.SATURDAY, WeekDay.SUNDAY],
        durationMinutes: 120,
        trailDifficulty: TrailDifficulty.LIGHT,
        trailLength: 3.5,
        imageId: images[0].id,
        active: true,
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Trilha do Morro Alto',
        description: 'Trilha moderada com vista panorâmica do topo. Requer preparo físico básico.',
        category: Category.TRAIL,
        capacity: 12,
        price: 75.0,
        weekDays: [WeekDay.FRIDAY, WeekDay.SATURDAY, WeekDay.SUNDAY],
        durationMinutes: 180,
        trailDifficulty: TrailDifficulty.MODERATED,
        trailLength: 5.2,
        imageId: images[1].id,
        active: true,
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Trilha Extrema do Pico',
        description: 'Desafio para aventureiros experientes. Escalada técnica e rapel inclusos.',
        category: Category.TRAIL,
        capacity: 8,
        price: 150.0,
        weekDays: [WeekDay.SATURDAY],
        durationMinutes: 420,
        trailDifficulty: TrailDifficulty.EXTREME,
        trailLength: 8.7,
        imageId: images[2].id,
        active: true,
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Trilha da Mata Atlântica',
        description:
          'Caminhada ecológica pela mata nativa com guia especializado em fauna e flora.',
        category: Category.TRAIL,
        capacity: 20,
        price: 60.0,
        weekDays: [
          WeekDay.WEDNESDAY,
          WeekDay.THURSDAY,
          WeekDay.FRIDAY,
          WeekDay.SATURDAY,
          WeekDay.SUNDAY,
        ],
        durationMinutes: 150,
        trailDifficulty: TrailDifficulty.LIGHT,
        trailLength: 4.0,
        imageId: images[3].id,
        active: true,
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Trilha Noturna das Estrelas',
        description: 'Experiência única de trilha noturna com observação de estrelas.',
        category: Category.TRAIL,
        capacity: 10,
        price: 90.0,
        weekDays: [WeekDay.FRIDAY, WeekDay.SATURDAY],
        durationMinutes: 240,
        trailDifficulty: TrailDifficulty.MODERATED,
        trailLength: 4.5,
        imageId: images[4].id,
        active: true,
      },
    }),
  ]);

  // Criar Experiências - HOSPEDAGEM
  console.log('🏠 Criando experiências - Hospedagem...');
  const hostings = await Promise.all([
    prisma.experience.create({
      data: {
        name: 'Chalé Romântico',
        description:
          'Aconchegante chalé para casais com lareira, banheira de hidromassagem e vista para as montanhas.',
        category: Category.HOSTING,
        capacity: 2,
        price: 350.0,
        weekDays: [
          WeekDay.MONDAY,
          WeekDay.TUESDAY,
          WeekDay.WEDNESDAY,
          WeekDay.THURSDAY,
          WeekDay.FRIDAY,
          WeekDay.SATURDAY,
          WeekDay.SUNDAY,
        ],
        active: true,
        imageId: images[5].id,
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Casa Familiar na Floresta',
        description:
          'Ampla casa com 4 quartos, cozinha completa e área de churrasco. Perfeita para famílias.',
        category: Category.HOSTING,
        capacity: 8,
        price: 600.0,
        weekDays: [
          WeekDay.MONDAY,
          WeekDay.TUESDAY,
          WeekDay.WEDNESDAY,
          WeekDay.THURSDAY,
          WeekDay.FRIDAY,
          WeekDay.SATURDAY,
          WeekDay.SUNDAY,
        ],
        active: true,
        imageId: images[6].id,
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Camping Estruturado',
        description:
          'Área de camping com infraestrutura completa: banheiros, chuveiros e energia elétrica.',
        category: Category.HOSTING,
        capacity: 30,
        price: 80.0,
        weekDays: [WeekDay.FRIDAY, WeekDay.SATURDAY, WeekDay.SUNDAY],
        active: true,
        imageId: images[7].id,
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Dormitório Compartilhado',
        description: 'Opção econômica para grupos e mochileiros. Inclui café da manhã.',
        category: Category.HOSTING,
        capacity: 12,
        price: 120.0,
        weekDays: [
          WeekDay.MONDAY,
          WeekDay.TUESDAY,
          WeekDay.WEDNESDAY,
          WeekDay.THURSDAY,
          WeekDay.FRIDAY,
          WeekDay.SATURDAY,
          WeekDay.SUNDAY,
        ],
        active: true,
        imageId: images[8].id,
      },
    }),
  ]);

  // Criar Experiências - LABORATÓRIO
  console.log('🔬 Criando experiências - Laboratório...');
  const laboratories = await Promise.all([
    prisma.experience.create({
      data: {
        name: 'Laboratório de Biologia Marinha',
        description:
          'Pesquisa avançada em ecossistemas marinhos com equipamentos de última geração.',
        category: Category.LABORATORY,
        capacity: 10,
        price: 0.0,
        weekDays: [
          WeekDay.MONDAY,
          WeekDay.TUESDAY,
          WeekDay.WEDNESDAY,
          WeekDay.THURSDAY,
          WeekDay.FRIDAY,
        ],
        durationMinutes: 480,
        active: true,
        imageId: images[9].id,
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Lab de Análise Ambiental',
        description:
          'Estudos de qualidade da água, solo e ar. Disponível para pesquisadores credenciados.',
        category: Category.LABORATORY,
        capacity: 8,
        price: 0.0,
        weekDays: [
          WeekDay.MONDAY,
          WeekDay.TUESDAY,
          WeekDay.WEDNESDAY,
          WeekDay.THURSDAY,
          WeekDay.FRIDAY,
        ],
        durationMinutes: 360,
        active: true,
        imageId: images[10].id,
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Centro de Pesquisa em Biodiversidade',
        description: 'Instalações completas para estudos de fauna e flora local.',
        category: Category.LABORATORY,
        capacity: 15,
        price: 0.0,
        weekDays: [
          WeekDay.MONDAY,
          WeekDay.TUESDAY,
          WeekDay.WEDNESDAY,
          WeekDay.THURSDAY,
          WeekDay.FRIDAY,
        ],
        durationMinutes: 480,
        active: true,
        imageId: images[11].id,
      },
    }),
  ]);

  // Criar Experiências - EVENTOS
  console.log('🎉 Criando experiências - Eventos...');
  const events = await Promise.all([
    prisma.experience.create({
      data: {
        name: 'Workshop de Fotografia na Natureza',
        description: 'Aprenda técnicas de fotografia de paisagem com fotógrafo profissional.',
        category: Category.EVENT,
        capacity: 20,
        price: 200.0,
        startDate: new Date('2025-11-15T09:00:00'),
        endDate: new Date('2025-11-15T17:00:00'),
        durationMinutes: 480,
        active: true,
        imageId: images[12].id,
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Congresso de Sustentabilidade 2025',
        description: 'Três dias de palestras, workshops e networking sobre práticas sustentáveis.',
        category: Category.EVENT,
        capacity: 150,
        price: 500.0,
        startDate: new Date('2025-12-05T08:00:00'),
        endDate: new Date('2025-12-07T18:00:00'),
        active: true,
        imageId: images[13].id,
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Retiro de Yoga e Meditação',
        description:
          'Final de semana de renovação com aulas de yoga, meditação e alimentação orgânica.',
        category: Category.EVENT,
        capacity: 30,
        price: 800.0,
        startDate: new Date('2025-11-20T14:00:00'),
        endDate: new Date('2025-11-22T12:00:00'),
        active: true,
        imageId: images[14].id,
      },
    }),
    prisma.experience.create({
      data: {
        name: 'Festival de Música na Montanha',
        description:
          'Dois dias de música ao vivo com bandas locais e nacionais em cenário natural.',
        category: Category.EVENT,
        capacity: 500,
        price: 150.0,
        startDate: new Date('2025-12-15T16:00:00'),
        endDate: new Date('2025-12-16T23:00:00'),
        active: true,
        imageId: images[0].id,
      },
    }),
  ]);

  // Criar Grupos de Reserva
  console.log('👥 Criando grupos de reserva...');
  const reservationGroups = await Promise.all([
    prisma.reservationGroup.create({ data: { userId: professors[0].id } }),
    prisma.reservationGroup.create({ data: { userId: professors[1].id } }),
    prisma.reservationGroup.create({ data: { userId: professors[2].id } }),
    prisma.reservationGroup.create({ data: { userId: guests[0].id } }),
    prisma.reservationGroup.create({ data: { userId: guests[1].id } }),
    prisma.reservationGroup.create({ data: { userId: guests[2].id } }),
    prisma.reservationGroup.create({ data: { userId: guests[3].id } }),
    prisma.reservationGroup.create({ data: { userId: guests[4].id } }),
    prisma.reservationGroup.create({ data: { userId: guests[5].id } }),
  ]);

  // Criar Membros
  console.log('👤 Criando membros...');
  const members = await Promise.all([
    // Membros do grupo do professor 1
    prisma.member.create({
      data: {
        name: 'Estudante João Silva',
        document: '10101010101',
        gender: 'Masculino',
        reservationGroupId: reservationGroups[0].id,
      },
    }),
    prisma.member.create({
      data: {
        name: 'Estudante Maria Clara',
        document: '20202020202',
        gender: 'Feminino',
        reservationGroupId: reservationGroups[0].id,
      },
    }),
    prisma.member.create({
      data: {
        name: 'Estudante Paulo Santos',
        document: '30303030303',
        gender: 'Masculino',
        reservationGroupId: reservationGroups[0].id,
      },
    }),
    // Membros do grupo do guest 1
    prisma.member.create({
      data: {
        name: 'Ana Almeida',
        document: '40404040404',
        gender: 'Feminino',
        reservationGroupId: reservationGroups[3].id,
      },
    }),
    prisma.member.create({
      data: {
        name: 'Carlos Almeida',
        document: '50505050505',
        gender: 'Masculino',
        reservationGroupId: reservationGroups[3].id,
      },
    }),
    // Membros do grupo do guest 2
    prisma.member.create({
      data: {
        name: 'Roberto Ferreira',
        document: '60606060606',
        gender: 'Masculino',
        reservationGroupId: reservationGroups[4].id,
      },
    }),
    prisma.member.create({
      data: {
        name: 'Lucia Ferreira',
        document: '70707070707',
        gender: 'Feminino',
        reservationGroupId: reservationGroups[4].id,
      },
    }),
    prisma.member.create({
      data: {
        name: 'Junior Ferreira',
        document: '80808080808',
        gender: 'Masculino',
        reservationGroupId: reservationGroups[4].id,
      },
    }),
  ]);

  // Criar Reservas
  console.log('📅 Criando reservas...');
  const reservations = await Promise.all([
    // Reservas de Trilhas
    prisma.reservation.create({
      data: {
        userId: professors[0].id,
        experienceId: trails[0].id,
        startDate: new Date('2025-11-02T09:00:00'),
        endDate: new Date('2025-11-02T11:00:00'),
        notes: 'Turma de biologia - 15 alunos',
        reservationGroupId: reservationGroups[0].id,
        members: {
          connect: [{ id: members[0].id }, { id: members[1].id }, { id: members[2].id }],
        },
      },
    }),
    prisma.reservation.create({
      data: {
        userId: guests[0].id,
        experienceId: trails[1].id,
        startDate: new Date('2025-11-09T08:00:00'),
        endDate: new Date('2025-11-09T11:00:00'),
        notes: 'Família - 4 pessoas',
        reservationGroupId: reservationGroups[3].id,
        members: {
          connect: [{ id: members[3].id }, { id: members[4].id }],
        },
      },
    }),
    prisma.reservation.create({
      data: {
        userId: guests[4].id,
        experienceId: trails[2].id,
        startDate: new Date('2025-11-16T07:00:00'),
        endDate: new Date('2025-11-16T14:00:00'),
        notes: 'Grupo de aventureiros experientes',
        reservationGroupId: reservationGroups[7].id,
      },
    }),
    prisma.reservation.create({
      data: {
        userId: professors[1].id,
        experienceId: trails[3].id,
        startDate: new Date('2025-11-13T10:00:00'),
        endDate: new Date('2025-11-13T12:30:00'),
        notes: 'Aula de campo sobre ecossistemas',
        reservationGroupId: reservationGroups[1].id,
      },
    }),
    // Reservas de Hospedagem
    prisma.reservation.create({
      data: {
        userId: guests[1].id,
        experienceId: hostings[0].id,
        startDate: new Date('2025-11-22T14:00:00'),
        endDate: new Date('2025-11-24T12:00:00'),
        notes: 'Lua de mel',
        reservationGroupId: reservationGroups[4].id,
        members: {
          connect: [{ id: members[5].id }],
        },
      },
    }),
    prisma.reservation.create({
      data: {
        userId: guests[2].id,
        experienceId: hostings[1].id,
        startDate: new Date('2025-12-20T14:00:00'),
        endDate: new Date('2025-12-27T12:00:00'),
        notes: 'Férias em família - 8 pessoas',
        reservationGroupId: reservationGroups[5].id,
        members: {
          connect: [{ id: members[6].id }, { id: members[7].id }],
        },
      },
    }),
    prisma.reservation.create({
      data: {
        userId: guests[5].id,
        experienceId: hostings[2].id,
        startDate: new Date('2025-11-29T14:00:00'),
        endDate: new Date('2025-12-01T12:00:00'),
        notes: 'Acampamento de fim de semana',
        reservationGroupId: reservationGroups[8].id,
      },
    }),
    // Reservas de Laboratório
    prisma.reservation.create({
      data: {
        userId: professors[0].id,
        experienceId: laboratories[0].id,
        startDate: new Date('2025-11-04T08:00:00'),
        endDate: new Date('2025-11-04T16:00:00'),
        notes: 'Pesquisa sobre microplásticos nos oceanos',
        reservationGroupId: reservationGroups[0].id,
      },
    }),
    prisma.reservation.create({
      data: {
        userId: professors[2].id,
        experienceId: laboratories[1].id,
        startDate: new Date('2025-11-11T09:00:00'),
        endDate: new Date('2025-11-11T15:00:00'),
        notes: 'Análise de qualidade da água do rio local',
        reservationGroupId: reservationGroups[2].id,
      },
    }),
    prisma.reservation.create({
      data: {
        userId: professors[1].id,
        experienceId: laboratories[2].id,
        startDate: new Date('2025-11-18T08:00:00'),
        endDate: new Date('2025-11-18T16:00:00'),
        notes: 'Catalogação de espécies de insetos',
        reservationGroupId: reservationGroups[1].id,
      },
    }),
    // Reservas de Eventos
    prisma.reservation.create({
      data: {
        userId: guests[3].id,
        experienceId: events[0].id,
        startDate: new Date('2025-11-15T09:00:00'),
        endDate: new Date('2025-11-15T17:00:00'),
        notes: 'Interessada em fotografia profissional',
        reservationGroupId: reservationGroups[6].id,
      },
    }),
    prisma.reservation.create({
      data: {
        userId: professors[0].id,
        experienceId: events[1].id,
        startDate: new Date('2025-12-05T08:00:00'),
        endDate: new Date('2025-12-07T18:00:00'),
        notes: 'Participação como palestrante',
        reservationGroupId: reservationGroups[0].id,
      },
    }),
    prisma.reservation.create({
      data: {
        userId: guests[1].id,
        experienceId: events[2].id,
        startDate: new Date('2025-11-20T14:00:00'),
        endDate: new Date('2025-11-22T12:00:00'),
        notes: 'Retiro de renovação espiritual',
        reservationGroupId: reservationGroups[4].id,
        members: {
          connect: [{ id: members[5].id }, { id: members[6].id }],
        },
      },
    }),
  ]);

  // Criar Documentos
  console.log('📄 Criando documentos...');
  await Promise.all([
    prisma.document.create({
      data: {
        reservationId: reservations[0].id,
        url: 'https://documentos.com/termo-responsabilidade-001.pdf',
        uploadedByUserId: professors[0].id,
      },
    }),
    prisma.document.create({
      data: {
        reservationId: reservations[0].id,
        url: 'https://documentos.com/autorizacao-universidade-001.pdf',
        uploadedByUserId: adminUser.id,
      },
    }),
    prisma.document.create({
      data: {
        reservationId: reservations[4].id,
        url: 'https://documentos.com/comprovante-pagamento-001.pdf',
        uploadedByUserId: guests[1].id,
      },
    }),
    prisma.document.create({
      data: {
        reservationId: reservations[7].id,
        url: 'https://documentos.com/projeto-pesquisa-001.pdf',
        uploadedByUserId: professors[0].id,
      },
    }),
  ]);

  // Criar Recibos
  console.log('🧾 Criando recibos...');
  await Promise.all([
    prisma.receipt.create({
      data: {
        type: ReceiptType.PAYMENT,
        value: 50.0,
        status: ReceiptStatus.ACTIVE,
        url: 'https://recibos.com/pagamento-001.pdf',
        userId: guests[0].id,
      },
    }),
    prisma.receipt.create({
      data: {
        type: ReceiptType.PAYMENT,
        value: 350.0,
        status: ReceiptStatus.ACTIVE,
        url: 'https://recibos.com/pagamento-002.pdf',
        userId: guests[1].id,
      },
    }),
    prisma.receipt.create({
      data: {
        type: ReceiptType.PAYMENT,
        value: 600.0,
        status: ReceiptStatus.PENDING,
        url: 'https://recibos.com/pagamento-003.pdf',
        userId: guests[2].id,
      },
    }),
    prisma.receipt.create({
      data: {
        type: ReceiptType.DOCENCY,
        url: 'https://recibos.com/comprovante-docencia-001.pdf',
        status: ReceiptStatus.ACTIVE,
        userId: professors[0].id,
      },
    }),
    prisma.receipt.create({
      data: {
        type: ReceiptType.DOCENCY,
        url: 'https://recibos.com/comprovante-docencia-002.pdf',
        status: ReceiptStatus.ACTIVE,
        userId: professors[1].id,
      },
    }),
    prisma.receipt.create({
      data: {
        type: ReceiptType.PAYMENT,
        value: 200.0,
        status: ReceiptStatus.EXPIRED,
        url: 'https://recibos.com/pagamento-004.pdf',
        userId: guests[3].id,
      },
    }),
  ]);

  // Criar Requests
  console.log('📋 Criando requisições...');
  await Promise.all([
    prisma.requests.create({
      data: {
        type: RequestType.CREATED,
        description: 'Reserva criada pelo professor',
        createdByUserId: professors[0].id,
        reservationGroupId: reservationGroups[0].id,
      },
    }),
    prisma.requests.create({
      data: {
        type: RequestType.APPROVED,
        description: 'Reserva aprovada pela administração',
        createdByUserId: adminUser.id,
        reservationGroupId: reservationGroups[0].id,
      },
    }),
    prisma.requests.create({
      data: {
        type: RequestType.DOCUMENT_REQUESTED,
        description: 'Solicitação de documentos adicionais',
        createdByUserId: adminUser.id,
        reservationGroupId: reservationGroups[3].id,
      },
    }),
    prisma.requests.create({
      data: {
        type: RequestType.DOCUMENT_APPROVED,
        description: 'Documentos aprovados',
        createdByUserId: adminUser.id,
        reservationGroupId: reservationGroups[3].id,
      },
    }),
    prisma.requests.create({
      data: {
        type: RequestType.PAYMENT_REQUESTED,
        description: 'Solicitação de comprovante de pagamento',
        createdByUserId: adminUser.id,
        reservationGroupId: reservationGroups[4].id,
      },
    }),
    prisma.requests.create({
      data: {
        type: RequestType.PAYMENT_SENT,
        description: 'Comprovante de pagamento enviado',
        createdByUserId: guests[1].id,
        reservationGroupId: reservationGroups[4].id,
      },
    }),
    prisma.requests.create({
      data: {
        type: RequestType.PEOPLE_REQUESTED,
        description: 'Solicitação de lista de participantes',
        createdByUserId: adminUser.id,
        reservationGroupId: reservationGroups[0].id,
      },
    }),
    prisma.requests.create({
      data: {
        type: RequestType.PEOPLE_SENT,
        description: 'Lista de participantes enviada',
        createdByUserId: professors[0].id,
        reservationGroupId: reservationGroups[0].id,
      },
    }),
    prisma.requests.create({
      data: {
        type: RequestType.EDITED,
        description: 'Reserva editada - data alterada',
        createdByUserId: guests[2].id,
        reservationGroupId: reservationGroups[5].id,
      },
    }),
    prisma.requests.create({
      data: {
        type: RequestType.CANCELED_REQUESTED,
        description: 'Solicitação de cancelamento',
        createdByUserId: guests[3].id,
        reservationGroupId: reservationGroups[6].id,
      },
    }),
  ]);

  // Criar Highlights
  console.log('⭐ Criando destaques...');
  await Promise.all([
    // Carrossel
    prisma.highlight.create({
      data: {
        category: HighlightCategory.CAROUSEL,
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        title: 'Aventura nas Montanhas',
        description: 'Descubra trilhas incríveis e paisagens de tirar o fôlego',
        order: 1,
      },
    }),
    prisma.highlight.create({
      data: {
        category: HighlightCategory.CAROUSEL,
        imageUrl: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c',
        title: 'Hospedagem Exclusiva',
        description: 'Chalés e casas confortáveis em meio à natureza',
        order: 2,
      },
    }),
    prisma.highlight.create({
      data: {
        category: HighlightCategory.CAROUSEL,
        imageUrl: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5',
        title: 'Pesquisa Científica',
        description: 'Laboratórios equipados para suas pesquisas',
        order: 3,
      },
    }),
    // Trilhas em destaque
    prisma.highlight.create({
      data: {
        category: HighlightCategory.TRAIL,
        imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306',
        title: 'Trilha da Cachoeira',
        description: 'Perfeita para famílias',
        order: 1,
      },
    }),
    prisma.highlight.create({
      data: {
        category: HighlightCategory.TRAIL,
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
        title: 'Trilha do Morro Alto',
        description: 'Vista panorâmica incrível',
        order: 2,
      },
    }),
    // Hospedagem em destaque
    prisma.highlight.create({
      data: {
        category: HighlightCategory.HOSTING,
        imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
        title: 'Chalé Romântico',
        description: 'Experiência inesquecível para casais',
        order: 1,
      },
    }),
    prisma.highlight.create({
      data: {
        category: HighlightCategory.HOSTING,
        imageUrl: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5',
        title: 'Casa Familiar',
        description: 'Espaço amplo para toda família',
        order: 2,
      },
    }),
    // Laboratório em destaque
    prisma.highlight.create({
      data: {
        category: HighlightCategory.LABORATORY,
        imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801',
        title: 'Lab de Biologia Marinha',
        description: 'Equipamentos de última geração',
        order: 1,
      },
    }),
    // Eventos em destaque
    prisma.highlight.create({
      data: {
        category: HighlightCategory.EVENT,
        imageUrl: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e',
        title: 'Workshop de Fotografia',
        description: 'Aprenda com profissionais',
        order: 1,
      },
    }),
    prisma.highlight.create({
      data: {
        category: HighlightCategory.EVENT,
        imageUrl: 'https://images.unsplash.com/photo-1587691592099-24045742c181',
        title: 'Festival de Música',
        description: 'Dois dias de música e diversão',
        order: 2,
      },
    }),
  ]);

  // Criar alguns Password Reset Tokens
  console.log('🔑 Criando tokens de reset de senha...');
  await Promise.all([
    prisma.passwordResetToken.create({
      data: {
        token: 'reset-token-abc123',
        userId: guests[3].id,
        expiredAt: new Date(Date.now() + 3600000), // 1 hora no futuro
        createdAt: new Date(),
        isActive: true,
      },
    }),
    prisma.passwordResetToken.create({
      data: {
        token: 'reset-token-def456',
        userId: guests[4].id,
        expiredAt: new Date(Date.now() - 3600000), // 1 hora no passado
        createdAt: new Date(Date.now() - 7200000),
        isActive: false,
      },
    }),
  ]);

  console.log('✅ Seed concluído com sucesso!');
  console.log(`
📊 Resumo dos dados criados:
- Usuários: ${1 + 1 + 3 + 6} (1 ROOT, 1 ADMIN, 3 PROFESSORES, 6 HÓSPEDES)
- Endereços: ${addresses.length}
- Imagens: ${images.length}
- Experiências: ${trails.length + hostings.length + laboratories.length + events.length}
  • Trilhas: ${trails.length}
  • Hospedagens: ${hostings.length}
  • Laboratórios: ${laboratories.length}
  • Eventos: ${events.length}
- Grupos de Reserva: ${reservationGroups.length}
- Membros: ${members.length}
- Reservas: ${reservations.length}
- Documentos: 4
- Recibos: 6
- Requisições: 10
- Destaques: 10
- Tokens de Reset: 2
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
