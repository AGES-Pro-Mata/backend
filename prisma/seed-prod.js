/**
 * ============================================
 * PRO-MATA - Seed de Produção
 * ============================================
 * Este seed cria APENAS o usuário ROOT inicial
 * para entrega ao cliente.
 * 
 * Credenciais padrão:
 *   Email: augusto.alvim@pucrs.br
 *   Senha: ProMata2025!
 * 
 * IMPORTANTE: Alterar a senha no primeiro login!
 * ============================================
 */

const { PrismaClient, UserType } = require('../generated/prisma');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  console.log('============================================');
  console.log('PRO-MATA - Seed de Produção');
  console.log('============================================');

  // Verificar se já existe usuário ROOT
  const existingRoot = await prisma.user.findFirst({
    where: { userType: UserType.ROOT }
  });

  if (existingRoot) {
    console.log('✓ Usuário ROOT já existe - seed ignorado.');
    console.log(`  Email: ${existingRoot.email}`);
    console.log('============================================');
    return;
  }

  // Criar hash da senha padrão
  // O frontend envia o hash SHA-256 da senha, então precisamos fazer
  // argon2 hash do SHA-256 hash para que a verificação funcione
  const defaultPassword = 'ProMata2025!';
  const crypto = require('crypto');
  const sha256Hash = crypto.createHash('sha256').update(defaultPassword).digest('hex');
  const hashedPassword = await argon2.hash(sha256Hash, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // Criar usuário ROOT
  const rootUser = await prisma.user.create({
    data: {
      userType: UserType.ROOT,
      name: 'Augusto Mussi Alvim',
      email: 'augusto.alvim@pucrs.br',
      password: hashedPassword,
      phone: '(51) 99999-0000',
      gender: 'M',
      isForeign: false,
      active: true,
      verified: true,
      isFirstAccess: true, // Forçar troca de senha no primeiro login
    },
  });

  console.log('✓ Usuário ROOT criado com sucesso!');
  console.log('============================================');
  console.log('Credenciais de acesso:');
  console.log(`  Email: ${rootUser.email}`);
  console.log(`  Senha: ${defaultPassword}`);
  console.log('============================================');
  console.log('⚠️  IMPORTANTE: Altere a senha no primeiro login!');
  console.log('============================================');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Erro ao executar seed de produção:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
