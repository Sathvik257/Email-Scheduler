import { useEffect, useState } from "react";
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading ReachInbox…
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
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
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
