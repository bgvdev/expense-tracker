"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/ui/PasswordInput";
import { useToast } from "@/hooks/useToast";

function ResetSuccessToast() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  useEffect(() => {
    if (searchParams.get("reset") === "1") {
      showToast("Password reset successfully. You can now sign in.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const attempt = async (retriesLeft: number): Promise<void> => {
      try {
        await login({ email, password });
        router.push("/dashboard");
      } catch (err: unknown) {
        const apiErr = err as { data?: { message?: string }; status?: number };
        const isConnectionError = !apiErr.status || apiErr.status >= 500;

        if (isConnectionError && retriesLeft > 0) {
          setError("Server is starting up — retrying in 25 seconds…");
          await new Promise<void>(resolve => setTimeout(resolve, 25000));
          setError("");
          return attempt(retriesLeft - 1);
        }

        setError(
          isConnectionError
            ? "Unable to reach the server. Please try again."
            : apiErr.data?.message || "Failed to log in."
        );
      }
    };

    await attempt(3);
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Suspense><ResetSuccessToast /></Suspense>
      <div className="max-w-md w-full space-y-8 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <div className="text-center">
          <span className="material-symbols-rounded text-6xl text-indigo-400">login</span>
          <h2 className="mt-4 text-3xl font-extrabold text-white">Welcome back</h2>
          <p className="mt-2 text-sm text-white/50">Sign in to your account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest">Password</label>
                <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput required value={password} onChange={setPassword} />
            </div>
          </div>

          {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        
        <p className="text-center text-sm text-white/50">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
