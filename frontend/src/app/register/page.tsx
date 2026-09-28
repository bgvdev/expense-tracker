"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/ui/PasswordInput";
import AuthCard from "@/components/layout/AuthCard";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

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
          setError("Server is starting up — retrying in 25 seconds…");
          await new Promise<void>(resolve => setTimeout(resolve, 25000));
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

    await attempt(3);
    setLoading(false);
  };

  return (
    <AuthCard
      title="Create an account"
      description="Start tracking your expenses"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Full name" htmlFor="register-name">
          <Input id="register-name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="register-email">
          <Input
            id="register-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="register-password">
          <PasswordInput id="register-password" required autoComplete="new-password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
        </Field>
        <Field label="Confirm password" htmlFor="register-password-confirm">
          <PasswordInput id="register-password-confirm" required autoComplete="new-password" value={password_confirmation} onChange={setPasswordConfirmation} placeholder="Repeat password" />
        </Field>

        {error && <Alert>{error}</Alert>}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
