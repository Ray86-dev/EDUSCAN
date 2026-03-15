"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CorrectionResult } from "@/lib/types/correction";
import { ExportButtons } from "../../../resultados/export-buttons";

interface Activity {
  id: string;
  title: string;
  criteria_codes: string[] | null;
}

interface StudentWithStatus {
  id: string;
  list_number: number | null;
  first_surname: string;
  second_surname: string | null;
  name: string;
  correctionId: string | null;
  grade: number | null;
  gradeLabel: string | null;
}

type SessionStep = "list" | "uploading" | "processing" | "result" | "error";

interface SessionState {
  step: SessionStep;
  activeStudentId: string | null;
  imageFiles: File[];
  imagePreviews: string[];
  result: CorrectionResult | null;
  correctionId: string | null;
  error: string | null;
}

export function SessionFlow({
  groupId,
  groupName,
  students: initialStudents,
  activities = [],
}: {
  groupId: string;
  groupName: string;
  students: StudentWithStatus[];
  activities?: Activity[];
}) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [state, setState] = useState<SessionState>({
    step: "list",
    activeStudentId: null,
    imageFiles: [],
    imagePreviews: [],
    result: null,
    correctionId: null,
    error: null,
  });

  const correctedCount = students.filter((s) => s.correctionId || s.id === state.activeStudentId && state.step === "result").length;
  const totalCount = students.length;

  const selectStudent = (studentId: string) => {
    setState({
      step: "uploading",
      activeStudentId: studentId,
      imageFiles: [],
      imagePreviews: [],
      result: null,
      correctionId: null,
      error: null,
    });
  };

  const addFiles = (files: File[]) => {
    const previews = files.map((f) => URL.createObjectURL(f));
    setState((prev) => ({
      ...prev,
      imageFiles: [...prev.imageFiles, ...files],
      imagePreviews: [...prev.imagePreviews, ...previews],
    }));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => validTypes.includes(f.type) && f.size <= 10 * 1024 * 1024
    );
    if (files.length > 0) addFiles(files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const files = Array.from(e.target.files || []).filter(
      (f) => validTypes.includes(f.type) && f.size <= 10 * 1024 * 1024
    );
    if (files.length > 0) addFiles(files);
    e.target.value = "";
  };

  const submitCorrection = async () => {
    if (state.imageFiles.length === 0 || !state.activeStudentId) return;
    setState((prev) => ({ ...prev, step: "processing" }));

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setState((prev) => ({ ...prev, step: "error", error: "No autenticado" })); return; }

      // Upload images
      const imagePaths: string[] = [];
      const timestamp = Date.now();
      for (let i = 0; i < state.imageFiles.length; i++) {
        const file = state.imageFiles[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${timestamp}_${i}.${ext}`;
        const { error } = await supabase.storage.from("exam-images").upload(path, file, { contentType: file.type });
        if (error) { setState((prev) => ({ ...prev, step: "error", error: `Error subiendo imagen: ${error.message}` })); return; }
        imagePaths.push(path);
      }

      // Call API
      const response = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePaths, studentId: state.activeStudentId, activityId: selectedActivityId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setState((prev) => ({
          ...prev,
          step: "error",
          error: data.error || "Error en la corrección",
        }));
        return;
      }

      // Update student status locally
      setStudents((prev) =>
        prev.map((s) =>
          s.id === state.activeStudentId
            ? { ...s, correctionId: data.correction.id, grade: data.result.grade, gradeLabel: data.result.grade_label }
            : s
        )
      );

      setState((prev) => ({
        ...prev,
        step: "result",
        result: data.result,
        correctionId: data.correction.id,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        step: "error",
        error: err instanceof Error ? err.message : "Error inesperado",
      }));
    }
  };

  const goToNext = () => {
    // Find next uncorrected student
    const currentIdx = students.findIndex((s) => s.id === state.activeStudentId);
    const nextStudent = students.find((s, i) => i > currentIdx && !s.correctionId);

    if (nextStudent) {
      selectStudent(nextStudent.id);
    } else {
      // All done — back to list
      state.imagePreviews.forEach((p) => URL.revokeObjectURL(p));
      setState({ step: "list", activeStudentId: null, imageFiles: [], imagePreviews: [], result: null, correctionId: null, error: null });
    }
  };

  const backToList = () => {
    state.imagePreviews.forEach((p) => URL.revokeObjectURL(p));
    setState({ step: "list", activeStudentId: null, imageFiles: [], imagePreviews: [], result: null, correctionId: null, error: null });
  };

  const activeStudent = students.find((s) => s.id === state.activeStudentId);
  const allDone = students.every((s) => s.correctionId);

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-surface-container-low rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-on-surface">
            Progreso: {correctedCount}/{totalCount} corregidos
          </span>
          <span className="text-sm font-bold text-primary">
            {totalCount > 0 ? Math.round((correctedCount / totalCount) * 100) : 0}%
          </span>
        </div>
        <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${totalCount > 0 ? (correctedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Activity selector */}
      {activities.length > 0 && (
        <div className="bg-surface-container-low rounded-xl p-4">
          <p className="text-sm font-medium text-on-surface-variant flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-base">assignment</span>
            Actividad (modo criterial)
          </p>
          <select
            value={selectedActivityId || ""}
            onChange={(e) => setSelectedActivityId(e.target.value || null)}
            className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">Sin actividad (corrección simple)</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} {a.criteria_codes?.length ? `(${a.criteria_codes.length} criterios)` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Student list view */}
      {state.step === "list" && (
        <div className="space-y-4">
          {allDone && (
            <div className="bg-primary-fixed/30 p-6 rounded-xl text-center space-y-3">
              <span className="material-symbols-outlined text-primary text-4xl">celebration</span>
              <p className="font-headline font-bold text-lg text-on-surface">
                Todos los alumnos corregidos
              </p>
              <ExportButtons groupId={groupId} groupName={groupName} />
            </div>
          )}

          <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10 last:border-0 hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    student.correctionId
                      ? "bg-primary-fixed text-primary"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}>
                    {student.correctionId ? (
                      <span className="material-symbols-outlined text-base">check</span>
                    ) : (
                      student.list_number || "—"
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      {student.first_surname}
                      {student.second_surname ? ` ${student.second_surname}` : ""}, {student.name}
                    </p>
                    {student.grade !== null && (
                      <p className={`text-xs font-bold ${student.grade >= 5 ? "text-primary" : "text-error"}`}>
                        {student.grade.toFixed(1)} — {student.gradeLabel}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => selectStudent(student.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] transition-all ${
                    student.correctionId
                      ? "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                      : "bg-primary text-on-primary hover:bg-primary/90"
                  }`}
                >
                  {student.correctionId ? "Recorregir" : "Corregir"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload step */}
      {state.step === "uploading" && activeStudent && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-on-surface-variant">Corrigiendo a:</p>
              <p className="font-headline font-bold text-lg text-on-surface">
                {activeStudent.first_surname} {activeStudent.second_surname || ""}, {activeStudent.name}
              </p>
            </div>
            <button onClick={backToList} className="text-sm text-on-surface-variant hover:text-primary">
              Volver a la lista
            </button>
          </div>

          {/* Upload zone — cámara como acción principal */}
          {state.imageFiles.length === 0 ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="space-y-2"
            >
              <button
                onClick={() => document.getElementById("session-camera")?.click()}
                className="w-full border-2 border-dashed border-primary/40 rounded-xl flex flex-col items-center justify-center gap-2 p-8 min-h-[160px] hover:border-primary/70 hover:bg-primary-fixed/10 transition-all cursor-pointer active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-primary text-3xl">photo_camera</span>
                <p className="font-headline font-bold text-on-surface">Hacer foto</p>
                <p className="text-xs text-on-surface-variant">Abrir cámara del dispositivo</p>
              </button>
              <input id="session-camera" type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
              <button
                onClick={() => document.getElementById("session-file")?.click()}
                className="w-full border border-outline-variant rounded-xl flex items-center justify-center gap-2 p-3 min-h-[48px] hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-lg">photo_library</span>
                <span className="text-sm font-medium text-on-surface">Galería / PDF</span>
              </button>
              <input id="session-file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={handleFileSelect} className="hidden" />
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex gap-2"
            >
              <button
                onClick={() => document.getElementById("session-camera-add")?.click()}
                className="flex-1 border border-dashed border-outline-variant rounded-xl flex items-center justify-center gap-2 p-3 min-h-[44px] hover:border-primary/50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-primary text-lg">photo_camera</span>
                <span className="text-sm font-medium text-on-surface">Otra foto</span>
              </button>
              <input id="session-camera-add" type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
              <button
                onClick={() => document.getElementById("session-file-add")?.click()}
                className="flex-1 border border-dashed border-outline-variant rounded-xl flex items-center justify-center gap-2 p-3 min-h-[44px] hover:border-primary/50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-lg">add_photo_alternate</span>
                <span className="text-sm font-medium text-on-surface">Galería</span>
              </button>
              <input id="session-file-add" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={handleFileSelect} className="hidden" />
            </div>
          )}

          {state.imageFiles.length > 0 && (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {state.imageFiles.map((file, i) => (
                  <div key={i} className="relative aspect-[3/4] bg-surface-container-lowest rounded-lg overflow-hidden">
                    {file.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={state.imagePreviews[i]} alt={`Pág ${i + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="material-symbols-outlined text-2xl text-on-surface-variant">description</span>
                      </div>
                    )}
                    <div className="absolute top-1 left-1 w-5 h-5 bg-primary text-on-primary rounded-full flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={submitCorrection}
                className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all min-h-[44px] text-lg"
              >
                Corregir examen
              </button>
            </>
          )}
        </div>
      )}

      {/* Processing step */}
      {state.step === "processing" && (
        <div className="text-center space-y-5 py-12 animate-fade-in-up">
          <div className="w-20 h-20 bg-primary-container rounded-2xl flex items-center justify-center mx-auto animate-soft-pulse">
            <span className="material-symbols-outlined text-on-primary-container text-4xl">auto_awesome</span>
          </div>
          <h3 className="text-2xl font-headline font-bold text-on-surface">
            Corrigiendo a {activeStudent?.name}...
          </h3>
          <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
            Gemini está leyendo y evaluando las respuestas
          </p>
          <div className="w-64 mx-auto h-1.5 bg-surface-container-highest rounded-full overflow-hidden relative">
            <div className="animate-progress-indeterminate h-full bg-primary rounded-full" />
          </div>
        </div>
      )}

      {/* Result step */}
      {state.step === "result" && state.result && activeStudent && (
        <div className="space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-on-surface-variant">Resultado para:</p>
                <p className="font-headline font-bold text-lg text-on-surface">
                  {activeStudent.first_surname} {activeStudent.second_surname || ""}, {activeStudent.name}
                </p>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-headline font-extrabold ${state.result.grade >= 5 ? "text-primary" : "text-error"}`}>
                  {state.result.grade.toFixed(1)}
                </div>
                <div className="text-sm font-bold text-on-surface-variant">{state.result.grade_label}</div>
              </div>
            </div>
          </div>

          {/* Brief feedback */}
          <div className="bg-surface-container-low p-5 rounded-xl space-y-2">
            <p className="text-sm text-on-surface">
              <strong>Fortalezas:</strong> {state.result.ai_feedback.strengths.join("; ")}
            </p>
            <p className="text-sm text-on-surface">
              <strong>Mejoras:</strong> {state.result.ai_feedback.improvements.join("; ")}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={backToList}
              className="flex-1 py-3 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors min-h-[44px]"
            >
              Ver lista
            </button>
            <button
              onClick={goToNext}
              className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all min-h-[44px]"
            >
              {students.find((s, i) => i > students.findIndex((x) => x.id === state.activeStudentId) && !s.correctionId)
                ? "Siguiente alumno"
                : "Finalizar"}
            </button>
          </div>
        </div>
      )}

      {/* Error step */}
      {state.step === "error" && (
        <div className="text-center space-y-4 py-12">
          <div className="w-20 h-20 bg-error-container rounded-2xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-on-error-container text-4xl">error</span>
          </div>
          <p className="text-on-surface-variant">{state.error}</p>
          <button
            onClick={backToList}
            className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl min-h-[44px]"
          >
            Volver a la lista
          </button>
        </div>
      )}
    </div>
  );
}
