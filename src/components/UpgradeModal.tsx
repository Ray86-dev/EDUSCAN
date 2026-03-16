"use client";

import { useState } from "react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-2xl max-w-md w-full p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <span className="material-symbols-outlined text-primary text-5xl">
            workspace_premium
          </span>
          <h2 className="text-2xl font-headline font-bold text-on-surface">
            Limite diario alcanzado
          </h2>
          <p className="text-on-surface-variant text-sm">
            Has usado tus 2 correcciones gratuitas de hoy. Con el plan Premium
            puedes corregir sin limites.
          </p>
        </div>

        <div className="bg-primary-container rounded-xl p-6 space-y-3">
          <h3 className="font-headline font-bold text-on-primary-container">
            Plan Premium
          </h3>
          <ul className="space-y-2 text-sm text-on-primary-container">
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              Correcciones ilimitadas
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              Exportacion CSV y PDF
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              Evaluacion criterial LOMLOE
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full min-h-[44px] bg-primary text-on-primary font-bold rounded-full py-3 px-6 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Redirigiendo..." : "Mejorar a Premium"}
          </button>
          <button
            onClick={onClose}
            className="w-full min-h-[44px] text-on-surface-variant font-medium py-3 px-6 hover:bg-surface-container-highest rounded-full transition-colors"
          >
            Quizas manana
          </button>
        </div>
      </div>
    </div>
  );
}
