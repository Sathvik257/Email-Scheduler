export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export type Sender = {
  id: string;
  key: string;
  name: string;
  email: string;
};

export type EmailStatus = "scheduled" | "processing" | "sent" | "failed";

export type EmailRow = {
  id: string;
  recipient: string;
  subject: string;
  scheduledAt: string;
  status: EmailStatus;
  sentAt?: string | null;
  failedAt?: string | null;
  previewUrl?: string | null;
  lastError?: string | null;
  sender: {
    name: string;
    email: string;
  };
};

export type PaginatedEmails = {
  items: EmailRow[];
  page: number;
  limit: number;
  total: number;
};
