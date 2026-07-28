import {
  AlertCircle,
  CalendarClock,
  ExternalLink,
  Inbox,
  Mail,
  Search,
  Send,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { EmailRow } from "../types";
import { StatusBadge } from "./StatusBadge";

type EmailTableMode = "scheduled" | "sent";

type Props = {
  rows: EmailRow[];
  loading: boolean;
  mode: EmailTableMode;
};

export function EmailTable({
  rows,
  loading,
  mode,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const availableStatuses = useMemo(
    () =>
      Array.from(
        new Set(rows.map((row) => row.status)),
      ).sort(),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        row.recipient
          .toLowerCase()
          .includes(normalizedSearch) ||
        row.subject
          .toLowerCase()
          .includes(normalizedSearch) ||
        row.sender.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        row.sender.email
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        row.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  if (loading) {
    return <EmailTableSkeleton />;
  }

  if (rows.length === 0) {
    return <EmptyEmailState mode={mode} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search recipient, subject, or sender"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="min-w-36 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10"
          >
            <option value="all">All statuses</option>

            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {capitalize(status)}
              </option>
            ))}
          </select>

          <div className="hidden text-xs text-slate-400 sm:block">
            {filteredRows.length} of {rows.length}
          </div>
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <Search className="mx-auto h-8 w-8 text-slate-300" />

          <h3 className="mt-3 font-bold text-slate-800">
            No matching emails
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Try changing the search text or status filter.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="mt-4 text-sm font-bold text-teal-700 hover:text-teal-800"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/80">
                  <tr>
                    <TableHeading>Email</TableHeading>
                    <TableHeading>Subject</TableHeading>
                    <TableHeading>Sender</TableHeading>
                    <TableHeading>
                      {mode === "scheduled"
                        ? "Scheduled time"
                        : "Sent time"}
                    </TableHeading>
                    <TableHeading>Status</TableHeading>
                    <TableHeading align="right">
                      Action
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((row) => (
                    <DesktopEmailRow
                      key={row.id}
                      row={row}
                      mode={mode}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 lg:hidden">
            {filteredRows.map((row) => (
              <MobileEmailCard
                key={row.id}
                row={row}
                mode={mode}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DesktopEmailRow({
  row,
  mode,
}: {
  row: EmailRow;
  mode: EmailTableMode;
}) {
  const timestamp = getTimestamp(row, mode);

  return (
    <tr className="transition hover:bg-teal-50/30">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
            <Mail className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p
              className="max-w-56 truncate text-sm font-bold text-slate-900"
              title={row.recipient}
            >
              {row.recipient}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              Recipient
            </p>
          </div>
        </div>
      </td>

      <td className="max-w-72 px-5 py-4">
        <p
          className="truncate text-sm font-medium text-slate-700"
          title={row.subject}
        >
          {row.subject}
        </p>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
            <UserRound className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="whitespace-nowrap text-sm font-medium text-slate-700">
              {row.sender.name}
            </p>

            <p
              className="max-w-48 truncate text-xs text-slate-400"
              title={row.sender.email}
            >
              {row.sender.email}
            </p>
          </div>
        </div>
      </td>

      <td className="whitespace-nowrap px-5 py-4">
        <p className="text-sm font-medium text-slate-700">
          {formatDate(timestamp)}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {formatTime(timestamp)}
        </p>
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={row.status} />

        {row.lastError && (
          <div
            className="mt-2 flex max-w-60 items-start gap-1.5 text-xs text-rose-600"
            title={row.lastError}
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

            <span className="line-clamp-2">
              {row.lastError}
            </span>
          </div>
        )}
      </td>

      <td className="px-5 py-4 text-right">
        {row.previewUrl ? (
          <a
            href={row.previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 transition hover:border-teal-200 hover:bg-teal-100"
          >
            Preview
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-xs text-slate-300">
            Not available
          </span>
        )}
      </td>
    </tr>
  );
}

function MobileEmailCard({
  row,
  mode,
}: {
  row: EmailRow;
  mode: EmailTableMode;
}) {
  const timestamp = getTimestamp(row, mode);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="truncate text-sm font-bold text-slate-950"
            title={row.recipient}
          >
            {row.recipient}
          </p>

          <p
            className="mt-1 line-clamp-2 text-sm text-slate-600"
            title={row.subject}
          >
            {row.subject}
          </p>
        </div>

        <StatusBadge status={row.status} />
      </div>

      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
        <MobileDetail
          icon={<UserRound className="h-4 w-4" />}
          label="Sender"
          value={row.sender.name}
          secondary={row.sender.email}
        />

        <MobileDetail
          icon={<CalendarClock className="h-4 w-4" />}
          label={
            mode === "scheduled"
              ? "Scheduled time"
              : "Sent time"
          }
          value={formatDate(timestamp)}
          secondary={formatTime(timestamp)}
        />
      </div>

      {row.lastError && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{row.lastError}</span>
        </div>
      )}

      {row.previewUrl && (
        <a
          href={row.previewUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-4 py-2.5 text-sm font-bold text-teal-700 transition hover:bg-teal-100"
        >
          Open Ethereal Preview
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </article>
  );
}

function MobileDetail({
  icon,
  label,
  value,
  secondary,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">
          {value}
        </p>

        {secondary && (
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {secondary}
          </p>
        )}
      </div>
    </div>
  );
}

function TableHeading({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function EmailTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex animate-pulse flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="shimmer h-11 w-full rounded-lg bg-slate-100 sm:max-w-sm" />
        <div className="shimmer h-11 w-36 rounded-lg bg-slate-100" />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="h-12 animate-pulse bg-slate-50" />

        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="flex animate-pulse gap-5 border-t border-slate-100 px-5 py-5"
          >
            <div className="shimmer h-10 w-10 rounded-lg bg-slate-100" />
            <div className="shimmer h-10 flex-1 rounded-lg bg-slate-100" />
            <div className="shimmer hidden h-10 flex-1 rounded-lg bg-slate-100 sm:block" />
            <div className="shimmer hidden h-10 w-32 rounded-lg bg-slate-100 lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyEmailState({
  mode,
}: {
  mode: EmailTableMode;
}) {
  const scheduledMode = mode === "scheduled";

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm">
        {scheduledMode ? (
          <Inbox className="h-7 w-7" />
        ) : (
          <Send className="h-7 w-7" />
        )}
      </div>

      <h3 className="mt-4 font-bold text-slate-900">
        No {scheduledMode ? "scheduled" : "completed"} emails
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {scheduledMode
          ? "Compose a campaign to create persistent delayed BullMQ jobs."
          : "Sent and failed email results will appear here after worker processing."}
      </p>
    </div>
  );
}

function getTimestamp(
  row: EmailRow,
  mode: EmailTableMode,
): string {
  if (mode === "scheduled") {
    return row.scheduledAt;
  }

  return (
    row.sentAt ??
    row.failedAt ??
    row.scheduledAt
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function capitalize(value: string): string {
  if (!value) return value;

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1).toLowerCase()
  );
}
