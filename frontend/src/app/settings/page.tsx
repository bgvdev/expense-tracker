"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/ui/PasswordInput";

export default function SettingsPage() {
  const { user, loading: authLoading, updateProfile, updatePassword, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

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
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

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

  if (authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-white/50">
          <span className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      {/* ── Top Nav ── */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <span className="material-symbols-rounded text-xl">arrow_back</span>
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
        <button
          onClick={() => { logout(); router.push("/login"); }}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white/80 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-rounded text-lg">logout</span>
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>

      {/* ── Page Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Account Settings
        </h1>
        <p className="text-white/40 text-sm mt-1">Manage your profile and security</p>
      </div>

      <div className="space-y-6">
        {/* ── Profile Section ── */}
        <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-9 w-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <span className="material-symbols-rounded text-indigo-400 text-xl">person</span>
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Profile</h2>
              <p className="text-xs text-white/35">Update your name and email address</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <p className="text-xs text-white/50">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Full Name</label>
              <input
                type="text" required maxLength={255}
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25
                           focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email" required maxLength={255}
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25
                           focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
            </div>
            <button
              type="submit" disabled={profileSaving}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500
                         active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
            >
              {profileSaving ? (
                <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
              ) : (
                <><span className="material-symbols-rounded text-lg">save</span>Save Profile</>
              )}
            </button>
          </form>
        </section>

        {/* ── Security Section ── */}
        <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-9 w-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <span className="material-symbols-rounded text-purple-400 text-xl">lock</span>
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Security</h2>
              <p className="text-xs text-white/35">Change your password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Current Password</label>
              <PasswordInput
                required
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">New Password</label>
              <PasswordInput
                required
                minLength={8}
                value={newPassword}
                onChange={setNewPassword}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Confirm New Password</label>
              <PasswordInput
                required
                minLength={8}
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Repeat new password"
              />
            </div>

            {passwordError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {passwordError}
              </p>
            )}

            <button
              type="submit" disabled={passwordSaving}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500
                         active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
            >
              {passwordSaving ? (
                <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating…</>
              ) : (
                <><span className="material-symbols-rounded text-lg">lock_reset</span>Update Password</>
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
