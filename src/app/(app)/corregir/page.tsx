"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCorrection } from "@/hooks/useCorrection";
import { createClient } from "@/lib/supabase/client";
import type { TranscriptionItem } from "@/lib/types/correction";
import UpgradeModal from "@/components/UpgradeModal";

export default function CorregirPage() {
  const correction = useCorrection();

  if (correction.step === "upload") {
    return <UploadStep correction={correction} />;
  }

  if (correction.step === "processing") {
    return <ProcessingStep imagePreviews={correction.imagePreviews} />;
  }

  if (correction.step === "error") {
    return (
      <>
        <ErrorStep correction={correction} />
        <UpgradeModal
          open={correction.limitReached}
          onClose={correction.reset}
        />
      </>
    );
  }

  return <ResultStep correction={correction} />;
}

// --- Step 1: Upload ---
interface Activity {
  id: string;
  title: string;
  criteria_codes: string[] | null;
}

interface GroupWithStudents {
  id: string;
  name: string;
  students: { id: string; name: string; first_surname: string; second_surname: string | null; list_number: number | null }[];
  activities: Activity[];
}

function UploadStep({
  correction,
}: {
  correction: ReturnType<typeof useCorrection>;
}) {
  const [groups, setGroups] = useState<GroupWithStudents[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  useEffect(() => {
    const fetchGroups = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("groups")
        .select("id, name, students(id, name, first_surname, second_surname, list_number), activities(id, title, criteria_codes)")
        .order("name");
      if (data) setGroups(data as unknown as GroupWithStudents[]);
    };
    fetchGroups();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter(isValidFile);
      if (files.length > 0) {
        correction.addFiles(files);
      }
    },
    [correction]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(isValidFile);
    if (files.length > 0) {
      correction.addFiles(files);
    }
    e.target.value = "";
  };

  const hasFiles = correction.imageFiles.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-6 py-6 md:py-10 space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-primary tracking-tight">
          Corregir
        </h2>
        <p className="text-on-surface-variant mt-1">
          Sube fotos del examen manuscrito para obtener la corrección.
          {hasFiles ? "" : " Puedes subir varias páginas."}
        </p>
      </div>

      {/* Upload zone — cámara nativa como acción principal */}
      {!hasFiles ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="space-y-3"
        >
          {/* Botón principal: Cámara */}
          <button
            onClick={() => document.getElementById("camera-input")?.click()}
            className="w-full border-2 border-dashed border-primary/40 rounded-xl flex flex-col items-center justify-center gap-3 p-10 min-h-[220px] hover:border-primary/70 hover:bg-primary-fixed/10 transition-[border-color,background-color,transform] cursor-pointer active:scale-[0.99]"
          >
            <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">
                photo_camera
              </span>
            </div>
            <div className="text-center">
              <p className="font-headline font-bold text-on-surface text-lg">
                Hacer foto
              </p>
              <p className="text-sm text-on-surface-variant mt-1">
                Abrir cámara para fotografiar el examen
              </p>
            </div>
          </button>
          <input
            id="camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Botón secundario: Galería / PDF */}
          <button
            onClick={() => document.getElementById("file-input")?.click()}
            className="w-full border border-outline-variant rounded-xl flex items-center justify-center gap-3 p-4 min-h-[56px] hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-xl">
              photo_library
            </span>
            <span className="font-medium text-on-surface text-sm">
              Subir desde galería o seleccionar PDF
            </span>
          </button>
          <input
            id="file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex gap-2"
        >
          <button
            onClick={() => document.getElementById("camera-input-add")?.click()}
            className="flex-1 border border-dashed border-outline-variant rounded-xl flex items-center justify-center gap-2 p-3 min-h-[48px] hover:border-primary/50 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-primary text-lg">photo_camera</span>
            <span className="text-sm font-medium text-on-surface">Otra foto</span>
          </button>
          <input
            id="camera-input-add"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => document.getElementById("file-input-add")?.click()}
            className="flex-1 border border-dashed border-outline-variant rounded-xl flex items-center justify-center gap-2 p-3 min-h-[48px] hover:border-primary/50 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-lg">add_photo_alternate</span>
            <span className="text-sm font-medium text-on-surface">Galería</span>
          </button>
          <input
            id="file-input-add"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Previews grid */}
      {hasFiles && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-on-surface-variant">
              {correction.imageFiles.length} {correction.imageFiles.length === 1 ? "página" : "páginas"}
            </p>
            <button
              onClick={correction.clearFiles}
              className="text-sm text-error font-medium hover:underline"
            >
              Eliminar todas
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {correction.imageFiles.map((file, i) => (
              <div key={i} className="relative bg-surface-container-lowest rounded-xl overflow-hidden aspect-[3/4]">
                {file.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={correction.imagePreviews[i]}
                    alt={`Página ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-on-surface-variant p-3">
                    <span className="material-symbols-outlined text-3xl mb-1">description</span>
                    <span className="text-xs font-medium text-center truncate w-full">{file.name}</span>
                  </div>
                )}
                <div className="absolute top-1.5 left-1.5 w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); correction.removeFile(i); }}
                  className="absolute top-1.5 right-1.5 w-7 h-7 bg-surface/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-error/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-on-surface-variant hover:text-error text-base">
                    close
                  </span>
                </button>
              </div>
            ))}
          </div>

          {/* Student selector (optional) */}
          {groups.length > 0 && (
            <div className="bg-surface-container-low p-4 rounded-xl space-y-3">
              <p className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-base">person</span>
                Vincular a un alumno (opcional)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={selectedGroup}
                  onChange={(e) => {
                    setSelectedGroup(e.target.value);
                    correction.setStudentId(null);
                  }}
                  className="px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Seleccionar grupo...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <select
                  value={correction.studentId || ""}
                  onChange={(e) => correction.setStudentId(e.target.value || null)}
                  disabled={!selectedGroup}
                  className="px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                >
                  <option value="">Seleccionar alumno...</option>
                  {groups
                    .find((g) => g.id === selectedGroup)
                    ?.students
                    .sort((a, b) => (a.list_number || 999) - (b.list_number || 999))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.list_number ? `${s.list_number}. ` : ""}{s.first_surname}{s.second_surname ? ` ${s.second_surname}` : ""}, {s.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Activity selector — only when a group is selected and has activities */}
              {selectedGroup && (() => {
                const groupActivities = groups.find((g) => g.id === selectedGroup)?.activities || [];
                if (groupActivities.length === 0) return null;
                return (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-on-surface-variant flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-base">assignment</span>
                      Vincular a actividad (modo criterial)
                    </p>
                    <select
                      value={correction.activityId || ""}
                      onChange={(e) => correction.setActivityId(e.target.value || null)}
                      className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="">Sin actividad (corrección simple)</option>
                      {groupActivities.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title} {a.criteria_codes?.length ? `(${a.criteria_codes.length} criterios)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={correction.submit}
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-transform min-h-[44px] text-lg"
          >
            Corregir examen
          </button>
        </div>
      )}
    </div>
  );
}

// --- Step 2: Processing ---
const PROCESSING_STEPS = [
  { icon: "visibility", label: "Leyendo imagen...", delay: 0 },
  { icon: "edit_document", label: "Transcribiendo respuestas...", delay: 3000 },
  { icon: "analytics", label: "Evaluando criterios...", delay: 7000 },
  { icon: "rate_review", label: "Generando feedback...", delay: 11000 },
];

function ProcessingStep({ imagePreviews }: { imagePreviews: string[] }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timers = PROCESSING_STEPS.slice(1).map((step, i) =>
      setTimeout(() => setCurrentStep(i + 1), step.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-6 md:py-10 space-y-8 animate-fade-in-up">
      {/* Icono principal */}
      <div className="text-center space-y-5 py-8">
        <div className="w-20 h-20 bg-primary-container rounded-2xl flex items-center justify-center mx-auto animate-soft-pulse">
          <span className="material-symbols-outlined text-on-primary-container text-4xl">
            {PROCESSING_STEPS[currentStep].icon}
          </span>
        </div>
        <h2 className="text-2xl font-headline font-bold text-on-surface">
          Analizando examen...
        </h2>

        {/* Pasos de procesamiento */}
        <div className="flex flex-col items-start gap-2 max-w-xs mx-auto">
          {PROCESSING_STEPS.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 transition-opacity duration-500 ${
                i <= currentStep ? "opacity-100" : "opacity-30"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${
                i < currentStep
                  ? "bg-primary"
                  : i === currentStep
                  ? "bg-primary-container border-2 border-primary"
                  : "bg-surface-container"
              }`}>
                {i < currentStep ? (
                  <span className="material-symbols-outlined text-on-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                ) : i === currentStep ? (
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                ) : (
                  <div className="w-2 h-2 bg-outline-variant rounded-full" />
                )}
              </div>
              <span className={`text-sm ${
                i === currentStep ? "font-bold text-on-surface" : i < currentStep ? "text-primary" : "text-on-surface-variant"
              }`}>
                {i < currentStep ? step.label.replace("...", " ✓") : step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar con shimmer */}
        <div className="w-64 mx-auto h-1.5 bg-surface-container-highest rounded-full overflow-hidden relative">
          <div className="animate-progress-indeterminate h-full bg-primary rounded-full" />
        </div>
      </div>

      {/* Thumbnails con overlay shimmer */}
      {imagePreviews.length > 0 && (
        <div className={`grid ${imagePreviews.length === 1 ? "grid-cols-1 max-w-xs mx-auto" : "grid-cols-2 sm:grid-cols-3"} gap-3`}>
          {imagePreviews.map((preview, i) => (
            <div key={i} className="relative bg-surface-container-lowest rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={`Página ${i + 1}`}
                className="w-full max-h-[200px] object-contain opacity-60"
              />
              <div className="absolute inset-0 animate-shimmer rounded-xl" />
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-surface/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-on-surface">
                Pág. {i + 1}
              </div>
            </div>
          ))}
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
    <div className="max-w-2xl mx-auto px-6 py-6 md:py-10 space-y-8">
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
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  if (!result) return null;

  const gradeColorClass = getGradeColor(result.grade);

  const handleConfirm = async () => {
    if (!correction.correction) return;
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase
      .from("corrections")
      .update({ is_reviewed: true })
      .eq("id", correction.correction.id);
    setConfirmed(true);
    setTimeout(() => router.push(`/resultados/${correction.correction!.id}`), 500);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 md:py-10 space-y-8">
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
          className="flex-1 py-3 bg-secondary-container text-on-secondary-container font-bold rounded-xl hover:shadow-md transition-shadow min-h-[44px]"
        >
          Nueva corrección
        </button>
        <button
          onClick={handleConfirm}
          disabled={confirmed}
          className={`flex-1 py-3 font-bold rounded-xl shadow-lg transition-[background-color,box-shadow,transform] min-h-[44px] ${
            confirmed
              ? "bg-primary-fixed text-on-primary-fixed"
              : "bg-primary text-on-primary shadow-primary/25 hover:scale-[1.01] active:scale-[0.99]"
          }`}
        >
          {confirmed ? "✓ Confirmada" : "Confirmar corrección"}
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
