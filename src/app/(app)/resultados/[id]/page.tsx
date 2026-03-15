import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TranscriptionItem, AIFeedback } from "@/lib/types/correction";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CorrectionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: correction } = await supabase
    .from("corrections")
    .select("*")
    .eq("id", id)
    .single();

  if (!correction) {
    notFound();
  }

  const transcription = correction.transcription as TranscriptionItem[];
  const feedback = correction.ai_feedback as AIFeedback;
  const gradeColor = correction.grade >= 5 ? "text-primary" : "text-error";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 mb-20">
      {/* Back */}
      <Link
        href="/resultados"
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Volver a resultados
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface">
            Detalle de corrección
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {new Date(correction.created_at).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full ${
                correction.ai_confidence === "alta"
                  ? "bg-primary-fixed text-on-primary-fixed"
                  : correction.ai_confidence === "media"
                  ? "bg-tertiary-fixed text-on-tertiary-fixed"
                  : "bg-error-container text-on-error-container"
              }`}
            >
              Confianza: {correction.ai_confidence}
            </span>
            {correction.is_reviewed && (
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary-fixed text-on-primary-fixed">
                Revisado
              </span>
            )}
            {correction.ai_flags?.map((flag: string) => (
              <span
                key={flag}
                className="text-xs font-medium px-2 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full"
              >
                {flag}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center shrink-0">
          <div className={`text-5xl font-headline font-extrabold ${gradeColor}`}>
            {correction.grade?.toFixed(1)}
          </div>
          <div className="text-sm font-bold text-on-surface-variant">
            {correction.grade_label}
          </div>
        </div>
      </div>

      {/* Original image */}
      {correction.original_image_url && (
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={correction.original_image_url}
            alt="Examen original"
            className="w-full max-h-[400px] object-contain"
          />
        </div>
      )}

      {/* Transcription */}
      {transcription && (
        <div className="space-y-4">
          <h3 className="text-xl font-headline font-bold">Transcripción</h3>
          {transcription.map((item, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-primary"
            >
              <div className="space-y-1 mb-3">
                <span className="text-xs font-bold text-secondary uppercase tracking-widest">
                  Pregunta {item.question_number}
                </span>
                <p className="text-base font-headline font-semibold">
                  {item.question_text}
                </p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg text-on-surface-variant text-sm leading-relaxed italic">
                &ldquo;{item.student_answer}&rdquo;
                {item.legibility !== "clara" && (
                  <span className="ml-2 text-xs font-bold text-tertiary not-italic">
                    [{item.legibility === "parcial" ? "Parcialmente legible" : "Ilegible"}]
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="bg-surface-container-low p-8 rounded-xl space-y-6">
          <h3 className="text-xl font-headline font-bold">Feedback formativo</h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">thumb_up</span>
                Fortalezas
              </h4>
              <ul className="space-y-1">
                {feedback.strengths.map((s, i) => (
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
                {feedback.improvements.map((s, i) => (
                  <li key={i} className="text-sm text-on-surface-variant flex gap-2">
                    <span className="text-secondary shrink-0">·</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-primary-fixed/30 p-4 rounded-lg">
              <p className="text-sm text-on-surface">
                {feedback.advice}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
