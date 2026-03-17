import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentActions } from "./student-actions";
import { ExportButtons } from "../../resultados/export-buttons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .single();

  if (!group) notFound();

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("group_id", id)
    .order("list_number", { ascending: true, nullsFirst: false })
    .order("first_surname", { ascending: true });

  // Obtener la corrección más reciente de cada alumno
  const studentIds = (students || []).map((s) => s.id);
  const { data: corrections } = studentIds.length > 0
    ? await supabase
        .from("corrections")
        .select("id, student_id, grade, grade_label, is_reviewed, ai_confidence, created_at")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const gradesByStudent = new Map<string, {
    correctionId: string;
    grade: number;
    gradeLabel: string;
    isReviewed: boolean;
    aiConfidence: string | null;
  }>();
  for (const c of corrections || []) {
    if (c.student_id && !gradesByStudent.has(c.student_id)) {
      gradesByStudent.set(c.student_id, {
        correctionId: c.id,
        grade: c.grade,
        gradeLabel: c.grade_label,
        isReviewed: c.is_reviewed,
        aiConfidence: c.ai_confidence,
      });
    }
  }

  // Estadísticas del grupo
  const gradedStudents = Array.from(gradesByStudent.values());
  const gradedCount = gradedStudents.length;
  const totalStudents = (students || []).length;
  const avgGrade = gradedCount > 0
    ? gradedStudents.reduce((sum, s) => sum + s.grade, 0) / gradedCount
    : null;
  const passCount = gradedStudents.filter((s) => s.grade >= 5).length;
  const passRate = gradedCount > 0 ? Math.round((passCount / gradedCount) * 100) : null;

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto w-full">
      {/* Back */}
      <Link
        href="/grupos"
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-8"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Volver a grupos
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">
              {group.name}
            </h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary-fixed text-on-primary-fixed uppercase tracking-widest">
                {group.stage}
              </span>
              {group.subject && (
                <span className="text-sm text-on-surface-variant">
                  {group.subject}
                  {group.subject_code ? ` (${group.subject_code})` : ""}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/corregir/sesion/${id}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all min-h-[44px] text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">grading</span>
              Corregir grupo
            </Link>
            <Link
              href={`/grupos/${id}/actividades`}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary-container text-on-secondary-container rounded-xl hover:bg-secondary-container/80 transition-all min-h-[44px] text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">assignment</span>
              Actividades
            </Link>
            <ExportButtons groupId={id} groupName={group.name} />
          </div>
        </div>
      </div>

      {/* Stats dashboard */}
      {gradedCount > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-surface-container-low rounded-xl p-5 text-center">
            <p className="text-3xl font-headline font-extrabold text-on-surface">
              {avgGrade !== null ? avgGrade.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">Nota media</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-5 text-center">
            <p className="text-3xl font-headline font-extrabold text-on-surface">
              {passRate !== null ? `${passRate}%` : "—"}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">Aprobados</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-5 text-center">
            <p className="text-3xl font-headline font-extrabold text-on-surface">
              {gradedCount}/{totalStudents}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">Corregidos</p>
          </div>
        </div>
      )}

      <StudentActions groupId={id} students={students || []} gradesByStudent={gradesByStudent} />
    </div>
  );
}
