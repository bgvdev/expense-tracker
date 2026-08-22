"use client";

import { useState, useCallback } from "react";
import apiFetch from "@/lib/api";
import type { PaymentMethod } from "@/lib/types";

// Payment methods are read-only reference data (GET /api/payment-methods has no
// write counterpart), so they are cached for the lifetime of the tab. Every page
// that renders an expense form used to refetch them on mount, which meant one
// avoidable request per navigation. `inFlight` additionally collapses concurrent
// callers into a single request.
let cache: PaymentMethod[] | null = null;
let inFlight: Promise<PaymentMethod[]> | null = null;

function loadPaymentMethods(): Promise<PaymentMethod[]> {
  if (cache) return Promise.resolve(cache);

  inFlight ??= apiFetch<PaymentMethod[]>("/api/payment-methods")
    .then((data) => {
      cache = data;
      return data;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(cache ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Callers invoke this from effects without a .catch, so it must not reject.
  const fetchPaymentMethods = useCallback(async () => {
    if (cache) {
      setPaymentMethods(cache);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPaymentMethods(await loadPaymentMethods());
    } catch {
      setError("Failed to load payment methods.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { paymentMethods, loading, error, fetchPaymentMethods };
}
