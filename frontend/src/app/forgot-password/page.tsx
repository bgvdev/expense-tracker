"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiFetch from "@/lib/api";
import PasswordInput from "@/components/ui/PasswordInput";
import AuthCard from "@/components/layout/AuthCard";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

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

  const linkClass = "font-medium text-foreground hover:underline underline-offset-4";

  if (step === "email") {
    return (
      <AuthCard
        title="Forgot password?"
        description="Enter your email and we'll send you a reset code."
        footer={
          <>
            Remember your password?{" "}
            <Link href="/login" className={linkClass}>Sign in</Link>
          </>
        }
      >
        <form onSubmit={handleSendOtp} className="space-y-4">
          <Field label="Email" htmlFor="forgot-email">
            <Input
              id="forgot-email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          {error && <Alert>{error}</Alert>}

          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            {loading ? "Sending code…" : "Send reset code"}
          </Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Check your email"
      description={<>We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span></>}
      footer={
        <span className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => { setStep("email"); setError(""); setOtp(""); setPassword(""); setPasswordConfirmation(""); }}
            className={linkClass}
          >
            Use a different email
          </button>
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={loading}
            className="transition-colors hover:text-foreground disabled:opacity-50"
          >
            Didn&apos;t receive a code? Resend
          </button>
        </span>
      }
    >
      <form onSubmit={handleReset} className="space-y-4">
        <Field label="Reset code" htmlFor="reset-otp">
          <Input
            id="reset-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            autoFocus
            placeholder="••••••"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            size="lg"
            className="text-center font-mono text-xl tracking-[0.5em]"
          />
        </Field>

        <Field label="New password" htmlFor="reset-password">
          <PasswordInput id="reset-password" required autoComplete="new-password" value={password} onChange={setPassword} />
        </Field>

        <Field label="Confirm new password" htmlFor="reset-password-confirm">
          <PasswordInput id="reset-password-confirm" required autoComplete="new-password" value={passwordConfirmation} onChange={setPasswordConfirmation} />
        </Field>

        {error && <Alert>{error}</Alert>}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          {loading ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </AuthCard>
  );
}
