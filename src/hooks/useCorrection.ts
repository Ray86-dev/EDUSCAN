"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CorrectionResult, CorrectionRow } from "@/lib/types/correction";

type CorrectionStep = "upload" | "processing" | "result" | "error";

interface CorrectionState {
  step: CorrectionStep;
  imageFile: File | null;
  imagePreview: string | null;
  result: CorrectionResult | null;
  correction: CorrectionRow | null;
  error: string | null;
  limitReached: boolean;
}

export function useCorrection() {
  const [state, setState] = useState<CorrectionState>({
    step: "upload",
    imageFile: null,
    imagePreview: null,
    result: null,
    correction: null,
    error: null,
    limitReached: false,
  });

  const setFile = (file: File) => {
    const preview = URL.createObjectURL(file);
    setState((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: preview,
      error: null,
    }));
  };

  const clearFile = () => {
    if (state.imagePreview) URL.revokeObjectURL(state.imagePreview);
    setState((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: null,
    }));
  };

  const submit = async () => {
    if (!state.imageFile) return;

    setState((prev) => ({ ...prev, step: "processing", error: null }));

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState((prev) => ({
          ...prev,
          step: "error",
          error: "No autenticado",
        }));
        return;
      }

      // Subir imagen a Supabase Storage
      const ext = state.imageFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("exam-images")
        .upload(path, state.imageFile, {
          contentType: state.imageFile.type,
        });

      if (uploadError) {
        setState((prev) => ({
          ...prev,
          step: "error",
          error: "Error subiendo imagen: " + uploadError.message,
        }));
        return;
      }

      // Llamar API de corrección
      const response = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePath: path }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setState((prev) => ({
            ...prev,
            step: "error",
            error: data.error,
            limitReached: true,
          }));
          return;
        }
        setState((prev) => ({
          ...prev,
          step: "error",
          error: data.error || "Error en la corrección",
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        step: "result",
        result: data.result,
        correction: data.correction,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        step: "error",
        error: err instanceof Error ? err.message : "Error inesperado",
      }));
    }
  };

  const reset = () => {
    if (state.imagePreview) URL.revokeObjectURL(state.imagePreview);
    setState({
      step: "upload",
      imageFile: null,
      imagePreview: null,
      result: null,
      correction: null,
      error: null,
      limitReached: false,
    });
  };

  return {
    ...state,
    setFile,
    clearFile,
    submit,
    reset,
  };
}
