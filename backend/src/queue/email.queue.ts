import { Queue } from "bullmq";
import { createRedisConnection } from "../redis/connections.js";

export const EMAIL_QUEUE_NAME = "scheduled-emails";

export type EmailJobData = {
  emailId: string;
};

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});
