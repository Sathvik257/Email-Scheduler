import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";
import { appRedis } from "./redis/connections.js";

async function startServer(): Promise<void> {
  await prisma.$connect();

  const redisResponse = await appRedis.ping();

  if (redisResponse !== "PONG") {
    throw new Error("Redis connection failed");
  }

const server = app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Backend running at http://localhost:${env.PORT}`);
    console.log("PostgreSQL connected");
    console.log("Redis connected");
  });

  async function shutdown(signal: string): Promise<void> {
    console.log(`\nReceived ${signal}. Shutting down...`);

    server.close(async () => {
      await Promise.allSettled([
        prisma.$disconnect(),
        appRedis.quit(),
      ]);

      console.log("Backend shut down successfully");
      process.exit(0);
    });

    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000).unref();
  }

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

startServer().catch(async (error: unknown) => {
  console.error("Failed to start backend:", error);

  await Promise.allSettled([
    prisma.$disconnect(),
    appRedis.quit(),
  ]);

  process.exit(1);
});
