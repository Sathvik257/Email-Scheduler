import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  FileUp,
  Gauge,
  Loader2,
  Mail,
  Send,
  Settings2,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { api, getApiError } from "../lib/api";
import { extractEmails } from "../lib/email-parser";
import type { Sender } from "../types";
import { Button } from "./Button";
import { randomUUID } from "./uuid";

type Props = {
  senders: Sender[];
  onClose: () => void;
  onScheduled: () => void;
};

export function ComposeModal({
  senders,
  onClose,
  onScheduled,
}: Props) {
  const [senderId, setSenderId] = useState(senders[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [startTime, setStartTime] = useState(
    toLocalInputValue(new Date(Date.now() + 60_000)),
  );
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(200);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, submitting]);

  const selectedSender = useMemo(
    () => senders.find((sender) => sender.id === senderId),
    [senderId, senders],
  );

  const recipientLabel = useMemo(() => {
    if (recipients.length === 0) {
      return "No email addresses detected yet";
    }

    return `${recipients.length} unique email address${
      recipients.length === 1 ? "" : "es"
    } detected`;
  }, [recipients.length]);

  const estimatedDuration = useMemo(
    () =>
      formatEstimatedDuration(
        recipients.length,
        delaySeconds,
        hourlyLimit,
      ),
    [delaySeconds, hourlyLimit, recipients.length],
  );

  const canSubmit =
    Boolean(senderId) &&
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    recipients.length > 0 &&
    Boolean(startTime) &&
    delaySeconds >= 0.25 &&
    hourlyLimit >= 1 &&
    !submitting;

  async function handleFile(file?: File) {
    if (!file) return;

    setError("");
    setFileLoading(true);

    try {
      const allowedExtension = /\.(csv|txt)$/i.test(file.name);

      if (!allowedExtension) {
        throw new Error("Please upload a CSV or TXT file.");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("The lead file must be smaller than 5 MB.");
      }

      const text = await file.text();
      const detectedEmails = extractEmails(text);

      if (detectedEmails.length === 0) {
        throw new Error(
          "No valid email addresses were found in this file.",
        );
      }

      setFileName(file.name);
      setRecipients(detectedEmails);
    } catch (fileError) {
      setFileName("");
      setRecipients([]);
      setError(
        fileError instanceof Error
          ? fileError.message
          : "Unable to read the selected file.",
      );
    } finally {
      setFileLoading(false);
    }
  }

  function clearFile() {
    setFileName("");
    setRecipients([]);
    setError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!senderId) {
      setError("Choose an active sender.");
      return;
    }

    if (!subject.trim()) {
      setError("Enter an email subject.");
      return;
    }

    if (!body.trim()) {
      setError("Enter the email body.");
      return;
    }

    if (recipients.length === 0) {
      setError(
        "Upload a CSV or text file containing valid email addresses.",
      );
      return;
    }

    const parsedStartTime = new Date(startTime);

    if (Number.isNaN(parsedStartTime.getTime())) {
      setError("Choose a valid campaign start time.");
      return;
    }

    if (delaySeconds < 0.25 || delaySeconds > 3600) {
      setError(
        "Delay must be between 0.25 and 3,600 seconds.",
      );
      return;
    }

    if (hourlyLimit < 1 || hourlyLimit > 100000) {
      setError(
        "Hourly limit must be between 1 and 100,000.",
      );
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/emails/schedule", {
        senderId,
        subject: subject.trim(),
        body: body.trim(),
        recipients,
        startTime: parsedStartTime.toISOString(),
        delayBetweenEmailsMs: Math.round(delaySeconds * 1000),
        hourlyLimit,
        idempotencyKey: randomUUID(),
      });

      onScheduled();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-email-title"
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl shadow-slate-950/30"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-3 text-white shadow-lg shadow-indigo-200">
              <Send className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
                New campaign
              </p>

              <h2
                id="compose-email-title"
                className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl"
              >
                Compose New Email
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Upload leads and configure a persistent BullMQ campaign.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close compose dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit}
        >
          <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50/70 px-5 py-6 sm:px-7">
            <FormSection
              icon={<Mail className="h-5 w-5" />}
              title="Campaign content"
              description="Choose the sending account and write the email."
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <Field
                  label="Sender account"
                  hint="The selected Ethereal SMTP identity will send this campaign."
                >
                  <select
                    value={senderId}
                    onChange={(event) =>
                      setSenderId(event.target.value)
                    }
                    className={inputClass}
                    required
                  >
                    {senders.map((sender) => (
                      <option key={sender.id} value={sender.id}>
                        {sender.name} — {sender.email}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Subject"
                  hint={`${subject.length}/200 characters`}
                >
                  <input
                    value={subject}
                    onChange={(event) =>
                      setSubject(event.target.value)
                    }
                    className={inputClass}
                    placeholder="A quick idea for your team"
                    maxLength={200}
                    required
                  />
                </Field>
              </div>

              <Field
                label="Email body"
                hint="Plain text is also rendered safely in the Ethereal HTML preview."
              >
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  className={`${inputClass} min-h-40 resize-y leading-6`}
                  placeholder={
                    "Hi there,\n\nI wanted to reach out about...\n\nBest regards,"
                  }
                  maxLength={100000}
                  required
                />
              </Field>
            </FormSection>

            <FormSection
              icon={<UsersRound className="h-5 w-5" />}
              title="Recipients"
              description="Upload a CSV or text file containing lead email addresses."
            >
              <label className="group block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5 transition hover:border-indigo-400 hover:bg-indigo-50/40">
                <div className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
                  <div className="flex flex-col items-center gap-3 sm:flex-row">
                    <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 transition group-hover:bg-indigo-100">
                      {fileLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <FileUp className="h-6 w-6" />
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {fileLoading
                          ? "Reading lead file..."
                          : fileName || "Upload lead file"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        CSV or TXT, up to 5 MB
                      </p>
                    </div>
                  </div>

                  <span className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition group-hover:border-indigo-200 group-hover:text-indigo-600">
                    Browse files
                  </span>
                </div>

                <input
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  className="hidden"
                  disabled={fileLoading || submitting}
                  onChange={(event) =>
                    void handleFile(event.target.files?.[0])
                  }
                />
              </label>

              <div
                className={`mt-4 rounded-2xl border p-4 ${
                  recipients.length > 0
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-xl p-2 ${
                        recipients.length > 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {recipients.length > 0 ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <p
                        className={`text-sm font-bold ${
                          recipients.length > 0
                            ? "text-emerald-900"
                            : "text-slate-700"
                        }`}
                      >
                        {recipientLabel}
                      </p>

                      {fileName && (
                        <p className="mt-1 text-xs text-slate-500">
                          Source: {fileName}
                        </p>
                      )}
                    </div>
                  </div>

                  {recipients.length > 0 && (
                    <button
                      type="button"
                      onClick={clearFile}
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove file
                    </button>
                  )}
                </div>

                {recipients.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {recipients.slice(0, 5).map((recipient) => (
                      <span
                        key={recipient}
                        className="max-w-full truncate rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-800"
                      >
                        {recipient}
                      </span>
                    ))}

                    {recipients.length > 5 && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        +{recipients.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </FormSection>

            <FormSection
              icon={<Settings2 className="h-5 w-5" />}
              title="Delivery settings"
              description="Control when delivery starts and how quickly jobs are processed."
            >
              <div className="grid gap-5 md:grid-cols-3">
                <Field
                  label="Start time"
                  hint="Past times begin as soon as a worker is available."
                >
                  <div className="relative">
                    <CalendarClock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />

                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(event) =>
                        setStartTime(event.target.value)
                      }
                      className={`${inputClass} pl-10`}
                      required
                    />
                  </div>
                </Field>

                <Field
                  label="Delay between emails"
                  hint="Minimum 0.25 seconds"
                >
                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />

                    <input
                      type="number"
                      min={0.25}
                      step={0.25}
                      max={3600}
                      value={delaySeconds}
                      onChange={(event) =>
                        setDelaySeconds(Number(event.target.value))
                      }
                      className={`${inputClass} pl-10 pr-20`}
                      required
                    />

                    <span className="pointer-events-none absolute right-3.5 top-3 text-sm text-slate-400">
                      seconds
                    </span>
                  </div>
                </Field>

                <Field
                  label="Hourly limit"
                  hint="Excess recipients move to the next hour."
                >
                  <div className="relative">
                    <Gauge className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />

                    <input
                      type="number"
                      min={1}
                      max={100000}
                      value={hourlyLimit}
                      onChange={(event) =>
                        setHourlyLimit(Number(event.target.value))
                      }
                      className={`${inputClass} pl-10 pr-20`}
                      required
                    />

                    <span className="pointer-events-none absolute right-3.5 top-3 text-sm text-slate-400">
                      / hour
                    </span>
                  </div>
                </Field>
              </div>

              <div className="mt-5 grid gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 sm:grid-cols-3">
                <SummaryItem
                  label="Recipients"
                  value={String(recipients.length)}
                />

                <SummaryItem
                  label="Estimated span"
                  value={estimatedDuration}
                />

                <SummaryItem
                  label="Sender"
                  value={selectedSender?.name ?? "Not selected"}
                />
              </div>
            </FormSection>

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                <div>
                  <p className="font-bold">
                    Unable to schedule campaign
                  </p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            )}
          </div>

          <footer className="flex shrink-0 flex-col-reverse justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:px-7">
            <p className="text-xs text-slate-400">
              Jobs are persisted through PostgreSQL, Redis, and BullMQ.
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={!canSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Schedule{" "}
                    {recipients.length > 0
                      ? `${recipients.length} email${
                          recipients.length === 1 ? "" : "s"
                        }`
                      : "campaign"}
                  </>
                )}
              </Button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
          {icon}
        </div>

        <div>
          <h3 className="font-bold text-slate-950">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-700">
          {label}
        </span>

        {hint && (
          <span className="text-right text-xs text-slate-400">
            {hint}
          </span>
        )}
      </div>

      {children}
    </label>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-indigo-950">
        {value}
      </p>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-100";

function toLocalInputValue(date: Date): string {
  const shifted = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return shifted.toISOString().slice(0, 16);
}

function formatEstimatedDuration(
  recipientCount: number,
  delaySeconds: number,
  hourlyLimit: number,
): string {
  if (recipientCount <= 1) {
    return recipientCount === 0 ? "Not available" : "Immediate";
  }

  if (
    !Number.isFinite(delaySeconds) ||
    !Number.isFinite(hourlyLimit) ||
    delaySeconds <= 0 ||
    hourlyLimit <= 0
  ) {
    return "Not available";
  }

  const lastRecipientIndex = recipientCount - 1;
  const fullHourlyWindows = Math.floor(
    lastRecipientIndex / hourlyLimit,
  );
  const positionInFinalWindow =
    lastRecipientIndex % hourlyLimit;

  const totalSeconds =
    fullHourlyWindows * 3600 +
    positionInFinalWindow * delaySeconds;

  if (totalSeconds < 60) {
    return `${Math.ceil(totalSeconds)} sec`;
  }

  if (totalSeconds < 3600) {
    return `${Math.ceil(totalSeconds / 60)} min`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.ceil(
    (totalSeconds % 3600) / 60,
  );

  return minutes > 0
    ? `${hours} hr ${minutes} min`
    : `${hours} hr`;
}