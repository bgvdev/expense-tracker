"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password_confirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const attempt = async (retriesLeft: number): Promise<void> => {
      try {
        await register({ name, email, password, password_confirmation });
        router.push("/dashboard");
      } catch (err: unknown) {
        const apiErr = err as { data?: { message?: string, errors?: Record<string, string[]> }; status?: number };
        const isConnectionError = !apiErr.status || apiErr.status >= 500;

        if (isConnectionError && retriesLeft > 0) {
          setError("Server is starting up — retrying in 20 seconds…");
          await new Promise<void>(resolve => setTimeout(resolve, 20000));
          setError("");
          return attempt(retriesLeft - 1);
        }

        if (isConnectionError) {
          setError("Unable to reach the server. Please try again.");
        } else {
          const msg = apiErr.data?.message || "Failed to register.";
          const detailedErrors = Object.values(apiErr.data?.errors || {}).flat().join(" ");
          setError(detailedErrors || msg);
        }
      }
    };

    await attempt(2);
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <div className="text-center">
          <span className="material-symbols-rounded text-6xl text-purple-400">person_add</span>
          <h2 className="mt-4 text-3xl font-extrabold text-white">Create an account</h2>
          <p className="mt-2 text-sm text-white/50">Start tracking your expenses</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Confirm Password</label>
              <input
                type="password"
                required
                value={password_confirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200"
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        
        <p className="text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-purple-400 hover:text-purple-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
