import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MailCheck,
  Plus,
  RefreshCw,
  Send,
  Server,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "../components/Button";
import { ComposeModal } from "../components/ComposeModal";
import { EmailTable } from "../components/EmailTable";
import { Header } from "../components/Header";
import { api, getApiError } from "../lib/api";
import type { EmailRow, PaginatedEmails, Sender, User } from "../types";

type DashboardTab = "scheduled" | "sent";

type Notice = {
  type: "success" | "error";
  text: string;
} | null;

export function DashboardPage({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<DashboardTab>("scheduled");
  const [scheduled, setScheduled] = useState<EmailRow[]>([]);
  const [sent, setSent] = useState<EmailRow[]>([]);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [apiOnline, setApiOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setRefreshing(true);
    }

    try {
      const [scheduledResponse, sentResponse, senderResponse] =
        await Promise.all([
          api.get<PaginatedEmails>("/emails/scheduled?limit=100"),
          api.get<PaginatedEmails>("/emails/sent?limit=100"),
          api.get<{ senders: Sender[] }>("/senders"),
        ]);

      setScheduled(scheduledResponse.data.items);
      setSent(sentResponse.data.items);
      setSenders(senderResponse.data.senders);
      setApiOnline(true);
      setLastUpdated(new Date());

      setNotice((current) =>
        current?.type === "error" ? null : current,
      );
    } catch (error) {
      setApiOnline(false);
      setNotice({
        type: "error",
        text: getApiError(error),
      });
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const interval = window.setInterval(() => {
      void refresh();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  const metrics = useMemo(() => {
    const scheduledCount = scheduled.filter(
      (email) => email.status === "scheduled",
    ).length;

    const processingCount = scheduled.filter(
      (email) => email.status === "processing",
    ).length;

    const sentCount = sent.filter(
      (email) => email.status === "sent",
    ).length;

    const failedCount = sent.filter(
      (email) => email.status === "failed",
    ).length;

    return {
      scheduledCount,
      processingCount,
      sentCount,
      failedCount,
    };
  }, [scheduled, sent]);

  const activeRows = tab === "scheduled" ? scheduled : sent;

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Header user={user} onLogout={onLogout} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4f46e5] via-[#5b5cf0] to-[#7c3aed] px-6 py-8 text-white shadow-xl shadow-indigo-200/60 sm:px-8 lg:px-10">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-28 h-48 w-48 rounded-full bg-white/10" />

          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                ReachInbox email operations
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Email Scheduler Dashboard
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                Schedule persistent email jobs, monitor BullMQ processing,
                manage multiple senders, and review Ethereal delivery previews.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium text-indigo-100">
                <SystemPill
                  icon={<Server className="h-3.5 w-3.5" />}
                  text={apiOnline ? "API connected" : "API unavailable"}
                  active={apiOnline}
                />

                <SystemPill
                  icon={<Activity className="h-3.5 w-3.5" />}
                  text="Auto-refresh every 5 seconds"
                  active
                />

                <SystemPill
                  icon={<Send className="h-3.5 w-3.5" />}
                  text={`${senders.length} active sender${
                    senders.length === 1 ? "" : "s"
                  }`}
                  active={senders.length > 0}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Button
                variant="secondary"
                onClick={() => void refresh(true)}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>

              <Button
                onClick={() => setComposeOpen(true)}
                disabled={senders.length === 0}
              >
                <Plus className="h-4 w-4" />
                Compose New Email
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Clock3 className="h-5 w-5" />}
            label="Scheduled"
            value={metrics.scheduledCount}
            description="Waiting for delivery time"
            iconClassName="bg-indigo-50 text-indigo-600"
          />

          <MetricCard
            icon={<Activity className="h-5 w-5" />}
            label="Processing"
            value={metrics.processingCount}
            description="Currently handled by workers"
            iconClassName="bg-amber-50 text-amber-600"
          />

          <MetricCard
            icon={<MailCheck className="h-5 w-5" />}
            label="Sent"
            value={metrics.sentCount}
            description="Successfully delivered"
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          <MetricCard
            icon={<XCircle className="h-5 w-5" />}
            label="Failed"
            value={metrics.failedCount}
            description="Needs attention or review"
            iconClassName="bg-rose-50 text-rose-600"
          />
        </section>

        {notice && (
          <div
            className={`mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <span className="font-medium">{notice.text}</span>
          </div>
        )}

        {senders.length === 0 && !initialLoading && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">No active sender configured</p>
              <p className="mt-1 text-amber-800">
                Synchronize an Ethereal SMTP sender before composing emails.
              </p>
            </div>
          </div>
        )}

        <section className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Email activity
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View current queue activity and completed delivery results.
              </p>
            </div>

            <div className="text-xs text-slate-400">
              {lastUpdated
                ? `Last updated ${lastUpdated.toLocaleTimeString()}`
                : "Loading latest data..."}
            </div>
          </div>

          <div className="flex overflow-x-auto border-b border-slate-200 px-3 pt-3 sm:px-5">
            <TabButton
              active={tab === "scheduled"}
              count={scheduled.length}
              onClick={() => setTab("scheduled")}
            >
              Scheduled Emails
            </TabButton>

            <TabButton
              active={tab === "sent"}
              count={sent.length}
              onClick={() => setTab("sent")}
            >
              Sent Emails
            </TabButton>
          </div>

          <div className="p-4 sm:p-5">
            <EmailTable
              rows={activeRows}
              loading={initialLoading}
              mode={tab}
            />
          </div>
        </section>
      </main>

      {composeOpen && (
        <ComposeModal
          senders={senders}
          onClose={() => setComposeOpen(false)}
          onScheduled={() => {
            setComposeOpen(false);
            setNotice({
              type: "success",
              text: "Emails scheduled successfully.",
            });
            void refresh(true);
          }}
        />
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  description,
  iconClassName,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  description: string;
  iconClassName: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-2.5 ${iconClassName}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function SystemPill({
  icon,
  text,
  active,
}: {
  icon: ReactNode;
  text: string;
  active: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
      <span
        className={`h-2 w-2 rounded-full ${
          active ? "bg-emerald-300" : "bg-rose-300"
        }`}
      />
      {icon}
      <span>{text}</span>
    </div>
  );
}

function TabButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`flex min-w-fit items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
        active
          ? "border-[#5b5cf0] text-[#5b5cf0]"
          : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-800"
      }`}
      onClick={onClick}
    >
      {children}

      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          active
            ? "bg-indigo-50 text-[#5b5cf0]"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}