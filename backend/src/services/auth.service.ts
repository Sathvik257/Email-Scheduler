import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { HttpError } from "../utils/http-error.js";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function loginWithGoogle(credential: string) {
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch (error) {
    console.error("Google token verification failed:", error);
    throw new HttpError(401, "Google login could not be verified. Check the backend GOOGLE_CLIENT_ID.");
  }

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || !payload.name || !payload.email_verified) {
    throw new HttpError(401, "Google account could not be verified.");
  }

  const user = await prisma.user.upsert({
    where: { googleSub: payload.sub },
    create: {
      googleSub: payload.sub,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture,
    },
    update: {
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
    },
  });

  const token = jwt.sign(
    { email: user.email },
    env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: "12h",
      issuer: "reachinbox-scheduler",
      audience: "reachinbox-dashboard",
    },
  );

  return { token, user };
}
