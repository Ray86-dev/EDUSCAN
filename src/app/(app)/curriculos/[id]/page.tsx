import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CurriculumDetail } from "./curriculum-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CurriculumDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: subject } = await supabase
    .from("curriculum_subjects")
    .select("*")
    .eq("id", id)
    .single();

  if (!subject) notFound();

  // Cargar competencias con criterios
  const { data: competencies } = await supabase
    .from("curriculum_competencies")
    .select("id, code, description, sort_order")
    .eq("subject_id", id)
    .order("sort_order");

  const compIds = (competencies || []).map((c) => c.id);
  const { data: criteria } = compIds.length > 0
    ? await supabase
        .from("curriculum_criteria")
        .select("id, competency_id, code, full_code, description, descriptors, sort_order")
        .in("competency_id", compIds)
        .order("sort_order")
    : { data: [] };

  // Agrupar criterios por competencia
  type CriterionRow = NonNullable<typeof criteria>[number];
  const criteriaByComp = new Map<string, CriterionRow[]>();
  for (const cr of criteria || []) {
    if (!criteriaByComp.has(cr.competency_id)) {
      criteriaByComp.set(cr.competency_id, []);
    }
    criteriaByComp.get(cr.competency_id)!.push(cr);
  }

  const competenciesWithCriteria = (competencies || []).map((comp) => ({
    ...comp,
    criteria: criteriaByComp.get(comp.id) || [],
  }));

  const stageLabels: Record<string, string> = {
    infantil: "Infantil",
    primaria: "Primaria",
    eso: "ESO",
    bachillerato: "Bachillerato",
    fp: "FP",
    adultos: "Adultos/ESPA",
  };

  const totalCriteria = (criteria || []).length;

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto w-full mb-20">
      <Link
        href="/curriculos"
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-8"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Volver a currículos
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">
          {subject.subject_name}
        </h2>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary-fixed text-on-primary-fixed uppercase tracking-widest">
            {stageLabels[subject.stage] || subject.stage}
          </span>
          {subject.course && (
            <span className="text-sm text-on-surface-variant">{subject.course}</span>
          )}
          <span className="text-sm text-on-surface-variant">
            {competenciesWithCriteria.length} competencias · {totalCriteria} criterios
          </span>
          {subject.source_filename && (
            <span className="text-xs text-on-surface-variant">
              📄 {subject.source_filename}
            </span>
          )}
        </div>
      </div>

      <CurriculumDetail
        subjectId={id}
        competencies={competenciesWithCriteria}
      />
    </div>
  );
}
