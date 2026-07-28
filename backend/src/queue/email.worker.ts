import { EmailStatus } from "@prisma/client";
import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { createRedisConnection } from "../redis/connections.js";
import { consumeGlobalHourlySlot } from "../services/rate-limit.service.js";
import { sendEtherealEmail } from "../services/smtp.service.js";
import { EMAIL_QUEUE_NAME, type EmailJobData } from "./email.queue.js";

export function startEmailWorker() {
  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job) => {
      const email = await prisma.scheduledEmail.findUnique({
        where: { id: job.data.emailId },
        include: {
          batch: true,
          sender: true,
        },
      });

      if (!email) return { skipped: "missing-database-row" };
      if (email.status === EmailStatus.SENT) return { skipped: "already-sent" };

      if (email.status === EmailStatus.PROCESSING) {
        // A second execution of a PROCESSING row normally means the first worker
        // lost its lock or restarted during SMTP delivery. SMTP has no atomic
        // idempotency key, so automatically sending again could duplicate mail.
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: {
            status: EmailStatus.FAILED,
            failedAt: new Date(),
            processingStartedAt: null,
            lastError:
              "Delivery state became uncertain after a worker interruption. Automatic resend was suppressed to prevent a duplicate.",
          },
        });
        return { skipped: "uncertain-delivery-not-retried" };
      }

      const hourlyGate = await consumeGlobalHourlySlot();
      if (hourlyGate.allowed === false) {
        const retryAt = new Date(Date.now() + hourlyGate.retryAfterMs);
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: {
            status: EmailStatus.SCHEDULED,
            scheduledAt: retryAt,
            lastError: "Delayed because the configured global hourly limit was reached.",
          },
        });

        await worker.rateLimit(hourlyGate.retryAfterMs);
        throw Worker.RateLimitError();
      }

      const claim = await prisma.scheduledEmail.updateMany({
        where: {
          id: email.id,
          status: {
            in: [EmailStatus.SCHEDULED, EmailStatus.FAILED],
          },
        },
        data: {
          status: EmailStatus.PROCESSING,
          processingStartedAt: new Date(),
          failedAt: null,
          lastError: null,
          attemptCount: { increment: 1 },
        },
      });

      if (claim.count !== 1) return { skipped: "claim-lost" };

      try {
        const result = await sendEtherealEmail({
          emailId: email.id,
          senderKey: email.sender.key,
          fromName: email.sender.name,
          fromEmail: email.sender.email,
          to: email.recipient,
          subject: email.batch.subject,
          body: email.batch.body,
        });

        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: {
            status: EmailStatus.SENT,
            sentAt: new Date(),
            processingStartedAt: null,
            providerMessageId: result.providerMessageId,
            previewUrl: result.previewUrl,
            lastError: null,
          },
        });

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown SMTP error";
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: {
            status: EmailStatus.FAILED,
            failedAt: new Date(),
            processingStartedAt: null,
            lastError: message,
          },
        });
        throw error instanceof Error ? error : new Error(message);
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: env.WORKER_CONCURRENCY,
      limiter: {
        max: 1,
        duration: env.MIN_EMAIL_DELAY_MS,
      },
    },
  );

  worker.on("completed", (job) => {
    console.log(`[worker] completed ${job.id}`);
  });

  worker.on("failed", (job, error) => {
    console.error(`[worker] failed ${job?.id}: ${error.message}`);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`[worker] stalled ${jobId}`);
  });

  worker.on("error", (error) => {
    console.error("[worker] error", error);
  });

  return worker;
}
