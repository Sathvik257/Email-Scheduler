import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

const allowedOrigins = new Set(
  [
    env.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://reachinbox-frontend.onrender.com",
  ].map((origin) => origin.replace(/\/$/, "")),
);

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
  }),
);
app.use(express.json({ limit: "2mb" }));

app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);
