import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

type TokenPayload = {
  sub: string;
  email: string;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    next(new HttpError(401, "Authentication required."));
    return;
  }

  try {
    const token = header.slice("Bearer ".length);
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: "reachinbox-scheduler",
      audience: "reachinbox-dashboard",
    }) as TokenPayload;
    req.authUser = { id: decoded.sub, email: decoded.email };
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired session."));
  }
}
