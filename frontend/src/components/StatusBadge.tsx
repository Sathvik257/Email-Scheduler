import type { EmailStatus } from "../types";

export function StatusBadge({ status }: { status: EmailStatus }) {
  const styles: Record<EmailStatus, string> = {
    scheduled: "bg-amber-50 text-amber-700 ring-amber-600/20",
    processing: "bg-sky-50 text-sky-700 ring-sky-600/20",
    sent: "bg-teal-50 text-teal-700 ring-teal-600/20",
    failed: "bg-rose-50 text-rose-700 ring-rose-600/20",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}
