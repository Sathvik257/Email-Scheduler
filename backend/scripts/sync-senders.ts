import { env } from "../src/config/env.js";
import { prisma } from "../src/db/prisma.js";

async function syncSenders(): Promise<void> {
  for (const account of env.etherealAccounts) {
    await prisma.sender.upsert({
      where: {
        key: account.key,
      },
      update: {
        name: account.name,
        email: account.email,
        active: true,
      },
      create: {
        key: account.key,
        name: account.name,
        email: account.email,
        active: true,
      },
    });
  }

  const senders = await prisma.sender.findMany({
    where: {
      active: true,
    },
    select: {
      key: true,
      name: true,
      email: true,
    },
  });

  console.log("Active senders:");
  console.table(senders);
}

syncSenders()
  .catch((error: unknown) => {
    console.error("Failed to synchronize senders:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
