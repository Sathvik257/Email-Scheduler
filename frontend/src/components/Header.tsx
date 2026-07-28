import { Activity, LogOut, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { User } from "../types";
import { Button } from "./Button";

export function Header({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  const showAvatar =
    Boolean(user.avatarUrl) && !avatarFailed;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0f766e] text-white shadow-lg shadow-teal-900/20">
            <Mail className="h-5 w-5" />

            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-orange-400" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-black tracking-tight text-slate-950 sm:text-lg">
                ReachInbox
              </h1>

              <span className="hidden items-center gap-1 rounded-full border border-teal-100 bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-700 md:inline-flex">
                <ShieldCheck className="h-3 w-3" />
                Scheduler
              </span>
            </div>

            <p className="truncate text-xs text-slate-500">
              Persistent Email Operations
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 lg:flex">
            <Activity className="h-3.5 w-3.5" />
            System online
          </div>

          <div className="hidden min-w-0 text-right md:block">
            <p
              className="max-w-56 truncate text-sm font-bold text-slate-900"
              title={user.name}
            >
              {user.name}
            </p>

            <p
              className="mt-0.5 max-w-56 truncate text-xs text-slate-500"
              title={user.email}
            >
              {user.email}
            </p>
          </div>

          <div className="relative shrink-0">
            {showAvatar ? (
              <img
                src={user.avatarUrl ?? ""}
                alt={`${user.name} profile`}
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-md shadow-slate-900/10 ring-1 ring-slate-200 sm:h-11 sm:w-11"
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-orange-400 to-amber-500 text-sm font-bold text-white shadow-md shadow-orange-900/10 ring-1 ring-orange-200 sm:h-11 sm:w-11"
                aria-label={`${user.name} profile`}
              >
                {getInitials(user.name)}
              </div>
            )}

            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-teal-400" />
          </div>

          <Button
            variant="secondary"
            onClick={onLogout}
            aria-label="Logout from ReachInbox"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-2 md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-700">
              {user.name}
            </p>

            <p className="truncate text-[11px] text-slate-400">
              {user.email}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-teal-700">
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            Online
          </div>
        </div>
      </div>
    </header>
  );
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 1).toUpperCase();
  }

  return `${parts[0]![0] ?? ""}${
    parts[parts.length - 1]![0] ?? ""
  }`.toUpperCase();
}
