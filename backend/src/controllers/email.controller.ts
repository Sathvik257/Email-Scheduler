import { EmailStatus } from "@prisma/client";
import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { scheduleEmailBatch } from "../services/scheduler.service.js";
import { HttpError } from "../utils/http-error.js";

const scheduleSchema = z.object({
  senderId: z.string().uuid(),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(100000),
  recipients: z.array(z.string().email()).min(1).max(5000),
  startTime: z.coerce.date(),
  delayBetweenEmailsMs: z.coerce.number().int().min(250).max(3600000),
  hourlyLimit: z.coerce.number().int().min(1).max(100000),
  idempotencyKey: z.string().min(8).max(200),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function schedule(req: Request, res: Response) {
  const userId = req.authUser?.id;
  if (!userId) throw new HttpError(401, "Authentication required.");

  const input = scheduleSchema.parse(req.body);
  const result = await scheduleEmailBatch({ ...input, userId });

  res.status(result.replayed ? 200 : 201).json({
    replayed: result.replayed,
    batchId: result.batch.id,
    recipientCount: result.batch.recipientCount,
    effectiveDelayMs: result.batch.effectiveDelayMs,
    effectiveHourlyLimit: result.batch.effectiveHourlyLimit,
    emails: result.batch.emails,
  });
}

export async function listScheduled(req: Request, res: Response) {
  const userId = req.authUser?.id;
  if (!userId) throw new HttpError(401, "Authentication required.");

  const { page, limit } = paginationSchema.parse(req.query);
  const where = {
    userId,
    status: {
      in: [EmailStatus.SCHEDULED, EmailStatus.PROCESSING],
    },
  };

  const [items, total] = await prisma.$transaction([
    prisma.scheduledEmail.findMany({
      where,
      include: {
        batch: { select: { subject: true } },
        sender: { select: { name: true, email: true } },
      },
      orderBy: { scheduledAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.scheduledEmail.count({ where }),
  ]);

  res.json({ items: items.map(toEmailDto), page, limit, total });
}

export async function listSent(req: Request, res: Response) {
  const userId = req.authUser?.id;
  if (!userId) throw new HttpError(401, "Authentication required.");

  const { page, limit } = paginationSchema.parse(req.query);
  const where = {
    userId,
    status: {
      in: [EmailStatus.SENT, EmailStatus.FAILED],
    },
  };

  const [items, total] = await prisma.$transaction([
    prisma.scheduledEmail.findMany({
      where,
      include: {
        batch: { select: { subject: true } },
        sender: { select: { name: true, email: true } },
      },
      orderBy: [{ sentAt: "desc" }, { failedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.scheduledEmail.count({ where }),
  ]);

  res.json({ items: items.map(toEmailDto), page, limit, total });
}

function toEmailDto(item: {
  id: string;
  recipient: string;
  scheduledAt: Date;
  status: EmailStatus;
  sentAt: Date | null;
  failedAt: Date | null;
  previewUrl: string | null;
  lastError: string | null;
  batch: { subject: string };
  sender: { name: string; email: string };
}) {
  return {
    id: item.id,
    recipient: item.recipient,
    subject: item.batch.subject,
    scheduledAt: item.scheduledAt,
    status: item.status.toLowerCase(),
    sentAt: item.sentAt,
    failedAt: item.failedAt,
    previewUrl: item.previewUrl,
    lastError: item.lastError,
    sender: item.sender,
  };
}
