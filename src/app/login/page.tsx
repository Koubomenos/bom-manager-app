"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Σφάλμα σύνδεσης");
      }
    } catch (err) {
      setError("Παρουσιάστηκε σφάλμα κατα την σύνδεση.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Decorative blurred orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl" />
      </div>

      <div className="glass-card-solid rounded-2xl p-10 w-full max-w-md relative animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 gradient-accent rounded-xl flex items-center justify-center mb-5 text-white shadow-lg shadow-primary-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
            <Lock size={26} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-800">Σύνδεση στο Σύστημα</h1>
          <p className="text-sm text-surface-400 mt-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary-400" />
            BOM Manager Application
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-danger-50 text-danger-600 p-3.5 rounded-xl text-sm font-medium border border-danger-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1.5">Όνομα Χρήστη</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 border border-surface-200 rounded-xl bg-white/80 text-surface-800 text-sm placeholder:text-surface-300 transition-all"
              placeholder="Εισάγετε το όνομα χρήστη"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1.5">Κωδικός Ασφαλείας</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-surface-200 rounded-xl bg-white/80 text-surface-800 text-sm placeholder:text-surface-300 transition-all"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full gradient-accent text-white font-semibold py-3 rounded-xl transition-all flex justify-center items-center mt-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.01] active:scale-[0.99]"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            Είσοδος
          </button>
        </form>
      </div>
    </div>
  );
}
