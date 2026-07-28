import { prisma } from "../src/db/prisma.js";

async function inspectLatestBatch(): Promise<void> {
  const batch = await prisma.emailBatch.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      emails: {
        orderBy: {
          scheduledAt: "asc",
        },
        select: {
          recipient: true,
          scheduledAt: true,
          sentAt: true,
          status: true,
        },
      },
    },
  });

  if (!batch) {
    console.log("No email batch found.");
    return;
  }

  console.log("\nLatest batch settings:");
  console.table({
    subject: batch.subject,
    recipientCount: batch.recipientCount,
    requestedDelayMs: batch.requestedDelayMs,
    effectiveDelayMs: batch.effectiveDelayMs,
    requestedHourlyLimit: batch.requestedHourlyLimit,
    effectiveHourlyLimit: batch.effectiveHourlyLimit,
    startTime: batch.startTime.toISOString(),
  });

  console.log("\nEmail schedule:");
  console.table(
    batch.emails.map((email, index) => {
      const previous = index > 0 ? batch.emails[index - 1] : null;

      return {
        recipient: email.recipient,
        scheduledAt: email.scheduledAt.toISOString(),
        sentAt: email.sentAt?.toISOString() ?? "not sent",
        status: email.status,
        gapFromPreviousSeconds: previous
          ? (email.scheduledAt.getTime() - previous.scheduledAt.getTime()) / 1000
          : 0,
      };
    }),
  );
}

inspectLatestBatch()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
