"use client";

import { useState, useCallback } from "react";
import apiFetch from "@/lib/api";
import type { PaymentMethod } from "@/lib/types";

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Callers invoke this from effects without a .catch, so it must not reject.
  const fetchPaymentMethods = useCallback(async () => {
    if (paymentMethods.length > 0) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<PaymentMethod[]>("/api/payment-methods");
      setPaymentMethods(data);
    } catch {
      setError("Failed to load payment methods.");
    } finally {
      setLoading(false);
    }
  }, [paymentMethods.length]);

  return { paymentMethods, loading, error, fetchPaymentMethods };
}
