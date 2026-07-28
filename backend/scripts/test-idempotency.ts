import { prisma } from "../src/db/prisma.js";
import { emailQueue } from "../src/queue/email.queue.js";
import { scheduleEmailBatch } from "../src/services/scheduler.service.js";

async function testIdempotency(): Promise<void> {
  const user = await prisma.user.findFirst();
  const sender = await prisma.sender.findFirst({
    where: { active: true },
  });

  if (!user || !sender) {
    throw new Error("A user and active sender are required.");
  }

  const idempotencyKey = `idempotency-test-${Date.now()}`;

  const input = {
    userId: user.id,
    senderId: sender.id,
    subject: "Idempotency Test",
    body: "This request should create only one scheduled email.",
    recipients: ["idempotency@example.com"],
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    delayBetweenEmailsMs: 2000,
    hourlyLimit: 10,
    idempotencyKey,
  };

  const firstResult = await scheduleEmailBatch(input);
  const secondResult = await scheduleEmailBatch(input);

  const batches = await prisma.emailBatch.findMany({
    where: {
      userId: user.id,
      idempotencyKey,
    },
    include: {
      emails: true,
    },
  });

  console.log("\nIdempotency test:");
  console.table({
    firstRequestReplayed: firstResult.replayed,
    secondRequestReplayed: secondResult.replayed,
    sameBatchId: firstResult.batch.id === secondResult.batch.id,
    databaseBatchCount: batches.length,
    databaseEmailCount: batches.reduce(
      (total, batch) => total + batch.emails.length,
      0,
    ),
  });

  for (const batch of batches) {
    for (const email of batch.emails) {
      const job = await emailQueue.getJob(email.bullJobId);
      if (job) {
        await job.remove();
      }
    }
  }

  await prisma.emailBatch.deleteMany({
    where: {
      userId: user.id,
      idempotencyKey,
    },
  });

  console.log("\nTemporary test records and delayed jobs were removed.");
}

testIdempotency()
  .catch((error: unknown) => {
    console.error("Idempotency test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await emailQueue.close();
    await prisma.$disconnect();
  });
