"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

interface ParsedCriterion {
  code: string;
  full_code: string;
  description: string;
  descriptors: string[];
}

interface ParsedCompetency {
  code: string;
  description: string;
  criteria: ParsedCriterion[];
}

interface ParsedCourse {
  course: string | null;
  competencies: ParsedCompetency[];
}

type UploadStep = "form" | "parsing" | "preview" | "saving" | "done" | "error";

const STAGE_OPTIONS = [
  { value: "infantil", label: "Infantil" },
  { value: "primaria", label: "Primaria" },
  { value: "eso", label: "ESO" },
  { value: "bachillerato", label: "Bachillerato" },
  { value: "fp", label: "FP" },
  { value: "adultos", label: "Adultos / ESPA" },
];

export function CurriculumUpload() {
  const router = useRouter();
  const [step, setStep] = useState<UploadStep>("form");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [courses, setCourses] = useState<ParsedCourse[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [totalCriteria, setTotalCriteria] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [expandedComp, setExpandedComp] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && isValidFile(f)) setFile(f);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && isValidFile(f)) setFile(f);
    e.target.value = "";
  };

  const handleParse = async () => {
    if (!file || !stage || !subjectName) return;

    setStep("parsing");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("stage", stage);
      formData.append("subject_name", subjectName);
      formData.append("preview", "true");

      const response = await fetch("/api/curriculum/parse", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al analizar el currículo");
        setStep("error");
        return;
      }

      const parsedCourses: ParsedCourse[] = data.courses;
      setCourses(parsedCourses);
      setSelectedCourses(parsedCourses.map((_, i) => i)); // todos seleccionados
      setTotalCriteria(data.totalCriteria);
      // Si hay un solo curso, expandirlo por defecto
      if (parsedCourses.length === 1) {
        setExpandedCourse(0);
      }
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setStep("error");
    }
  };

  const toggleCourse = (index: number) => {
    setSelectedCourses((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index].sort()
    );
  };

  const handleConfirm = async () => {
    if (!file || !stage || !subjectName || selectedCourses.length === 0) return;

    setStep("saving");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("stage", stage);
      formData.append("subject_name", subjectName);
      formData.append("selected_courses", JSON.stringify(selectedCourses));

      const response = await fetch("/api/curriculum/parse", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error guardando currículo");
        setStep("error");
        return;
      }

      setSavedCount(data.coursesCount || 1);
      setStep("done");
      setTimeout(() => {
        router.refresh();
        resetForm();
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setStep("error");
    }
  };

  const resetForm = () => {
    setStep("form");
    setFile(null);
    setStage("");
    setSubjectName("");
    setCourses([]);
    setSelectedCourses([]);
    setTotalCriteria(0);
    setError(null);
    setExpandedCourse(null);
    setExpandedComp(null);
    setSavedCount(0);
  };

  const isMultiCourse = courses.length > 1;
  const selectedCriteria = courses
    .filter((_, i) => selectedCourses.includes(i))
    .reduce(
      (sum, c) => sum + c.competencies.reduce((cs, comp) => cs + comp.criteria.length, 0),
      0
    );

  // --- Form step ---
  if (step === "form") {
    return (
      <div className="bg-surface-container-low rounded-xl p-6 space-y-5">
        <h3 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">upload_file</span>
          Subir currículo
        </h3>

        {/* File dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById("curriculum-file")?.click()}
          className={`border-2 border-dashed rounded-xl flex items-center justify-center gap-4 p-6 cursor-pointer transition-colors ${
            file ? "border-primary bg-primary-fixed/10" : "border-outline-variant hover:border-primary/50"
          }`}
        >
          <span className="material-symbols-outlined text-2xl text-primary">
            {file ? "description" : "cloud_upload"}
          </span>
          <div>
            <p className="text-sm font-medium text-on-surface">
              {file ? file.name : "Arrastra un PDF u ODT aquí"}
            </p>
            <p className="text-xs text-on-surface-variant">
              {file
                ? `${(file.size / 1024).toFixed(0)} KB`
                : "Archivos del BOC / Gobierno de Canarias"}
            </p>
          </div>
          {file && (
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="p-1 hover:bg-error/10 rounded-full"
            >
              <span className="material-symbols-outlined text-error text-xl">close</span>
            </button>
          )}
          <input
            id="curriculum-file"
            type="file"
            accept=".pdf,.odt,application/pdf,application/vnd.oasis.opendocument.text"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Metadata fields — sin campo Curso */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-on-surface-variant block mb-1">Etapa *</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">Seleccionar...</option>
              {STAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-on-surface-variant block mb-1">Asignatura *</label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Ej: Física y Química"
              className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleParse}
          disabled={!file || !stage || !subjectName}
          className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-[background-color,transform] min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">auto_awesome</span>
          Analizar currículo
        </button>
      </div>
    );
  }

  // --- Parsing step ---
  if (step === "parsing" || step === "saving") {
    return (
      <div className="bg-surface-container-low rounded-xl p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center mx-auto animate-pulse">
          <span className="material-symbols-outlined text-on-primary-container text-3xl">
            {step === "parsing" ? "auto_awesome" : "save"}
          </span>
        </div>
        <h3 className="text-xl font-headline font-bold text-on-surface">
          {step === "parsing" ? "Analizando currículo..." : "Guardando criterios..."}
        </h3>
        <p className="text-sm text-on-surface-variant">
          {step === "parsing"
            ? "Gemini está extrayendo las competencias y criterios. Esto puede tardar 10-20 segundos."
            : `Almacenando ${selectedCourses.length} ${selectedCourses.length === 1 ? "currículo" : "currículos"} en la base de datos...`}
        </p>
        <div className="w-48 mx-auto h-1 bg-surface-container-highest rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full w-1/3 animate-bounce" />
        </div>
      </div>
    );
  }

  // --- Preview step ---
  if (step === "preview") {
    return (
      <div className="bg-surface-container-low rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">checklist</span>
            {isMultiCourse
              ? `${courses.length} cursos detectados`
              : `${courses[0]?.competencies.length || 0} competencias, ${totalCriteria} criterios`}
          </h3>
          <button
            onClick={resetForm}
            className="text-sm text-on-surface-variant hover:text-primary"
          >
            Cancelar
          </button>
        </div>

        <p className="text-sm text-on-surface-variant">
          <strong>{subjectName}</strong> — {STAGE_OPTIONS.find((o) => o.value === stage)?.label}
        </p>

        {isMultiCourse && (
          <p className="text-xs text-on-surface-variant bg-secondary-container/30 rounded-lg px-3 py-2">
            El documento contiene criterios para varios cursos. Selecciona los que quieras guardar.
          </p>
        )}

        {/* Lista de cursos */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {courses.map((courseData, courseIndex) => {
            const courseCriteria = courseData.competencies.reduce(
              (sum, comp) => sum + comp.criteria.length, 0
            );
            const isSelected = selectedCourses.includes(courseIndex);
            const isCourseExpanded = expandedCourse === courseIndex;

            return (
              <div
                key={courseIndex}
                className={`bg-surface-container-lowest rounded-xl overflow-hidden transition-opacity ${
                  isMultiCourse && !isSelected ? "opacity-50" : ""
                }`}
              >
                {/* Course header */}
                <div className="flex items-center gap-3 p-4">
                  {isMultiCourse && (
                    <button
                      onClick={() => toggleCourse(courseIndex)}
                      className="shrink-0"
                    >
                      <span className={`material-symbols-outlined text-xl ${
                        isSelected ? "text-primary" : "text-outline-variant"
                      }`}>
                        {isSelected ? "check_box" : "check_box_outline_blank"}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedCourse(isCourseExpanded ? null : courseIndex)}
                    className="flex-1 flex items-center justify-between text-left"
                  >
                    <div>
                      {courseData.course && (
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">
                          {courseData.course}
                        </span>
                      )}
                      <p className="text-sm text-on-surface">
                        {courseData.competencies.length} competencias, {courseCriteria} criterios
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-xl ml-2">
                      {isCourseExpanded ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                </div>

                {/* Competencias expandidas */}
                {isCourseExpanded && (
                  <div className="border-t border-outline-variant/10 px-4 pb-4 space-y-2">
                    {courseData.competencies.map((comp) => (
                      <div key={`${courseIndex}-${comp.code}`} className="mt-2">
                        <button
                          onClick={() =>
                            setExpandedComp(
                              expandedComp === `${courseIndex}-${comp.code}`
                                ? null
                                : `${courseIndex}-${comp.code}`
                            )
                          }
                          className="w-full flex items-center justify-between text-left py-2"
                        >
                          <div className="flex-1">
                            <span className="text-xs font-bold text-secondary uppercase tracking-widest">
                              {comp.code}
                            </span>
                            <p className="text-xs text-on-surface mt-0.5 line-clamp-2">
                              {comp.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-3 shrink-0">
                            <span className="text-[10px] text-on-surface-variant font-medium">
                              {comp.criteria.length}
                            </span>
                            <span className="material-symbols-outlined text-on-surface-variant text-base">
                              {expandedComp === `${courseIndex}-${comp.code}` ? "expand_less" : "expand_more"}
                            </span>
                          </div>
                        </button>
                        {expandedComp === `${courseIndex}-${comp.code}` && (
                          <div className="pl-2 space-y-2 mt-1">
                            {comp.criteria.map((cr) => (
                              <div key={cr.code} className="flex gap-3">
                                <span className="text-[10px] font-bold text-tertiary shrink-0 mt-0.5 min-w-[45px]">
                                  {cr.full_code}
                                </span>
                                <div>
                                  <p className="text-[11px] text-on-surface leading-relaxed">{cr.description}</p>
                                  {cr.descriptors.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {cr.descriptors.map((d) => (
                                        <span key={d} className="text-[9px] px-1.5 py-0.5 bg-surface-container rounded-full text-on-surface-variant">
                                          {d}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleConfirm}
          disabled={selectedCourses.length === 0}
          className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors min-h-[44px] disabled:opacity-50"
        >
          {isMultiCourse
            ? `Confirmar y guardar ${selectedCourses.length} ${selectedCourses.length === 1 ? "curso" : "cursos"} (${selectedCriteria} criterios)`
            : `Confirmar y guardar (${selectedCriteria} criterios)`}
        </button>
      </div>
    );
  }

  // --- Done step ---
  if (step === "done") {
    return (
      <div className="bg-primary-fixed/30 rounded-xl p-8 text-center space-y-3">
        <span className="material-symbols-outlined text-primary text-4xl">check_circle</span>
        <h3 className="text-xl font-headline font-bold text-on-surface">
          {savedCount > 1
            ? `${savedCount} currículos guardados`
            : "Currículo guardado"}
        </h3>
        <p className="text-sm text-on-surface-variant">
          {savedCount > 1
            ? `Se han creado ${savedCount} entradas de ${subjectName} para tus actividades.`
            : `${totalCriteria} criterios disponibles para tus actividades.`}
        </p>
      </div>
    );
  }

  // --- Error step ---
  return (
    <div className="bg-error-container/30 rounded-xl p-8 text-center space-y-3">
      <span className="material-symbols-outlined text-error text-4xl">error</span>
      <h3 className="text-xl font-headline font-bold text-on-surface">Error</h3>
      <p className="text-sm text-on-surface-variant">{error}</p>
      <button
        onClick={resetForm}
        className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl min-h-[44px]"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}

function isValidFile(file: File): boolean {
  const validTypes = ["application/pdf", "application/vnd.oasis.opendocument.text"];
  const maxSize = 20 * 1024 * 1024; // 20 MB
  return (validTypes.includes(file.type) || file.name.endsWith(".odt") || file.name.endsWith(".pdf")) && file.size <= maxSize;
}
