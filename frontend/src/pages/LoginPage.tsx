import {
  Activity,
  CheckCircle2,
  Database,
  Gauge,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Zap,
} from "lucide-react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useState, type ReactNode } from "react";
import { api, getApiError } from "../lib/api";
import type { User } from "../types";

export function LoginPage({
  onLogin,
  onError,
}: {
  onLogin: (token: string, user: User) => void;
  onError: (message: string) => void;
}) {
  const [signingIn, setSigningIn] = useState(false);

  async function handleGoogleSuccess(
    response: CredentialResponse,
  ): Promise<void> {
    if (!response.credential) {
      onError("Google did not return a valid credential.");
      return;
    }

    setSigningIn(true);

    try {
      const { data } = await api.post<{
        token: string;
        user: User;
      }>("/auth/google", {
        credential: response.credential,
      });

      onLogin(data.token, data.user);
    } catch (error) {
      onError(getApiError(error));
      setSigningIn(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[0.92fr_1.08fr]">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-5 py-10 sm:px-8 lg:px-12">
        <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-violet-100/60 blur-3xl" />

        <div className="relative w-full max-w-lg">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-200">
              <Mail className="h-5 w-5" />

              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-950">
                ReachInbox
              </h1>

              <p className="text-xs font-medium text-slate-500">
                Full-Stack Email Scheduler
              </p>
            </div>
          </div>

          <div className="mt-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600">
              <Sparkles className="h-3.5 w-3.5" />
              Production-oriented scheduling
            </div>

            <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl sm:leading-[1.08]">
              Reliable email scheduling,
              <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                built for scale.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Sign in with Google to schedule persistent email jobs,
              monitor BullMQ processing, manage senders, and preview
              messages delivered through Ethereal SMTP.
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-2.5 text-indigo-600 shadow-sm">
                <LockKeyhole className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Secure Google authentication
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  The backend verifies Google&apos;s signed ID token
                  before creating your local JWT session.
                </p>
              </div>
            </div>

            <div
              className={`mt-5 flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 transition ${
                signingIn
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >
              <GoogleLogin
                width="320"
                shape="rectangular"
                size="large"
                text="signin_with"
                theme="outline"
                onSuccess={(response) => {
                  void handleGoogleSuccess(response);
                }}
                onError={() => {
                  setSigningIn(false);
                  onError("Google login failed. Please try again.");
                }}
              />
            </div>

            {signingIn && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying your Google account...
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <TrustItem
              icon={<ShieldCheck className="h-4 w-4" />}
              text="Verified login"
            />

            <TrustItem
              icon={<Database className="h-4 w-4" />}
              text="Persistent data"
            />

            <TrustItem
              icon={<Activity className="h-4 w-4" />}
              text="Live monitoring"
            />
          </div>

          <p className="mt-8 text-center text-xs text-slate-400 sm:text-left">
            Built with React, Express, PostgreSQL, Redis, BullMQ,
            Prisma, and TypeScript.
          </p>
        </div>
      </section>

      <section className="relative hidden min-h-screen overflow-hidden bg-[#0f1325] px-12 py-14 text-white lg:flex lg:items-center">
        <div className="absolute -right-28 -top-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-16 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute right-12 top-12 h-44 w-44 rounded-full border border-white/5" />
        <div className="absolute bottom-16 right-28 h-24 w-24 rounded-full border border-white/5" />

        <div className="relative mx-auto w-full max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-200 backdrop-blur">
            <Zap className="h-3.5 w-3.5" />
            Production-oriented architecture
          </div>

          <h2 className="mt-7 text-4xl font-bold leading-tight xl:text-5xl">
            PostgreSQL, Redis,
            <span className="block text-indigo-300">
              BullMQ and TypeScript
            </span>
          </h2>

          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            A reliable scheduling pipeline designed to preserve jobs,
            prevent duplicate sends, and control delivery throughput.
          </p>

          <div className="mt-10 space-y-4">
            <Feature
              icon={<TimerReset className="h-5 w-5" />}
              title="Persistent delayed jobs"
              text="Future campaigns survive API and worker restarts without starting over."
            />

            <Feature
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Idempotent processing"
              text="Unique request keys, queue job IDs, and database state suppress duplicates."
            />

            <Feature
              icon={<Gauge className="h-5 w-5" />}
              title="Distributed rate limiting"
              text="Redis-backed counters and BullMQ controls safely throttle concurrent workers."
            />

            <Feature
              icon={<Mail className="h-5 w-5" />}
              title="Safe SMTP previews"
              text="Every successful Ethereal delivery exposes a browser preview for testing."
            />
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <ArchitectureStat value="5" label="Worker concurrency" />
            <ArchitectureStat value="2s" label="Minimum delay" />
            <ArchitectureStat value="200" label="Emails per hour" />
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            No cron jobs — scheduling is handled through BullMQ.
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="group flex gap-4 rounded-2xl border border-white/5 bg-white/[0.04] p-4 transition hover:border-indigo-400/20 hover:bg-white/[0.07]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300">
        {icon}
      </div>

      <div>
        <h3 className="font-bold text-white">{title}</h3>

        <p className="mt-1 text-sm leading-6 text-slate-400">
          {text}
        </p>
      </div>
    </div>
  );
}

function TrustItem({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 shadow-sm sm:justify-start">
      <span className="text-indigo-500">{icon}</span>
      {text}
    </div>
  );
}

function ArchitectureStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
      <p className="text-2xl font-bold text-white">{value}</p>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {label}
      </p>
    </div>
  );
}