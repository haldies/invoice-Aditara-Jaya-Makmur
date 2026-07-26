const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return { salt, hash };
}

async function main() {
  const { salt, hash } = hashPassword('password123');
  await prisma.appUser.updateMany({
    data: {
      password_salt: salt,
      password_hash: hash
    }
  });
  console.log('Semua password telah disetel ke password123');
}

main().finally(() => prisma.$disconnect());
