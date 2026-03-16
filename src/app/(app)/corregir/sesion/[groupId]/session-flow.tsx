"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

// --- Queue types ---

type QueueStatus = "pending" | "uploading" | "processing" | "done" | "error";

interface QueueItem {
  studentId: string;
  imageFiles: File[];
  status: QueueStatus;
  error?: string;
  result?: CorrectionResult;
  correctionId?: string;
}

const MAX_CONCURRENT = 2;

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
  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number } | null>(null);
  const [dismissedWarning, setDismissedWarning] = useState(false);

  // M6: Restore persisted activity selection
  const storageKey = `eduscan-session-${groupId}`;
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem(storageKey) || null; } catch { return null; }
  });

  // --- Capture state (UI for photographing) ---
  const [captureStudentId, setCaptureStudentId] = useState<string | null>(null);
  const [captureFiles, setCaptureFiles] = useState<File[]>([]);
  const [capturePreviews, setCapturePreviews] = useState<string[]>([]);

  // --- Toast notification for queued items ---
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Modo Rápido (auto-detect student from exam image) ---
  const [rapidMode, setRapidMode] = useState(false);
  const [rapidCapturing, setRapidCapturing] = useState(false); // capturing without pre-selected student
  const [rapidDetecting, setRapidDetecting] = useState(false);
  const [rapidMatch, setRapidMatch] = useState<{
    detectedName: { name: string | null; first_surname: string | null; second_surname: string | null; raw_text: string; confidence: string };
    matches: { studentId: string; score: number; matchedBy: string }[];
  } | null>(null);
  const [rapidSelectedStudentId, setRapidSelectedStudentId] = useState<string | null>(null);

  // --- Background queue ---
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const processingRef = useRef(new Set<string>());

  // M6: Persist activity selection
  useEffect(() => {
    try {
      if (selectedActivityId) localStorage.setItem(storageKey, selectedActivityId);
      else localStorage.removeItem(storageKey);
    } catch { /* localStorage unavailable */ }
  }, [selectedActivityId, storageKey]);

  // M8: Check usage on mount for freemium warning
  useEffect(() => {
    const checkUsage = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
          .from("users")
          .select("plan_tier")
          .eq("id", user.id)
          .single();

        if (userData?.plan_tier === "premium") return;

        const now = new Date();
        const canaryDate = now.toLocaleDateString("en-CA", { timeZone: "Atlantic/Canary" });
        const { data: usage } = await supabase
          .from("usage_logs")
          .select("corrections_count")
          .eq("user_id", user.id)
          .eq("date", canaryDate)
          .single();

        setUsageInfo({ used: usage?.corrections_count || 0, limit: 2 });
      } catch { /* silent */ }
    };
    checkUsage();
  }, []);

  // --- Queue processor ---
  const processQueueItem = useCallback(async (studentId: string, files: File[], activityId: string | null) => {
    // Mark as uploading
    setQueue((prev) =>
      prev.map((q) => q.studentId === studentId ? { ...q, status: "uploading" as QueueStatus } : q)
    );

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Upload images
      const imagePaths: string[] = [];
      const timestamp = Date.now();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${timestamp}_${studentId.slice(0, 8)}_${i}.${ext}`;
        const { error } = await supabase.storage.from("exam-images").upload(path, file, { contentType: file.type });
        if (error) throw new Error(`Error subiendo imagen: ${error.message}`);
        imagePaths.push(path);
      }

      // Mark as processing (upload done, waiting for Gemini)
      setQueue((prev) =>
        prev.map((q) => q.studentId === studentId ? { ...q, status: "processing" as QueueStatus } : q)
      );

      // Call API
      const response = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePaths, studentId, activityId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error en la corrección");
      }

      // Update student grade locally
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? { ...s, correctionId: data.correction.id, grade: data.result.grade, gradeLabel: data.result.grade_label }
            : s
        )
      );

      // Update usage info
      setUsageInfo((prev) => prev ? { ...prev, used: prev.used + 1 } : prev);

      // Mark as done
      setQueue((prev) =>
        prev.map((q) =>
          q.studentId === studentId
            ? { ...q, status: "done" as QueueStatus, result: data.result, correctionId: data.correction.id }
            : q
        )
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error inesperado";

      // If limit reached, mark all pending items as error too
      const isLimitError = errorMsg.includes("Límite diario");

      setQueue((prev) =>
        prev.map((q) => {
          if (q.studentId === studentId) {
            return { ...q, status: "error" as QueueStatus, error: errorMsg };
          }
          if (isLimitError && q.status === "pending") {
            return { ...q, status: "error" as QueueStatus, error: "Límite diario alcanzado" };
          }
          return q;
        })
      );
    } finally {
      processingRef.current.delete(studentId);
    }
  }, []);

  // Queue drain effect — pick up pending items when slots are available
  useEffect(() => {
    const processing = queue.filter((q) => q.status === "uploading" || q.status === "processing");
    const pending = queue.filter((q) => q.status === "pending");

    if (processing.length < MAX_CONCURRENT && pending.length > 0) {
      const next = pending[0];
      if (!processingRef.current.has(next.studentId)) {
        processingRef.current.add(next.studentId);
        processQueueItem(next.studentId, next.imageFiles, selectedActivityId);
      }
    }
  }, [queue, processQueueItem, selectedActivityId]);

  // --- Computed values ---
  const correctedCount = students.filter((s) => s.correctionId).length;
  const queueDoneCount = queue.filter((q) => q.status === "done").length;
  const totalCorrected = correctedCount;
  const totalCount = students.length;
  const uncorrectedCount = totalCount - correctedCount;
  const showFreemiumWarning = usageInfo && !dismissedWarning && usageInfo.limit !== Infinity && uncorrectedCount > (usageInfo.limit - usageInfo.used);
  const allDone = students.every((s) => s.correctionId);
  const isCapturing = captureStudentId !== null;
  const isRapidCapturing = rapidMode && rapidCapturing;

  // --- Handlers ---
  const selectStudent = (studentId: string) => {
    setCaptureStudentId(studentId);
    setCaptureFiles([]);
    setCapturePreviews([]);
  };

  const addFiles = (files: File[]) => {
    const previews = files.map((f) => URL.createObjectURL(f));
    setCaptureFiles((prev) => [...prev, ...files]);
    setCapturePreviews((prev) => [...prev, ...previews]);
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

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(message);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  };

  const getNextUncorrectedStudent = (afterStudentId: string): StudentWithStatus | null => {
    const currentIdx = students.findIndex((s) => s.id === afterStudentId);
    const queuedIds = new Set(queue.filter((q) => q.status !== "error").map((q) => q.studentId));
    // Look after current student first, then wrap around
    for (let offset = 1; offset < students.length; offset++) {
      const idx = (currentIdx + offset) % students.length;
      const s = students[idx];
      if (!s.correctionId && !queuedIds.has(s.id)) return s;
    }
    return null;
  };

  const submitToQueue = () => {
    if (captureFiles.length === 0 || !captureStudentId) return;

    const submittedStudent = students.find((s) => s.id === captureStudentId);

    // Add to queue
    setQueue((prev) => [
      ...prev.filter((q) => q.studentId !== captureStudentId), // Remove previous attempt for same student
      {
        studentId: captureStudentId,
        imageFiles: [...captureFiles],
        status: "pending",
      },
    ]);

    // Clean up current previews
    capturePreviews.forEach((p) => URL.revokeObjectURL(p));

    // Show confirmation toast
    if (submittedStudent) {
      showToast(`Examen de ${submittedStudent.name} enviado a corregir`);
    }

    // Auto-advance to next uncorrected student
    const next = getNextUncorrectedStudent(captureStudentId);
    if (next) {
      setCaptureStudentId(next.id);
      setCaptureFiles([]);
      setCapturePreviews([]);
    } else {
      // All students queued/corrected — back to list
      setCaptureStudentId(null);
      setCaptureFiles([]);
      setCapturePreviews([]);
    }
  };

  const retryQueueItem = (studentId: string) => {
    setQueue((prev) =>
      prev.map((q) =>
        q.studentId === studentId ? { ...q, status: "pending" as QueueStatus, error: undefined } : q
      )
    );
  };

  const backToList = () => {
    capturePreviews.forEach((p) => URL.revokeObjectURL(p));
    setCaptureStudentId(null);
    setCaptureFiles([]);
    setCapturePreviews([]);
    setRapidCapturing(false);
    setRapidDetecting(false);
    setRapidMatch(null);
    setRapidSelectedStudentId(null);
  };

  // --- Modo Rápido handlers ---
  const startRapidCapture = () => {
    setRapidCapturing(true);
    setRapidMatch(null);
    setRapidSelectedStudentId(null);
    setCaptureFiles([]);
    setCapturePreviews([]);
  };

  const detectStudent = async () => {
    if (captureFiles.length === 0) return;
    setRapidDetecting(true);

    try {
      // Convert first image to base64 for name detection
      const firstFile = captureFiles[0];
      const arrayBuffer = await firstFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      const response = await fetch("/api/identify-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          imageMimeType: firstFile.type || "image/jpeg",
          groupId,
        }),
      });

      const data = await response.json();

      if (data.detected && data.matches?.length > 0) {
        setRapidMatch({
          detectedName: data.detectedName,
          matches: data.matches,
        });
        // Auto-select the best match if high confidence
        setRapidSelectedStudentId(data.matches[0].studentId);
      } else {
        setRapidMatch({
          detectedName: data.detectedName || { name: null, first_surname: null, second_surname: null, raw_text: "", confidence: "baja" },
          matches: [],
        });
      }
    } catch {
      showToast("Error detectando alumno");
    } finally {
      setRapidDetecting(false);
    }
  };

  const confirmRapidAndQueue = () => {
    if (!rapidSelectedStudentId || captureFiles.length === 0) return;

    const submittedStudent = students.find((s) => s.id === rapidSelectedStudentId);

    // Add to queue
    setQueue((prev) => [
      ...prev.filter((q) => q.studentId !== rapidSelectedStudentId),
      {
        studentId: rapidSelectedStudentId,
        imageFiles: [...captureFiles],
        status: "pending",
      },
    ]);

    capturePreviews.forEach((p) => URL.revokeObjectURL(p));

    if (submittedStudent) {
      showToast(`Examen de ${submittedStudent.name} enviado a corregir`);
    }

    // Reset for next rapid capture
    setRapidMatch(null);
    setRapidSelectedStudentId(null);
    setCaptureFiles([]);
    setCapturePreviews([]);
    // Stay in rapid mode — ready for next exam
  };

  // --- Queue status helpers ---
  const getQueueItem = (studentId: string) => queue.find((q) => q.studentId === studentId);

  const getStudentStatus = (student: StudentWithStatus): "corrected" | "queued" | "error" | "none" => {
    const qi = getQueueItem(student.id);
    if (qi?.status === "error") return "error";
    if (qi && (qi.status === "pending" || qi.status === "uploading" || qi.status === "processing")) return "queued";
    if (student.correctionId || qi?.status === "done") return "corrected";
    return "none";
  };

  const activeStudent = students.find((s) => s.id === captureStudentId);
  const queueActive = queue.filter((q) => q.status === "uploading" || q.status === "processing" || q.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-fade-in-up">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {toast}
        </div>
      )}

      {/* Progress bar */}
      <div className="bg-surface-container-low rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-on-surface">
            Progreso: {totalCorrected}/{totalCount} corregidos
          </span>
          <div className="flex items-center gap-3">
            {queueActive > 0 && (
              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-sm animate-spin">progress_activity</span>
                {queueActive} en cola
              </span>
            )}
            <span className="text-sm font-bold text-primary">
              {totalCount > 0 ? Math.round((totalCorrected / totalCount) * 100) : 0}%
            </span>
          </div>
        </div>
        <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${totalCount > 0 ? (totalCorrected / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* M8: Freemium warning */}
      {showFreemiumWarning && (
        <div className="bg-tertiary-container/50 border border-tertiary/30 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-tertiary text-xl shrink-0 mt-0.5">info</span>
          <div className="flex-1">
            <p className="text-sm text-on-surface font-medium">
              Puedes corregir {Math.max(0, usageInfo!.limit - usageInfo!.used)} examen{usageInfo!.limit - usageInfo!.used !== 1 ? "es" : ""} más hoy con el plan gratuito.
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Este grupo tiene {uncorrectedCount} alumnos pendientes. Actualiza a Premium para correcciones ilimitadas.
            </p>
          </div>
          <button
            onClick={() => setDismissedWarning(true)}
            className="text-on-surface-variant hover:text-on-surface shrink-0 p-1"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

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

      {/* Mode toggle */}
      {!isCapturing && !isRapidCapturing && (
        <div className="flex gap-2">
          <button
            onClick={() => setRapidMode(false)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-all ${
              !rapidMode
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-base">touch_app</span>
            Manual
          </button>
          <button
            onClick={() => setRapidMode(true)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-all ${
              rapidMode
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-base">bolt</span>
            Modo Rápido
          </button>
        </div>
      )}

      {/* Rapid mode: start capture button */}
      {rapidMode && !isCapturing && !isRapidCapturing && (
        <button
          onClick={startRapidCapture}
          className="w-full py-4 bg-tertiary-container text-on-tertiary-container font-bold rounded-xl hover:bg-tertiary-container/80 transition-all min-h-[44px] text-lg flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">photo_camera</span>
          Fotografiar siguiente examen
        </button>
      )}

      {/* Student list view (always visible when not capturing) */}
      {!isCapturing && !isRapidCapturing && (
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
            {students.map((student) => {
              const status = getStudentStatus(student);
              const qi = getQueueItem(student.id);
              const grade = qi?.result?.grade ?? student.grade;
              const gradeLabel = qi?.result?.grade_label ?? student.gradeLabel;

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10 last:border-0 hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Status indicator */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      status === "corrected"
                        ? "bg-primary-fixed text-primary"
                        : status === "queued"
                        ? "bg-tertiary-container text-on-tertiary-container"
                        : status === "error"
                        ? "bg-error-container text-on-error-container"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}>
                      {status === "corrected" ? (
                        <span className="material-symbols-outlined text-base">check</span>
                      ) : status === "queued" ? (
                        <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                      ) : status === "error" ? (
                        <span className="material-symbols-outlined text-base">error</span>
                      ) : (
                        student.list_number || "—"
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-on-surface">
                        {student.first_surname}
                        {student.second_surname ? ` ${student.second_surname}` : ""}, {student.name}
                      </p>
                      {status === "corrected" && grade !== null && (
                        <p className={`text-xs font-bold ${grade >= 5 ? "text-primary" : "text-error"}`}>
                          {grade.toFixed(1)} — {gradeLabel}
                        </p>
                      )}
                      {status === "queued" && (
                        <p className="text-xs text-on-surface-variant">
                          {qi?.status === "uploading" ? "Subiendo imágenes..." : qi?.status === "processing" ? "Corrigiendo..." : "En cola..."}
                        </p>
                      )}
                      {status === "error" && (
                        <p className="text-xs text-error">{qi?.error || "Error"}</p>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  {status === "error" ? (
                    <button
                      onClick={() => retryQueueItem(student.id)}
                      className="px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] bg-error-container text-on-error-container hover:bg-error-container/80 transition-all"
                    >
                      Reintentar
                    </button>
                  ) : status === "queued" ? (
                    <span className="text-xs text-on-surface-variant px-3">
                      <span className="material-symbols-outlined text-primary text-sm animate-spin">progress_activity</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => selectStudent(student.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] transition-all ${
                        status === "corrected"
                          ? "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                          : "bg-primary text-on-primary hover:bg-primary/90"
                      }`}
                    >
                      {status === "corrected" ? "Recorregir" : "Corregir"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rapid mode capture step (no pre-selected student) */}
      {isRapidCapturing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-base text-tertiary">bolt</span>
                Modo Rápido
              </p>
              <p className="font-headline font-bold text-lg text-on-surface">
                {rapidMatch ? "Confirmar alumno" : "Fotografiar examen"}
              </p>
            </div>
            <button onClick={backToList} className="text-sm text-on-surface-variant hover:text-primary">
              Ver lista
            </button>
          </div>

          {/* Photo capture (same as manual mode) */}
          {!rapidMatch && !rapidDetecting && (
            <>
              {captureFiles.length === 0 ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="space-y-2"
                >
                  <button
                    onClick={() => document.getElementById("rapid-camera")?.click()}
                    className="w-full border-2 border-dashed border-tertiary/40 rounded-xl flex flex-col items-center justify-center gap-2 p-8 min-h-[160px] hover:border-tertiary/70 hover:bg-tertiary-container/10 transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <span className="material-symbols-outlined text-tertiary text-3xl">photo_camera</span>
                    <p className="font-headline font-bold text-on-surface">Hacer foto</p>
                    <p className="text-xs text-on-surface-variant">Página 1 del examen (con el nombre del alumno)</p>
                  </button>
                  <input id="rapid-camera" type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
                  <button
                    onClick={() => document.getElementById("rapid-file")?.click()}
                    className="w-full border border-outline-variant rounded-xl flex items-center justify-center gap-2 p-3 min-h-[48px] hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">photo_library</span>
                    <span className="text-sm font-medium text-on-surface">Galería / PDF</span>
                  </button>
                  <input id="rapid-file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={handleFileSelect} className="hidden" />
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex gap-2"
                >
                  <button
                    onClick={() => document.getElementById("rapid-camera-add")?.click()}
                    className="flex-1 border border-dashed border-outline-variant rounded-xl flex items-center justify-center gap-2 p-3 min-h-[44px] hover:border-tertiary/50 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-tertiary text-lg">photo_camera</span>
                    <span className="text-sm font-medium text-on-surface">Otra foto</span>
                  </button>
                  <input id="rapid-camera-add" type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
                  <button
                    onClick={() => document.getElementById("rapid-file-add")?.click()}
                    className="flex-1 border border-dashed border-outline-variant rounded-xl flex items-center justify-center gap-2 p-3 min-h-[44px] hover:border-tertiary/50 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">add_photo_alternate</span>
                    <span className="text-sm font-medium text-on-surface">Galería</span>
                  </button>
                  <input id="rapid-file-add" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={handleFileSelect} className="hidden" />
                </div>
              )}

              {captureFiles.length > 0 && (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {captureFiles.map((file, i) => (
                      <div key={i} className="relative aspect-[3/4] bg-surface-container-lowest rounded-lg overflow-hidden">
                        {file.type.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={capturePreviews[i]} alt={`Pág ${i + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="material-symbols-outlined text-2xl text-on-surface-variant">description</span>
                          </div>
                        )}
                        <div className="absolute top-1 left-1 w-5 h-5 bg-tertiary text-on-tertiary rounded-full flex items-center justify-center text-[10px] font-bold">
                          {i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={detectStudent}
                    className="w-full py-4 bg-tertiary-container text-on-tertiary-container font-bold rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all min-h-[44px] text-lg flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-xl">person_search</span>
                    Detectar alumno
                  </button>
                </>
              )}
            </>
          )}

          {/* Detecting spinner */}
          {rapidDetecting && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-tertiary-container rounded-2xl flex items-center justify-center mx-auto animate-soft-pulse">
                <span className="material-symbols-outlined text-on-tertiary-container text-3xl">person_search</span>
              </div>
              <p className="text-sm text-on-surface-variant">Leyendo nombre del examen...</p>
              <div className="w-48 mx-auto h-1.5 bg-surface-container-highest rounded-full overflow-hidden relative">
                <div className="animate-progress-indeterminate h-full bg-tertiary rounded-full" />
              </div>
            </div>
          )}

          {/* Match result */}
          {rapidMatch && !rapidDetecting && (
            <div className="space-y-4">
              {/* Detected name info */}
              <div className="bg-surface-container-low rounded-xl p-4">
                <p className="text-xs text-on-surface-variant mb-1">Nombre detectado en el examen:</p>
                <p className="text-sm font-bold text-on-surface">
                  {rapidMatch.detectedName.raw_text || "No detectado"}
                </p>
                {rapidMatch.detectedName.confidence && (
                  <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    rapidMatch.detectedName.confidence === "alta"
                      ? "bg-primary-fixed text-on-primary-fixed"
                      : rapidMatch.detectedName.confidence === "media"
                      ? "bg-tertiary-container text-on-tertiary-container"
                      : "bg-error-container text-on-error-container"
                  }`}>
                    Confianza {rapidMatch.detectedName.confidence}
                  </span>
                )}
              </div>

              {/* Student selection */}
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-4 pt-3 pb-2">
                  {rapidMatch.matches.length > 0 ? "Seleccionar alumno" : "No se encontró coincidencia"}
                </p>
                {rapidMatch.matches.length > 0 ? (
                  rapidMatch.matches.map((match) => {
                    const student = students.find((s) => s.id === match.studentId);
                    if (!student) return null;
                    const isSelected = rapidSelectedStudentId === match.studentId;
                    return (
                      <button
                        key={match.studentId}
                        onClick={() => setRapidSelectedStudentId(match.studentId)}
                        className={`w-full flex items-center justify-between px-4 py-3 border-b border-outline-variant/10 last:border-0 transition-colors ${
                          isSelected ? "bg-primary-fixed" : "hover:bg-surface-container"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected && (
                            <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                          )}
                          <span className="text-sm font-medium text-on-surface">
                            {student.first_surname} {student.second_surname || ""}, {student.name}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          match.score >= 0.8 ? "bg-primary-fixed text-primary" : "bg-surface-container text-on-surface-variant"
                        }`}>
                          {Math.round(match.score * 100)}%
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-4 pb-3 text-sm text-on-surface-variant">
                    Selecciona manualmente:
                  </p>
                )}

                {/* Manual fallback: show all ungraded students */}
                {(rapidMatch.matches.length === 0 || rapidMatch.matches[0].score < 0.8) && (
                  <div className="border-t border-outline-variant/20">
                    <p className="text-[10px] text-on-surface-variant px-4 pt-2 pb-1 uppercase tracking-widest">
                      Todos los alumnos
                    </p>
                    <div className="max-h-48 overflow-y-auto">
                      {students
                        .filter((s) => !s.correctionId && !queue.some((q) => q.studentId === s.id && q.status !== "error"))
                        .map((student) => {
                          const isSelected = rapidSelectedStudentId === student.id;
                          const isInMatches = rapidMatch.matches.some((m) => m.studentId === student.id);
                          if (isInMatches) return null;
                          return (
                            <button
                              key={student.id}
                              onClick={() => setRapidSelectedStudentId(student.id)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-outline-variant/5 last:border-0 text-left transition-colors ${
                                isSelected ? "bg-primary-fixed" : "hover:bg-surface-container"
                              }`}
                            >
                              {isSelected && (
                                <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                              )}
                              <span className="text-sm text-on-surface">
                                {student.list_number ? `${student.list_number}. ` : ""}
                                {student.first_surname} {student.second_surname || ""}, {student.name}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm button */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setRapidMatch(null); setCaptureFiles([]); setCapturePreviews([]); }}
                  className="flex-1 py-3 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors min-h-[44px]"
                >
                  Descartar
                </button>
                <button
                  onClick={confirmRapidAndQueue}
                  disabled={!rapidSelectedStudentId}
                  className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Corregir
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Capture step (uploading photos for a student) */}
      {isCapturing && activeStudent && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-on-surface-variant">Corrigiendo a:</p>
              <p className="font-headline font-bold text-lg text-on-surface">
                {activeStudent.first_surname} {activeStudent.second_surname || ""}, {activeStudent.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {(() => {
                const next = getNextUncorrectedStudent(captureStudentId!);
                return next ? (
                  <button
                    onClick={() => {
                      capturePreviews.forEach((p) => URL.revokeObjectURL(p));
                      setCaptureStudentId(next.id);
                      setCaptureFiles([]);
                      setCapturePreviews([]);
                    }}
                    className="text-sm text-on-surface-variant hover:text-primary flex items-center gap-1"
                  >
                    Saltar
                    <span className="material-symbols-outlined text-base">skip_next</span>
                  </button>
                ) : null;
              })()}
              <button onClick={backToList} className="text-sm text-on-surface-variant hover:text-primary">
                Ver lista
              </button>
            </div>
          </div>

          {/* Upload zone — cámara como acción principal */}
          {captureFiles.length === 0 ? (
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

          {captureFiles.length > 0 && (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {captureFiles.map((file, i) => (
                  <div key={i} className="relative aspect-[3/4] bg-surface-container-lowest rounded-lg overflow-hidden">
                    {file.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={capturePreviews[i]} alt={`Pág ${i + 1}`} className="w-full h-full object-cover" />
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
              {(() => {
                const next = getNextUncorrectedStudent(captureStudentId!);
                return (
                  <>
                    <button
                      onClick={submitToQueue}
                      className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all min-h-[44px] text-lg flex items-center justify-center gap-2"
                    >
                      {next ? (
                        <>
                          Corregir y siguiente
                          <span className="material-symbols-outlined text-xl">arrow_forward</span>
                        </>
                      ) : (
                        "Corregir examen"
                      )}
                    </button>
                    <p className="text-xs text-center text-on-surface-variant">
                      {next
                        ? `Siguiente: ${next.first_surname} ${next.second_surname || ""}, ${next.name}`
                        : "La corrección se procesará en segundo plano."}
                    </p>
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}
