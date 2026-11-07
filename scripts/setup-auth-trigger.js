const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Setting up Supabase auth trigger & auto-sync...");

  // 1. Create or replace trigger function
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.users (id, email, name, "createdAt", "updatedAt")
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.users.name),
        "updatedAt" = NOW();

      INSERT INTO public.financial_profiles (id, "userId", "monthlySalary", "salaryDate", "currentBalance", "monthlySavingsGoal", "upcomingEssentials", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        NEW.id,
        60000,
        1,
        21500,
        5000,
        8000,
        NOW(),
        NOW()
      )
      ON CONFLICT ("userId") DO NOTHING;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `);
  console.log("✓ Function public.handle_new_user created");

  // 2. Drop trigger if exists
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);
  
  // 3. Create trigger
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `);
  console.log("✓ Trigger on_auth_user_created attached to auth.users");

  // 4. Sync existing auth.users into public.users
  await prisma.$executeRawUnsafe(`
    INSERT INTO public.users (id, email, name, "createdAt", "updatedAt")
    SELECT
      id,
      email,
      COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
      NOW(),
      NOW()
    FROM auth.users
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log("✓ Existing auth.users synced to public.users");

  // 5. Sync existing auth.users into public.financial_profiles
  await prisma.$executeRawUnsafe(`
    INSERT INTO public.financial_profiles (id, "userId", "monthlySalary", "salaryDate", "currentBalance", "monthlySavingsGoal", "upcomingEssentials", "createdAt", "updatedAt")
    SELECT
      gen_random_uuid()::text,
      id,
      60000,
      1,
      21500,
      5000,
      8000,
      NOW(),
      NOW()
    FROM auth.users
    ON CONFLICT ("userId") DO NOTHING;
  `);
  console.log("✓ Existing auth.users synced to public.financial_profiles");

  // 6. Confirm existing users in auth.users
  await prisma.$executeRawUnsafe(`
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE email_confirmed_at IS NULL;
  `);
  console.log("✓ Unconfirmed auth.users confirmed");

  const users = await prisma.user.findMany();
  console.log("Current public.User records:", users.map(u => ({ email: u.email, id: u.id })));
}

main()
  .catch((err) => {
    console.error("Setup failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
