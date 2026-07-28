import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";

export async function listSenders(_req: Request, res: Response) {
  const senders = await prisma.sender.findMany({
    where: { active: true },
    select: {
      id: true,
      key: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  res.json({ senders });
}
