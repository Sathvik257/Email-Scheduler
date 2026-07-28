import "dotenv/config";
import { z } from "zod";

const boolFromString = z.preprocess(
  (value) => value === true || value === "true",
  z.boolean(),
);

const accountSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  user: z.string().min(1),
  pass: z.string().min(1),
  host: z.string().default("smtp.ethereal.email"),
  port: z.coerce.number().int().positive().default(587),
  secure: boolFromString.default(false),
});

const rawSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(10),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(100).default(5),
  MIN_EMAIL_DELAY_MS: z.coerce.number().int().min(250).default(2000),
  MAX_EMAILS_PER_HOUR: z.coerce.number().int().min(1).default(200),
  ETHEREAL_ACCOUNTS_JSON: z.string().min(2),
});

const parsed = rawSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

let etherealAccounts: z.infer<typeof accountSchema>[];
try {
  const raw = JSON.parse(parsed.data.ETHEREAL_ACCOUNTS_JSON);
  etherealAccounts = z.array(accountSchema).min(1).parse(raw);
} catch (error) {
  console.error("ETHEREAL_ACCOUNTS_JSON must be valid JSON containing at least one SMTP account.", error);
  process.exit(1);
}

const uniqueKeys = new Set(etherealAccounts.map((account) => account.key));
if (uniqueKeys.size !== etherealAccounts.length) {
  console.error("Every Ethereal account must have a unique key.");
  process.exit(1);
}

export const env = {
  ...parsed.data,
  etherealAccounts,
};
