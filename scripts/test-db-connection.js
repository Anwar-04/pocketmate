const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Simple .env parser without external dependency
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch {}

const prisma = new PrismaClient();

async function main() {
  console.log('--- SPENDWISE DATABASE DIAGNOSTIC ---');
  console.log('Configured DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'Not Set');
  console.log('Configured DIRECT_URL:  ', process.env.DIRECT_URL ? process.env.DIRECT_URL.replace(/:[^:@]+@/, ':****@') : 'Not Set');
  console.log('Configured SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not Set');
  console.log('');

  try {
    console.log('1. Attempting connection to PostgreSQL...');
    await prisma.$connect();
    console.log('✅ PostgreSQL connection successful!');

    console.log('2. Querying database tables...');
    const userCount = await prisma.user.count();
    const txCount = await prisma.transaction.count();
    const profileCount = await prisma.financialProfile.count();

    console.log('✅ Query executed successfully:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Financial Profiles: ${profileCount}`);
    console.log(`   - Transactions: ${txCount}`);
  } catch (error) {
    console.log('❌ PostgreSQL connection failed:');
    console.log('   Error Code:', error.code || 'N/A');
    console.log('   Message:   ', error.message.split('\n')[0]);
    console.log('');
    console.log('💡 Note: If you want to connect Prisma to Supabase PostgreSQL:');
    console.log('   Provide your database password from Supabase Dashboard -> Project Settings -> Database -> Connection String.');
  } finally {
    await prisma.$disconnect();
  }
}

main();
