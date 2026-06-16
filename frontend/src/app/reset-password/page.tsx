"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Primary reset flow is handled on /forgot-password (multi-step).
// This page exists only as a fallback for old links.
export default function ResetPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/forgot-password");
  }, [router]);

  return null;
}
