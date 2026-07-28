import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";

export async function syncConfiguredSenders(): Promise<void> {
  for (const account of env.etherealAccounts) {
    await prisma.sender.upsert({
      where: { key: account.key },
      create: {
        key: account.key,
        name: account.name,
        email: account.email,
        active: true,
      },
      update: {
        name: account.name,
        email: account.email,
        active: true,
      },
    });
  }
}

export function getEtherealAccount(key: string) {
  return env.etherealAccounts.find((account) => account.key === key);
}
