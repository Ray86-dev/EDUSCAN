import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CollapsibleUpload } from "./collapsible-upload";

export default async function CurriculosPage() {
  const supabase = await createClient();

  // Cargar currículos con conteo de criterios
  const { data: subjects } = await supabase
    .from("curriculum_subjects")
    .select("id, stage, course, subject_name, source_filename, parsed_at")
    .order("subject_name");

  // Conteo de competencias y criterios por subject
  const subjectIds = (subjects || []).map((s) => s.id);
  const { data: competencies } = subjectIds.length > 0
    ? await supabase
        .from("curriculum_competencies")
        .select("id, subject_id")
        .in("subject_id", subjectIds)
    : { data: [] };

  const competencyIds = (competencies || []).map((c) => c.id);
  const { data: criteria } = competencyIds.length > 0
    ? await supabase
        .from("curriculum_criteria")
        .select("id, competency_id")
        .in("competency_id", competencyIds)
    : { data: [] };

  // Mapear conteos
  const compCountBySubject = new Map<string, number>();
  const criteriaByComp = new Map<string, number>();

  for (const comp of competencies || []) {
    compCountBySubject.set(comp.subject_id, (compCountBySubject.get(comp.subject_id) || 0) + 1);
  }
  for (const cr of criteria || []) {
    criteriaByComp.set(cr.competency_id, (criteriaByComp.get(cr.competency_id) || 0) + 1);
  }

  const criteriaCountBySubject = new Map<string, number>();
  for (const comp of competencies || []) {
    const count = criteriaByComp.get(comp.id) || 0;
    criteriaCountBySubject.set(
      comp.subject_id,
      (criteriaCountBySubject.get(comp.subject_id) || 0) + count
    );
  }

  const stageLabels: Record<string, string> = {
    infantil: "Infantil",
    primaria: "Primaria",
    eso: "ESO",
    bachillerato: "Bachillerato",
    fp: "FP",
    adultos: "Adultos/ESPA",
  };

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto w-full">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-8"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Inicio
      </Link>

      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-on-surface tracking-tight">
          Currículos
        </h2>
        <p className="text-on-surface-variant mt-1">
          Sube el PDF del currículo de tu asignatura para seleccionar criterios de evaluación automáticamente.
        </p>
      </div>

      <CollapsibleUpload defaultOpen={(subjects || []).length === 0} />

      {/* Lista de currículos existentes */}
      {(subjects || []).length > 0 ? (
        <div className="space-y-3 mt-8">
          <h3 className="text-lg font-headline font-bold text-on-surface">
            Currículos disponibles
          </h3>
          {(subjects || []).map((subject) => (
            <Link
              key={subject.id}
              href={`/curriculos/${subject.id}`}
              className="block bg-surface-container-lowest p-5 rounded-xl border-l-4 border-primary hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-headline font-bold text-on-surface">
                    {subject.subject_name}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed uppercase tracking-widest">
                      {stageLabels[subject.stage] || subject.stage}
                    </span>
                    {subject.course && (
                      <span className="text-xs text-on-surface-variant">{subject.course}</span>
                    )}
                    <span className="text-xs text-on-surface-variant">
                      {compCountBySubject.get(subject.id) || 0} competencias · {criteriaCountBySubject.get(subject.id) || 0} criterios
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-xl">
                  chevron_right
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 text-center text-on-surface-variant text-sm">
          <p>Aún no hay currículos cargados. Sube tu primer currículo para empezar.</p>
        </div>
      )}
    </div>
  );
}
