"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import PasswordInput from "@/components/ui/PasswordInput";

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        json: { email },
      });
      setStep("reset");
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setError(apiErr.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        json: { email, otp, password, password_confirmation: passwordConfirmation },
      });
      router.push("/login?reset=1");
    } catch (err: unknown) {
      const apiErr = err as {
        data?: { message?: string; errors?: Record<string, string[]> };
      };
      const fieldErrors = Object.values(apiErr.data?.errors ?? {}).flat().join(" ");
      setError(fieldErrors || apiErr.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">

        {step === "email" ? (
          <>
            <div className="text-center mb-8">
              <span className="material-symbols-rounded text-6xl text-indigo-400">lock_reset</span>
              <h2 className="mt-4 text-3xl font-extrabold text-white">Forgot password?</h2>
              <p className="mt-2 text-sm text-white/50">
                Enter your email and we&apos;ll send you a reset code.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200"
                />
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
              >
                {loading ? "Sending code..." : "Send reset code"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/50">
              Remember your password?{" "}
              <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <span className="material-symbols-rounded text-6xl text-indigo-400">mark_email_read</span>
              <h2 className="mt-4 text-3xl font-extrabold text-white">Check your email</h2>
              <p className="mt-2 text-sm text-white/50">
                We sent a 6-digit code to{" "}
                <span className="text-white font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                  Reset code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 text-center text-2xl font-mono tracking-[0.5em]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                  New password
                </label>
                <PasswordInput required value={password} onChange={setPassword} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                  Confirm new password
                </label>
                <PasswordInput required value={passwordConfirmation} onChange={setPasswordConfirmation} />
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset password"}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-2 text-sm text-white/50">
              <button
                onClick={() => { setStep("email"); setError(""); setOtp(""); setPassword(""); setPasswordConfirmation(""); }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                ← Use a different email
              </button>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="hover:text-white/70 transition-colors disabled:opacity-50"
              >
                Didn&apos;t receive a code? Resend
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
