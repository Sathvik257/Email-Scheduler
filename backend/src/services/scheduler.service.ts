import { randomUUID } from "node:crypto";
import { EmailStatus } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { emailQueue } from "../queue/email.queue.js";
import { HttpError } from "../utils/http-error.js";

type ScheduleInput = {
  userId: string;
  senderId: string;
  subject: string;
  body: string;
  recipients: string[];
  startTime: Date;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
  idempotencyKey: string;
};

export async function scheduleEmailBatch(input: ScheduleInput) {
  const existing = await prisma.emailBatch.findUnique({
    where: {
      userId_idempotencyKey: {
        userId: input.userId,
        idempotencyKey: input.idempotencyKey,
      },
    },
    include: {
      emails: {
        orderBy: { scheduledAt: "asc" },
      },
    },
  });

  if (existing) {
    await enqueueScheduledRows(
      existing.emails.filter((email) => email.status === EmailStatus.SCHEDULED),
    );
    return { batch: existing, replayed: true };
  }

  const sender = await prisma.sender.findFirst({
    where: { id: input.senderId, active: true },
  });
  if (!sender) throw new HttpError(400, "Selected sender is unavailable.");

  const recipients = Array.from(
    new Set(input.recipients.map((email) => email.trim().toLowerCase())),
  );

  if (recipients.length === 0) {
    throw new HttpError(400, "At least one recipient is required.");
  }

  const effectiveDelayMs = Math.max(
    input.delayBetweenEmailsMs,
    env.MIN_EMAIL_DELAY_MS,
  );
  const effectiveHourlyLimit = Math.min(
    input.hourlyLimit,
    env.MAX_EMAILS_PER_HOUR,
  );

  const scheduledTimes = calculateScheduledTimes({
    count: recipients.length,
    startTime: input.startTime,
    delayMs: effectiveDelayMs,
    hourlyLimit: effectiveHourlyLimit,
  });

  const batchId = randomUUID();
  const rows = recipients.map((recipient, index) => {
    const id = randomUUID();
    return {
      id,
      batchId,
      userId: input.userId,
      senderId: sender.id,
      recipient,
      scheduledAt: scheduledTimes[index]!,
      status: EmailStatus.SCHEDULED,
      bullJobId: `email-${id}`,
    };
  });

  await prisma.$transaction(async (tx) => {
    await tx.emailBatch.create({
      data: {
        id: batchId,
        userId: input.userId,
        senderId: sender.id,
        idempotencyKey: input.idempotencyKey,
        subject: input.subject,
        body: input.body,
        startTime: input.startTime,
        requestedDelayMs: input.delayBetweenEmailsMs,
        effectiveDelayMs,
        requestedHourlyLimit: input.hourlyLimit,
        effectiveHourlyLimit,
        recipientCount: rows.length,
      },
    });

    await tx.scheduledEmail.createMany({ data: rows });
  });

  await enqueueScheduledRows(rows);

  const batch = await prisma.emailBatch.findUniqueOrThrow({
    where: { id: batchId },
    include: {
      emails: {
        orderBy: { scheduledAt: "asc" },
      },
    },
  });

  return { batch, replayed: false };
}

async function enqueueScheduledRows(
  rows: Array<{ id: string; bullJobId: string; scheduledAt: Date }>,
): Promise<void> {
  if (rows.length === 0) return;

  await emailQueue.addBulk(
    rows.map((row) => ({
      name: "send-email",
      data: { emailId: row.id },
      opts: {
        jobId: row.bullJobId,
        delay: Math.max(0, row.scheduledAt.getTime() - Date.now()),
      },
    })),
  );
}

export function calculateScheduledTimes(input: {
  count: number;
  startTime: Date;
  delayMs: number;
  hourlyLimit: number;
}): Date[] {
  const times: Date[] = [];
  let cursor = Math.max(input.startTime.getTime(), Date.now());
  let windowStart = cursor;
  let usedInWindow = 0;

  for (let index = 0; index < input.count; index += 1) {
    if (usedInWindow >= input.hourlyLimit) {
      windowStart += 60 * 60 * 1000;
      cursor = Math.max(cursor, windowStart);
      usedInWindow = 0;
    }

    times.push(new Date(cursor));
    cursor += input.delayMs;
    usedInWindow += 1;
  }

  return times;
}

export async function reconcileScheduledJobs(): Promise<number> {
  const scheduled = await prisma.scheduledEmail.findMany({
    where: { status: EmailStatus.SCHEDULED },
    select: {
      id: true,
      bullJobId: true,
      scheduledAt: true,
    },
    orderBy: { scheduledAt: "asc" },
  });

  let restored = 0;
  for (const email of scheduled) {
    const existing = await emailQueue.getJob(email.bullJobId);
    if (existing) continue;

    await emailQueue.add(
      "send-email",
      { emailId: email.id },
      {
        jobId: email.bullJobId,
        delay: Math.max(0, email.scheduledAt.getTime() - Date.now()),
      },
    );
    restored += 1;
  }

  return restored;
}
