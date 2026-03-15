"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CorrectionResult, CorrectionRow } from "@/lib/types/correction";

type CorrectionStep = "upload" | "processing" | "result" | "error";

interface CorrectionState {
  step: CorrectionStep;
  imageFiles: File[];
  imagePreviews: string[];
  studentId: string | null;
  activityId: string | null;
  result: CorrectionResult | null;
  correction: CorrectionRow | null;
  error: string | null;
  limitReached: boolean;
}

export function useCorrection() {
  const [state, setState] = useState<CorrectionState>({
    step: "upload",
    imageFiles: [],
    imagePreviews: [],
    studentId: null,
    activityId: null,
    result: null,
    correction: null,
    error: null,
    limitReached: false,
  });

  const addFiles = (files: File[]) => {
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setState((prev) => ({
      ...prev,
      imageFiles: [...prev.imageFiles, ...files],
      imagePreviews: [...prev.imagePreviews, ...newPreviews],
      error: null,
    }));
  };

  const removeFile = (index: number) => {
    setState((prev) => {
      URL.revokeObjectURL(prev.imagePreviews[index]);
      return {
        ...prev,
        imageFiles: prev.imageFiles.filter((_, i) => i !== index),
        imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
      };
    });
  };

  const clearFiles = () => {
    state.imagePreviews.forEach((p) => URL.revokeObjectURL(p));
    setState((prev) => ({
      ...prev,
      imageFiles: [],
      imagePreviews: [],
    }));
  };

  const setStudentId = (id: string | null) => {
    setState((prev) => ({ ...prev, studentId: id }));
  };

  const setActivityId = (id: string | null) => {
    setState((prev) => ({ ...prev, activityId: id }));
  };

  const submit = async () => {
    if (state.imageFiles.length === 0) return;

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

      // Subir todas las imágenes a Supabase Storage
      const imagePaths: string[] = [];
      const timestamp = Date.now();

      for (let i = 0; i < state.imageFiles.length; i++) {
        const file = state.imageFiles[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${timestamp}_${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("exam-images")
          .upload(path, file, { contentType: file.type });

        if (uploadError) {
          setState((prev) => ({
            ...prev,
            step: "error",
            error: `Error subiendo imagen ${i + 1}: ${uploadError.message}`,
          }));
          return;
        }

        imagePaths.push(path);
      }

      // Llamar API de corrección con todas las rutas
      const response = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePaths, studentId: state.studentId, activityId: state.activityId }),
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
    state.imagePreviews.forEach((p) => URL.revokeObjectURL(p));
    setState({
      step: "upload",
      imageFiles: [],
      imagePreviews: [],
      studentId: null,
      activityId: null,
      result: null,
      correction: null,
      error: null,
      limitReached: false,
    });
  };

  return {
    ...state,
    addFiles,
    removeFile,
    clearFiles,
    setStudentId,
    setActivityId,
    submit,
    reset,
  };
}
