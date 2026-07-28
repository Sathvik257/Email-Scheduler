import { useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { api } from "./lib/api";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import type { User } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("reachinbox_token");
    if (!token) {
      setBooting(false);
      return;
    }

    api
      .get<{ user: User }>("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem("reachinbox_token"))
      .finally(() => setBooting(false));
  }, []);

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-6 text-slate-700">
        <div className="animate-fade-up rounded-lg border border-slate-200 bg-white p-6 text-center shadow-2xl shadow-slate-900/10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-teal-700 text-white shadow-lg shadow-teal-900/20">
            <MailCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold text-slate-950">
            Opening ReachInbox Scheduler
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-teal-700" aria-hidden="true" />
            Loading your workspace...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage
          onLogin={(token, loggedInUser) => {
            localStorage.setItem("reachinbox_token", token);
            setUser(loggedInUser);
            setError("");
          }}
          onError={setError}
        />
        {error && (
          <div className="fixed bottom-5 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 animate-fade-up rounded-lg bg-rose-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-xl shadow-rose-900/20">
            {error}
          </div>
        )}
      </>
    );
  }

  return (
    <DashboardPage
      user={user}
      onLogout={() => {
        localStorage.removeItem("reachinbox_token");
        setUser(null);
      }}
    />
  );
}
