import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { loginWithGoogle } from "../services/auth.service.js";
import { HttpError } from "../utils/http-error.js";

const loginSchema = z.object({
  credential: z.string().min(20),
});

export async function googleLogin(req: Request, res: Response) {
  const { credential } = loginSchema.parse(req.body);
  const result = await loginWithGoogle(credential);
  res.json(result);
}

export async function me(req: Request, res: Response) {
  const userId = req.authUser?.id;
  if (!userId) throw new HttpError(401, "Authentication required.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
    },
  });

  if (!user) throw new HttpError(404, "User not found.");
  res.json({ user });
}
