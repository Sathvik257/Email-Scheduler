import { Router } from "express";
import { googleLogin, me } from "../controllers/auth.controller.js";
import { listScheduled, listSent, schedule } from "../controllers/email.controller.js";
import { listSenders } from "../controllers/sender.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

apiRouter.post("/auth/google", asyncHandler(googleLogin));
apiRouter.get("/auth/me", requireAuth, asyncHandler(me));

apiRouter.get("/senders", requireAuth, asyncHandler(listSenders));
apiRouter.post("/emails/schedule", requireAuth, asyncHandler(schedule));
apiRouter.get("/emails/scheduled", requireAuth, asyncHandler(listScheduled));
apiRouter.get("/emails/sent", requireAuth, asyncHandler(listSent));
