import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  Loader2,
  LockKeyhole,
  Mail,
  MailCheck,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
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
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,118,110,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(15,118,110,0.07)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0f766e] text-white shadow-xl shadow-teal-900/20">
              <Mail className="h-5 w-5" />
            </div>

            <div>
              <p className="text-lg font-black text-[#10201f]">
                ReachInbox
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Email Job Scheduler
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-teal-100 bg-white px-3 py-1.5 text-xs font-bold text-teal-700 shadow-sm sm:flex">
            <Zap className="h-3.5 w-3.5 text-orange-400" />
            BullMQ powered
          </div>
        </header>

        <section className="grid flex-1 items-center gap-5 py-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden overflow-hidden rounded-lg bg-[#082521] text-white shadow-2xl shadow-slate-900/20 md:block">
            <div className="relative min-h-[620px] p-7 lg:p-9">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(45,212,191,0.28),transparent_24rem),radial-gradient(circle_at_90%_0%,rgba(249,115,22,0.22),transparent_22rem)]" />
              <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] [background-size:42px_42px]" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-teal-50 backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5 text-orange-300" />
                  Cold outreach scheduler
                </div>

                <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.05] lg:text-5xl">
                  Schedule every email with calm precision.
                </h1>

                <p className="mt-5 max-w-xl text-sm leading-6 text-teal-50/78 sm:text-base">
                  Upload leads, choose a sender, set a delivery window, and
                  let the queue protect every campaign from duplicates and
                  throttling.
                </p>
              </div>

              <div className="relative mt-8 grid gap-3 lg:grid-cols-3">
                <FeaturePill
                  icon={<Clock3 className="h-4 w-4" />}
                  title="Delayed jobs"
                  text="Persistent scheduling"
                />
                <FeaturePill
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="Idempotent"
                  text="No duplicate sends"
                />
                <FeaturePill
                  icon={<Activity className="h-4 w-4" />}
                  title="Rate aware"
                  text="Hourly limits"
                />
              </div>

              <div className="relative mt-7 rounded-lg border border-white/15 bg-white/[0.08] p-5 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-400 text-[#10201f] shadow-lg shadow-orange-950/20">
                      <Send className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black">Launch sequence</p>
                      <p className="text-xs text-teal-100/62">
                        Ready for worker pickup
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-teal-300/15 px-3 py-1 text-xs font-bold text-teal-100">
                    Live
                  </span>
                </div>

                <div className="mt-5 rounded-lg bg-[#061b18] p-4">
                  <p className="text-xs font-bold text-teal-100/60">
                    Campaign prompt
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white">
                    Schedule 420 leads from `sample-leads.csv` with a
                    2-second delay and 200/hour cap.
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  <SignalRow
                    icon={<UsersRound className="h-4 w-4" />}
                    label="Leads parsed"
                    value="420"
                    accent="bg-teal-300"
                  />
                  <SignalRow
                    icon={<Database className="h-4 w-4" />}
                    label="Rows persisted"
                    value="Postgres"
                    accent="bg-orange-300"
                  />
                  <SignalRow
                    icon={<MailCheck className="h-4 w-4" />}
                    label="SMTP preview"
                    value="Ethereal"
                    accent="bg-sky-300"
                  />
                </div>
              </div>
            </div>
          </div>

          <aside className="animate-fade-up rounded-lg border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl shadow-slate-900/10 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-teal-700">
                  Welcome back
                </p>
                <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                  Sign in to continue
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0f766e] text-white shadow-lg shadow-teal-900/20">
                <LockKeyhole className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Use your Google account to open the dashboard, compose campaigns,
              and monitor scheduled or sent emails.
            </p>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-start gap-3">
                <span className="rounded-lg bg-teal-50 p-2 text-teal-700">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-black">
                    Google verified session
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The backend verifies the signed ID token before issuing
                    your app session.
                  </p>
                </div>
              </div>

              <div
                className={`flex min-h-14 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-900/10 ${
                  signingIn ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <GoogleLogin
                  width="300"
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
                <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying your Google account...
                </div>
              )}
            </div>

            <div className="mt-5 space-y-3">
              <TrustLine
                icon={<CheckCircle2 className="h-4 w-4" />}
                text="Persistent jobs survive restarts"
              />
              <TrustLine
                icon={<CheckCircle2 className="h-4 w-4" />}
                text="Redis counters protect hourly limits"
              />
              <TrustLine
                icon={<CheckCircle2 className="h-4 w-4" />}
                text="Ethereal previews keep testing safe"
              />
            </div>

            <div className="mt-6 flex items-center justify-between rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800 transition hover:border-teal-200 hover:bg-teal-100">
              <span>Open your scheduler</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function FeaturePill({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/[0.08] p-4 transition hover:-translate-y-1 hover:bg-white/[0.12]">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-300/10 text-teal-100">
        {icon}
      </div>
      <p className="mt-3 text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-xs font-semibold text-teal-100/55">
        {text}
      </p>
    </div>
  );
}

function SignalRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.08]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-100">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{label}</p>
          <p className="text-xs text-teal-100/55">Ready</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${accent}`} />
        <span className="text-xs font-black text-teal-50">{value}</span>
      </div>
    </div>
  );
}

function TrustLine({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
      <span className="text-teal-700">{icon}</span>
      {text}
    </div>
  );
}
