"use client";

import { useState, useCallback } from "react";
import apiFetch from "@/lib/api";
import type { PaymentMethod } from "@/lib/types";

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPaymentMethods = useCallback(async () => {
    if (paymentMethods.length > 0) return;
    setLoading(true);
    try {
      const data = await apiFetch<PaymentMethod[]>("/api/payment-methods");
      setPaymentMethods(data);
    } finally {
      setLoading(false);
    }
  }, [paymentMethods.length]);

  return { paymentMethods, loading, fetchPaymentMethods };
}
