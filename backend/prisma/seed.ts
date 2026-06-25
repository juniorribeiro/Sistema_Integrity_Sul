import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@integritysul.com.br';
  const senhaPadrao = 'Integrity@2026';

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    console.log(`Usuário ${email} já existe — seed ignorado.`);
    return;
  }

  const senhaHash = await bcrypt.hash(senhaPadrao, 10);
  const usuario = await prisma.usuario.create({
    data: {
      email,
      senhaHash,
      role: 'DIRETORIA',
      primeiroLogin: true,
      colaborador: {
        create: {
          nome: 'Administrador',
          cpf: '00000000000',
          setor: null,
        },
      },
    },
  });

  console.log('✅ Usuário DIRETORIA criado:');
  console.log(`   email: ${email}`);
  console.log(`   senha: ${senhaPadrao}  (trocar no primeiro acesso)`);
  console.log(`   id:    ${usuario.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
