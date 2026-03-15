"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getGradeLabel } from "@/lib/utils/grade-label";
import ExamThumbnail from "@/components/ExamThumbnail";
import type {
  TranscriptionItem,
  AIFeedback,
  PerQuestionGrade,
} from "@/lib/types/correction";

interface CriterionGrade {
  id?: string;
  criterion_code: string;
  criterion_text?: string;
  grade: number;
  evidence: string;
  weight: number;
}

interface CorrectionData {
  id: string;
  grade: number;
  grade_label: string;
  grading_mode: string;
  ai_confidence: string;
  ai_flags: string[] | null;
  is_reviewed: boolean;
  teacher_modified: boolean;
  original_image_url: string | null;
  transcription: TranscriptionItem[];
  per_question_grades: PerQuestionGrade[] | null;
  ai_feedback: AIFeedback;
  created_at: string;
  criterion_grades: CriterionGrade[];
}

function gradeBarColor(grade: number): string {
  if (grade >= 7) return "bg-primary";
  if (grade >= 5) return "bg-tertiary";
  return "bg-error";
}

function gradeTextColor(grade: number): string {
  if (grade >= 5) return "text-primary";
  return "text-error";
}

export function EditCorrection({ correction }: { correction: CorrectionData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable state
  const [grade, setGrade] = useState(correction.grade);
  const [perQuestionGrades, setPerQuestionGrades] = useState<PerQuestionGrade[]>(
    correction.per_question_grades || []
  );
  const [feedback, setFeedback] = useState<AIFeedback>(correction.ai_feedback);
  const [criterionGrades, setCriterionGrades] = useState<CriterionGrade[]>(
    correction.criterion_grades
  );

  const isCriterial = correction.grading_mode === "criterial" && criterionGrades.length > 0;

  // Media calculada de criterios
  const criteriaAverage = useMemo(() => {
    if (!isCriterial || criterionGrades.length === 0) return null;
    const totalWeight = criterionGrades.reduce((s, cg) => s + (cg.weight || 1), 0);
    const weightedSum = criterionGrades.reduce((s, cg) => s + cg.grade * (cg.weight || 1), 0);
    return Math.round((weightedSum / totalWeight) * 10) / 10;
  }, [isCriterial, criterionGrades]);

  // En modo criterial, la nota global = media de criterios
  const effectiveGrade = isCriterial && criteriaAverage !== null ? criteriaAverage : grade;
  const gradeLabel = getGradeLabel(effectiveGrade);

  const updateCriterionGrade = (index: number, newGrade: number) => {
    setCriterionGrades((prev) =>
      prev.map((cg, i) => (i === index ? { ...cg, grade: Math.min(10, Math.max(0, newGrade)) } : cg))
    );
  };

  const updateCriterionEvidence = (index: number, newEvidence: string) => {
    setCriterionGrades((prev) =>
      prev.map((cg, i) => (i === index ? { ...cg, evidence: newEvidence } : cg))
    );
  };

  const updateQuestionGrade = (index: number, newGrade: number) => {
    setPerQuestionGrades((prev) =>
      prev.map((q, i) => (i === index ? { ...q, grade: newGrade } : q))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    const finalGrade = isCriterial && criteriaAverage !== null ? criteriaAverage : grade;

    // Actualizar corrección principal
    await supabase
      .from("corrections")
      .update({
        grade: finalGrade,
        grade_label: getGradeLabel(finalGrade),
        per_question_grades: perQuestionGrades.length > 0 ? perQuestionGrades : null,
        ai_feedback: feedback,
        teacher_modified: true,
      })
      .eq("id", correction.id);

    // Actualizar criterion_grades si es criterial
    if (isCriterial) {
      for (const cg of criterionGrades) {
        if (cg.id) {
          await supabase
            .from("criterion_grades")
            .update({ grade: cg.grade, evidence: cg.evidence })
            .eq("id", cg.id);
        }
      }
    }

    setSaving(false);
    setEditing(false);
    router.refresh();
  };

  const handleCancel = () => {
    setGrade(correction.grade);
    setPerQuestionGrades(correction.per_question_grades || []);
    setFeedback(correction.ai_feedback);
    setCriterionGrades(correction.criterion_grades);
    setEditing(false);
  };

  // Parse image URLs
  let imageUrls: string[] = [];
  if (correction.original_image_url) {
    try {
      const parsed = JSON.parse(correction.original_image_url);
      imageUrls = Array.isArray(parsed) ? parsed : [correction.original_image_url];
    } catch {
      imageUrls = [correction.original_image_url];
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-headline font-extrabold text-on-surface">
              Detalle de corrección
            </h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-lg transition-colors min-h-[44px]"
                title="Editar corrección"
              >
                <span className="material-symbols-outlined text-xl">edit</span>
              </button>
            )}
          </div>
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
            {correction.grading_mode === "criterial" && (
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-secondary-container text-on-secondary-container">
                Criterial
              </span>
            )}
            {correction.teacher_modified && (
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
                Modificado por docente
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
          {editing && !isCriterial ? (
            <div className="space-y-1">
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={grade}
                inputMode="decimal"
                onChange={(e) => setGrade(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                className={`w-24 text-4xl font-headline font-extrabold text-center bg-surface-container-lowest border-2 border-primary rounded-xl ${gradeTextColor(grade)}`}
              />
              <div className="text-sm font-bold text-on-surface-variant">{gradeLabel}</div>
            </div>
          ) : (
            <>
              <div className={`text-5xl font-headline font-extrabold ${gradeTextColor(effectiveGrade)}`}>
                {effectiveGrade.toFixed(1)}
              </div>
              <div className="text-sm font-bold text-on-surface-variant">{gradeLabel}</div>
              {isCriterial && editing && (
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Media de {criterionGrades.length} criterios
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Save/Cancel bar */}
      {editing && (
        <div className="flex gap-3 p-4 bg-tertiary-fixed/20 rounded-xl animate-fade-in-up">
          <span className="material-symbols-outlined text-tertiary text-xl mt-0.5">edit_note</span>
          <p className="text-sm text-on-surface flex-1">
            Estás editando la corrección. Los cambios se marcarán como &ldquo;Modificado por docente&rdquo;.
          </p>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-bold text-on-surface bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-bold text-on-primary bg-primary rounded-lg hover:bg-primary/90 transition-colors min-h-[44px] disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}

      {/* Original images — usando ExamThumbnail */}
      {imageUrls.length > 0 && (
        <div className="space-y-3 animate-fade-in-up-delay-1">
          {imageUrls.map((url, i) => (
            <ExamThumbnail
              key={i}
              src={url}
              alt={`Examen original${imageUrls.length > 1 ? ` — página ${i + 1}` : ""}`}
              pageNumber={imageUrls.length > 1 ? i + 1 : undefined}
              maxHeight="500px"
            />
          ))}
        </div>
      )}

      {/* Transcription + per-question grades */}
      {correction.transcription && (
        <div className="space-y-4 animate-fade-in-up-delay-2">
          <h3 className="text-xl font-headline font-bold">Transcripción y evaluación</h3>
          {correction.transcription.map((item, i) => {
            const qGrade = perQuestionGrades.find(
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
                    editing ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={qGrade.max_grade}
                          step={0.5}
                          value={qGrade.grade}
                          inputMode="decimal"
                          onChange={(e) => {
                            const idx = perQuestionGrades.findIndex(
                              (q) => q.question_number === item.question_number
                            );
                            if (idx >= 0) updateQuestionGrade(idx, parseFloat(e.target.value) || 0);
                          }}
                          className="w-14 text-lg font-extrabold text-center bg-surface-container-lowest border border-primary rounded-lg text-primary"
                        />
                        <span className="text-sm text-on-surface-variant">/{qGrade.max_grade}</span>
                      </div>
                    ) : (
                      <span className="text-xl font-extrabold text-primary shrink-0">
                        {qGrade.grade}/{qGrade.max_grade}
                      </span>
                    )
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
                  <p className="text-xs text-on-surface-variant">{qGrade.reasoning}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Criterion grades — con barras de progreso y edición */}
      {isCriterial && (
        <div className="space-y-4 animate-fade-in-up-delay-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-headline font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">checklist</span>
              Desglose por criterios
            </h3>
            {criteriaAverage !== null && (
              <div className="text-right">
                <span className={`text-2xl font-headline font-extrabold ${gradeTextColor(criteriaAverage)}`}>
                  {criteriaAverage.toFixed(1)}
                </span>
                <p className="text-[10px] text-on-surface-variant">
                  Media de {criterionGrades.length} criterios
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            {criterionGrades.map((cg, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest p-5 rounded-xl border-l-4 border-secondary"
              >
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-secondary uppercase tracking-widest">
                      {cg.criterion_code}
                    </span>
                    {cg.criterion_text && cg.criterion_text !== cg.criterion_code && (
                      <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">
                        {cg.criterion_text}
                      </p>
                    )}
                  </div>
                  {editing ? (
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={cg.grade}
                      inputMode="decimal"
                      onChange={(e) => updateCriterionGrade(i, parseFloat(e.target.value) || 0)}
                      className={`w-16 text-lg font-extrabold text-center bg-surface-container-lowest border-2 border-secondary rounded-lg shrink-0 ${gradeTextColor(cg.grade)}`}
                    />
                  ) : (
                    <span className={`text-xl font-extrabold shrink-0 ${gradeTextColor(cg.grade)}`}>
                      {cg.grade.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Barra de progreso */}
                <div className="h-2 bg-surface-container rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${gradeBarColor(cg.grade)}`}
                    style={{ width: `${(cg.grade / 10) * 100}%` }}
                  />
                </div>

                {/* Evidencia */}
                {editing ? (
                  <textarea
                    value={cg.evidence}
                    onChange={(e) => updateCriterionEvidence(i, e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:border-secondary transition-colors"
                    placeholder="Evidencia del criterio..."
                  />
                ) : (
                  <p className="text-sm text-on-surface-variant">{cg.evidence}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="bg-surface-container-low p-8 rounded-xl space-y-6 animate-fade-in-up-delay-3">
          <h3 className="text-xl font-headline font-bold">Feedback formativo</h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">thumb_up</span>
                Fortalezas
              </h4>
              {editing ? (
                <textarea
                  value={feedback.strengths.join("\n")}
                  onChange={(e) =>
                    setFeedback({ ...feedback, strengths: e.target.value.split("\n").filter(Boolean) })
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              ) : (
                <ul className="space-y-1">
                  {feedback.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-on-surface-variant flex gap-2">
                      <span className="text-primary shrink-0">·</span> {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold text-secondary mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">trending_up</span>
                Áreas de mejora
              </h4>
              {editing ? (
                <textarea
                  value={feedback.improvements.join("\n")}
                  onChange={(e) =>
                    setFeedback({ ...feedback, improvements: e.target.value.split("\n").filter(Boolean) })
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              ) : (
                <ul className="space-y-1">
                  {feedback.improvements.map((s, i) => (
                    <li key={i} className="text-sm text-on-surface-variant flex gap-2">
                      <span className="text-secondary shrink-0">·</span> {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-primary-fixed/30 p-4 rounded-lg">
              {editing ? (
                <textarea
                  value={feedback.advice}
                  onChange={(e) => setFeedback({ ...feedback, advice: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              ) : (
                <p className="text-sm text-on-surface">{feedback.advice}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
