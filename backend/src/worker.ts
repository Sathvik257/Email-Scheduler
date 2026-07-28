import { prisma } from "./db/prisma.js";
import { startEmailWorker } from "./queue/email.worker.js";
import { reconcileScheduledJobs } from "./services/scheduler.service.js";
import { syncConfiguredSenders } from "./services/sender.service.js";

async function bootstrap() {
  await prisma.$connect();
  await syncConfiguredSenders();
  const restoredJobs = await reconcileScheduledJobs();

  const worker = startEmailWorker();
  console.log(`[worker] started; restored ${restoredJobs} scheduled job(s)`);

  const shutdown = async (signal: string) => {
    console.log(`[worker] ${signal}; shutting down`);
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch(async (error) => {
  console.error("[worker] startup failed", error);
  await prisma.$disconnect();
  process.exit(1);
});
