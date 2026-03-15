"use client";

import { useCallback } from "react";
import { useCorrection } from "@/hooks/useCorrection";
import type { TranscriptionItem } from "@/lib/types/correction";

export default function CorregirPage() {
  const correction = useCorrection();

  if (correction.step === "upload") {
    return <UploadStep correction={correction} />;
  }

  if (correction.step === "processing") {
    return <ProcessingStep imagePreview={correction.imagePreview} />;
  }

  if (correction.step === "error") {
    return <ErrorStep correction={correction} />;
  }

  return <ResultStep correction={correction} />;
}

// --- Step 1: Upload ---
function UploadStep({
  correction,
}: {
  correction: ReturnType<typeof useCorrection>;
}) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && isValidFile(file)) {
        correction.setFile(file);
      }
    },
    [correction]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidFile(file)) {
      correction.setFile(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h2 className="text-4xl font-headline font-extrabold text-primary tracking-tight">
          Corregir
        </h2>
        <p className="text-on-surface-variant mt-1">
          Sube una foto del examen manuscrito para obtener la corrección.
        </p>
      </div>

      {/* Drop zone */}
      {!correction.imageFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-outline-variant rounded-xl p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/50 transition-colors cursor-pointer min-h-[300px]"
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">
              add_a_photo
            </span>
          </div>
          <div className="text-center">
            <p className="font-headline font-bold text-lg text-on-surface">
              Arrastra la foto aquí
            </p>
            <p className="text-sm text-on-surface-variant mt-1">
              o pulsa para seleccionar · JPG, PNG o PDF · máx. 10 MB
            </p>
          </div>
          <input
            id="file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative bg-surface-container-lowest rounded-xl overflow-hidden">
            {correction.imagePreview &&
            correction.imageFile.type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={correction.imagePreview}
                alt="Vista previa del examen"
                className="w-full max-h-[500px] object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mr-3">
                  description
                </span>
                <span className="font-medium">{correction.imageFile.name}</span>
              </div>
            )}
            <button
              onClick={correction.clearFile}
              className="absolute top-3 right-3 w-10 h-10 bg-surface/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-error/10 transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant hover:text-error">
                close
              </span>
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={correction.submit}
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all min-h-[44px] text-lg"
          >
            Corregir examen
          </button>
        </div>
      )}
    </div>
  );
}

// --- Step 2: Processing ---
function ProcessingStep({ imagePreview }: { imagePreview: string | null }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <div className="text-center space-y-4 py-12">
        <div className="w-20 h-20 bg-primary-container rounded-2xl flex items-center justify-center mx-auto animate-pulse">
          <span className="material-symbols-outlined text-on-primary-container text-4xl">
            auto_awesome
          </span>
        </div>
        <h2 className="text-2xl font-headline font-bold text-on-surface">
          Analizando examen...
        </h2>
        <p className="text-on-surface-variant">
          Gemini está leyendo la imagen y evaluando las respuestas. Esto puede
          tardar unos segundos.
        </p>

        {/* Progress bar animada */}
        <div className="w-64 mx-auto h-1 bg-surface-container-highest rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full w-1/3 animate-bounce" />
        </div>
      </div>

      {imagePreview && (
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden opacity-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Examen siendo procesado"
            className="w-full max-h-[300px] object-contain"
          />
        </div>
      )}
    </div>
  );
}

// --- Step 3: Error ---
function ErrorStep({
  correction,
}: {
  correction: ReturnType<typeof useCorrection>;
}) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <div className="text-center space-y-4 py-12">
        <div className="w-20 h-20 bg-error-container rounded-2xl flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-on-error-container text-4xl">
            {correction.limitReached ? "block" : "error"}
          </span>
        </div>
        <h2 className="text-2xl font-headline font-bold text-on-surface">
          {correction.limitReached
            ? "Límite diario alcanzado"
            : "Error en la corrección"}
        </h2>
        <p className="text-on-surface-variant max-w-md mx-auto">
          {correction.limitReached
            ? "Has utilizado tus 2 correcciones gratuitas de hoy. El contador se reinicia a las 00:00 hora canaria. Actualiza a Premium para correcciones ilimitadas."
            : correction.error}
        </p>
        <button
          onClick={correction.reset}
          className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors min-h-[44px]"
        >
          {correction.limitReached ? "Entendido" : "Intentar de nuevo"}
        </button>
      </div>
    </div>
  );
}

// --- Step 4: Result ---
function ResultStep({
  correction,
}: {
  correction: ReturnType<typeof useCorrection>;
}) {
  const { result } = correction;
  if (!result) return null;

  const gradeColorClass = getGradeColor(result.grade);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 mb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface">
            Resultado de la corrección
          </h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full ${
                result.ai_confidence === "alta"
                  ? "bg-primary-fixed text-on-primary-fixed"
                  : result.ai_confidence === "media"
                  ? "bg-tertiary-fixed text-on-tertiary-fixed"
                  : "bg-error-container text-on-error-container"
              }`}
            >
              Confianza: {result.ai_confidence}
            </span>
            {result.ai_flags.map((flag) => (
              <span
                key={flag}
                className="text-xs font-medium px-2 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full"
              >
                {flag}
              </span>
            ))}
          </div>
        </div>

        {/* Grade */}
        <div className="text-center shrink-0">
          <div
            className={`text-5xl font-headline font-extrabold ${gradeColorClass}`}
          >
            {result.grade.toFixed(1)}
          </div>
          <div className="text-sm font-bold text-on-surface-variant">
            {result.grade_label}
          </div>
        </div>
      </div>

      {/* Transcription & Grades */}
      <div className="space-y-4">
        <h3 className="text-xl font-headline font-bold">Transcripción y evaluación</h3>
        {result.transcription.map((item: TranscriptionItem, i: number) => {
          const qGrade = result.per_question_grades?.find(
            (q) => q.question_number === item.question_number
          );
          return (
            <div
              key={i}
              className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-primary"
            >
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-secondary uppercase tracking-widest">
                    Pregunta {item.question_number}
                  </span>
                  <p className="text-base font-headline font-semibold">
                    {item.question_text}
                  </p>
                </div>
                {qGrade && (
                  <span className="text-xl font-extrabold text-primary shrink-0">
                    {qGrade.grade}/{qGrade.max_grade}
                  </span>
                )}
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg text-on-surface-variant text-sm leading-relaxed italic mb-3">
                &ldquo;{item.student_answer}&rdquo;
                {item.legibility !== "clara" && (
                  <span className="ml-2 text-xs font-bold text-tertiary not-italic">
                    [{item.legibility === "parcial" ? "Parcialmente legible" : "Ilegible"}]
                  </span>
                )}
              </div>
              {qGrade?.reasoning && (
                <p className="text-xs text-on-surface-variant">
                  {qGrade.reasoning}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      <div className="bg-surface-container-low p-8 rounded-xl space-y-6">
        <h3 className="text-xl font-headline font-bold">Feedback formativo</h3>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">thumb_up</span>
              Fortalezas
            </h4>
            <ul className="space-y-1">
              {result.ai_feedback.strengths.map((s, i) => (
                <li key={i} className="text-sm text-on-surface-variant flex gap-2">
                  <span className="text-primary shrink-0">·</span> {s}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-secondary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">trending_up</span>
              Áreas de mejora
            </h4>
            <ul className="space-y-1">
              {result.ai_feedback.improvements.map((s, i) => (
                <li key={i} className="text-sm text-on-surface-variant flex gap-2">
                  <span className="text-secondary shrink-0">·</span> {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-primary-fixed/30 p-4 rounded-lg">
            <p className="text-sm text-on-surface">
              {result.ai_feedback.advice}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={correction.reset}
          className="flex-1 py-3 bg-secondary-container text-on-secondary-container font-bold rounded-xl hover:shadow-md transition-all min-h-[44px]"
        >
          Nueva corrección
        </button>
        <button
          onClick={async () => {
            if (!correction.correction) return;
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            await supabase
              .from("corrections")
              .update({ is_reviewed: true })
              .eq("id", correction.correction.id);
          }}
          className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all min-h-[44px]"
        >
          Confirmar corrección
        </button>
      </div>
    </div>
  );
}

// --- Helpers ---
function isValidFile(file: File): boolean {
  const validTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  const maxSize = 10 * 1024 * 1024;
  return validTypes.includes(file.type) && file.size <= maxSize;
}

function getGradeColor(grade: number): string {
  if (grade < 5) return "text-error";
  if (grade < 6) return "text-tertiary";
  if (grade < 7) return "text-secondary";
  return "text-primary";
}
