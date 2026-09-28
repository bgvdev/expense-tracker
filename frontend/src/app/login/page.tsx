"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/ui/PasswordInput";
import AuthCard from "@/components/layout/AuthCard";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
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
    <AuthCard
      title="Welcome back"
      description="Sign in to your account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-foreground hover:underline underline-offset-4">
            Sign up
          </Link>
        </>
      }
    >
      <Suspense><ResetSuccessToast /></Suspense>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Email" htmlFor="login-email">
          <Input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="login-password"
          action={
            <Link href="/forgot-password" className="text-xs text-muted hover:text-foreground">
              Forgot password?
            </Link>
          }
        >
          <PasswordInput id="login-password" required autoComplete="current-password" value={password} onChange={setPassword} />
        </Field>

        {error && <Alert>{error}</Alert>}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}
