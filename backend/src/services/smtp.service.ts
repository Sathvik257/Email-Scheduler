import nodemailer, { type Transporter } from "nodemailer";
import { getEtherealAccount } from "./sender.service.js";
import { HttpError } from "../utils/http-error.js";

const transporters = new Map<string, Transporter>();

function getTransporter(senderKey: string): Transporter {
  const cached = transporters.get(senderKey);
  if (cached) return cached;

  const account = getEtherealAccount(senderKey);
  if (!account) {
    throw new HttpError(500, `SMTP sender '${senderKey}' is not configured.`);
  }

  const transporter = nodemailer.createTransport({
    host: account.host,
    port: account.port,
    secure: account.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  });

  transporters.set(senderKey, transporter);
  return transporter;
}

export async function verifyAllSmtpConnections(): Promise<void> {
  for (const account of new Set(Array.from(transporters.keys()))) {
    await getTransporter(account).verify();
  }
}

export async function sendEtherealEmail(input: {
  emailId: string;
  senderKey: string;
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  body: string;
}) {
  const transporter = getTransporter(input.senderKey);
  const info = await transporter.sendMail({
    from: {
      name: input.fromName,
      address: input.fromEmail,
    },
    to: input.to,
    subject: input.subject,
    text: input.body,
    html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(input.body)}</div>`,
    messageId: `<scheduled-${input.emailId}@reachinbox.local>`,
  });

  return {
    providerMessageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info) || null,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
