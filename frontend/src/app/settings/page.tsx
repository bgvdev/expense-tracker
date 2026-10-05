"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import PasswordInput from "@/components/ui/PasswordInput";
import RequireAuth from "@/components/layout/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import Page from "@/components/layout/Page";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Avatar from "@/components/ui/Avatar";
import { PaletteSwitcher, ThemeSwitcher } from "@/components/ui/ThemeToggle";

export default function SettingsPage() {
  return (
    <RequireAuth>
      <AppShell>
        <Settings />
      </AppShell>
    </RequireAuth>
  );
}

function Settings() {
  const { user, updateProfile, updatePassword } = useAuth();
  const { showToast } = useToast();

  // Profile form
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword]   = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [passwordSaving, setPasswordSaving]     = useState(false);
  const [passwordError, setPasswordError]       = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateProfile({ name, email });
      showToast("Profile updated successfully!");
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      const msg =
        Object.values(apiErr.data?.errors ?? {}).flat().join(" ") ||
        apiErr.data?.message ||
        "Failed to update profile.";
      showToast(msg, "error");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await updatePassword({ current_password: currentPassword, new_password: newPassword, new_password_confirmation: confirmPassword });
      showToast("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      const msg =
        Object.values(apiErr.data?.errors ?? {}).flat().join(" ") ||
        apiErr.data?.message ||
        "Failed to update password.";
      showToast(msg, "error");
    } finally {
      setPasswordSaving(false);
    }
  }

  // RequireAuth guarantees user is set before this renders
  if (!user) return null;

  return (
    <Page>
      <PageHeader title="Settings" description="Manage your profile, appearance and security" />

      <div className="divide-y divide-border">
        <Section title="Profile" description="Your name and the email address you sign in with.">
          <Card>
            <form onSubmit={handleProfileSubmit}>
              <CardBody className="space-y-5 pt-5">
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" htmlFor="settings-name">
                    <Input
                      id="settings-name"
                      type="text" required maxLength={255} autoComplete="name"
                      value={name} onChange={(e) => setName(e.target.value)}
                    />
                  </Field>
                  <Field label="Email" htmlFor="settings-email">
                    <Input
                      id="settings-email"
                      type="email" required maxLength={255} autoComplete="email"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                </div>
              </CardBody>
              <CardFooter>
                <Button type="submit" variant="primary" loading={profileSaving}>
                  {profileSaving ? "Saving…" : "Save profile"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </Section>

        <Section title="Appearance" description="Choose a theme and color palette, or follow your system setting.">
          <Card>
            <CardBody className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Theme</p>
                <p className="mt-0.5 text-xs text-muted">Applies on this device.</p>
              </div>
              <ThemeSwitcher />
            </CardBody>
            <CardBody className="flex flex-col gap-3 border-t border-border pt-5">
              <div>
                <p className="text-sm font-medium text-foreground">Color palette</p>
                <p className="mt-0.5 text-xs text-muted">Works in both light and dark mode.</p>
              </div>
              <PaletteSwitcher />
            </CardBody>
          </Card>
        </Section>

        <Section title="Security" description="Changing your password signs you out on every other device.">
          <Card>
            <form onSubmit={handlePasswordSubmit}>
              <CardBody className="space-y-4 pt-5">
                <div className="sm:w-1/2 sm:pr-2">
                  <Field label="Current password" htmlFor="settings-current-password">
                    <PasswordInput
                      id="settings-current-password"
                      required
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      placeholder="Enter current password"
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="New password" htmlFor="settings-new-password">
                    <PasswordInput
                      id="settings-new-password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder="At least 8 characters"
                    />
                  </Field>
                  <Field label="Confirm new password" htmlFor="settings-confirm-password">
                    <PasswordInput
                      id="settings-confirm-password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="Repeat new password"
                    />
                  </Field>
                </div>

                {passwordError && <Alert>{passwordError}</Alert>}
              </CardBody>
              <CardFooter>
                <Button type="submit" variant="primary" loading={passwordSaving}>
                  {passwordSaving ? "Updating…" : "Update password"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </Section>
      </div>
    </Page>
  );
}

/**
 * One settings group: its title and explanation in a left column, the controls
 * in a card on the right. On narrow screens the two stack.
 */
function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 py-8 first:pt-0 last:pb-0 lg:grid-cols-3 lg:gap-8">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="lg:col-span-2">{children}</div>
    </section>
  );
}
