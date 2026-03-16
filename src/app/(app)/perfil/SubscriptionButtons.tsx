"use client";

import { useState } from "react";

export default function SubscriptionButtons({ planTier }: { planTier: string }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  if (planTier === "premium") {
    return (
      <button
        onClick={handleManage}
        disabled={loading}
        className="w-full py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl hover:bg-surface-container-highest/80 transition-colors min-h-[44px] disabled:opacity-50"
      >
        {loading ? "Cargando..." : "Gestionar suscripcion"}
      </button>
    );
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors min-h-[44px] disabled:opacity-50"
    >
      {loading ? "Redirigiendo..." : "Mejorar a Premium"}
    </button>
  );
}
