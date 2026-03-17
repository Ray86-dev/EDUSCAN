import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGradeLabel } from "@/lib/utils/grade-label";
import { getGradeColorClasses } from "@/lib/utils/grade-colors";
import { ActivityStudentList } from "./activity-student-list";

interface PageProps {
  params: Promise<{ id: string; activityId: string }>;
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const { id, activityId } = await params;
  const supabase = await createClient();

  // Fetch group
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, stage, subject")
    .eq("id", id)
    .single();

  if (!group) notFound();

  // Fetch activity
  const { data: activity } = await supabase
    .from("activities")
    .select("*")
    .eq("id", activityId)
    .eq("group_id", id)
    .single();

  if (!activity) notFound();

  // Fetch students in the group
  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("group_id", id)
    .order("list_number", { ascending: true, nullsFirst: false })
    .order("first_surname", { ascending: true });

  // Fetch corrections for this activity
  const studentIds = (students || []).map((s) => s.id);
  const { data: corrections } = studentIds.length > 0
    ? await supabase
        .from("corrections")
        .select("id, student_id, grade, grade_label, is_reviewed, created_at")
        .eq("activity_id", activityId)
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Build grades map (most recent correction per student)
  const gradesByStudent = new Map<string, {
    correctionId: string;
    grade: number;
    gradeLabel: string;
    isReviewed: boolean;
  }>();
  for (const c of corrections || []) {
    if (c.student_id && !gradesByStudent.has(c.student_id)) {
      gradesByStudent.set(c.student_id, {
        correctionId: c.id,
        grade: c.grade,
        gradeLabel: c.grade_label,
        isReviewed: c.is_reviewed,
      });
    }
  }

  // Stats
  const totalStudents = (students || []).length;
  const gradedStudents = Array.from(gradesByStudent.values());
  const gradedCount = gradedStudents.length;
  const avgGrade = gradedCount > 0
    ? gradedStudents.reduce((sum, s) => sum + s.grade, 0) / gradedCount
    : null;
  const passCount = gradedStudents.filter((s) => s.grade >= 5).length;
  const passRate = gradedCount > 0 ? Math.round((passCount / gradedCount) * 100) : null;

  // Distribution by tier
  const tiers = { green: 0, orange: 0, red: 0, gray: totalStudents - gradedCount };
  for (const s of gradedStudents) {
    if (s.grade >= 7) tiers.green++;
    else if (s.grade >= 5) tiers.orange++;
    else tiers.red++;
  }

  // Serialize grades map for client component
  const gradesRecord: Record<string, {
    correctionId: string;
    grade: number;
    gradeLabel: string;
    isReviewed: boolean;
  }> = {};
  for (const [k, v] of gradesByStudent) {
    gradesRecord[k] = v;
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto w-full">
      {/* Back */}
      <Link
        href={`/grupos/${id}/actividades`}
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-8"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Volver a {group.name}
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">
          {activity.title}
        </h2>
        {activity.description && (
          <p className="text-on-surface-variant mt-1">{activity.description}</p>
        )}
        {activity.criteria_codes && activity.criteria_codes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {activity.criteria_codes.map((code: string) => (
              <span
                key={code}
                className="text-xs font-medium px-2 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-full"
              >
                {code}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface-container-low rounded-xl p-4 text-center">
          <p className="text-2xl font-headline font-extrabold text-on-surface">
            {avgGrade !== null ? avgGrade.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">Media</p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-4 text-center">
          <p className="text-2xl font-headline font-extrabold text-on-surface">
            {passRate !== null ? `${passRate}%` : "—"}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">Aprobados</p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-4 text-center">
          <p className="text-2xl font-headline font-extrabold text-on-surface">
            {gradedCount}/{totalStudents}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">Corregidos</p>
        </div>
      </div>

      {/* Distribution bar */}
      {totalStudents > 0 && (
        <div className="mb-8">
          <div className="flex rounded-full overflow-hidden h-3">
            {tiers.green > 0 && (
              <div
                className="bg-primary transition-[width]"
                style={{ width: `${(tiers.green / totalStudents) * 100}%` }}
                title={`7-10: ${tiers.green}`}
              />
            )}
            {tiers.orange > 0 && (
              <div
                className="bg-warning transition-[width]"
                style={{ width: `${(tiers.orange / totalStudents) * 100}%` }}
                title={`5-6.99: ${tiers.orange}`}
              />
            )}
            {tiers.red > 0 && (
              <div
                className="bg-error transition-[width]"
                style={{ width: `${(tiers.red / totalStudents) * 100}%` }}
                title={`<5: ${tiers.red}`}
              />
            )}
            {tiers.gray > 0 && (
              <div
                className="bg-outline-variant transition-[width]"
                style={{ width: `${(tiers.gray / totalStudents) * 100}%` }}
                title={`Sin corregir: ${tiers.gray}`}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
              7-10: {tiers.green}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" />
              5-6.99: {tiers.orange}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-error inline-block" />
              &lt;5: {tiers.red}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-outline-variant inline-block" />
              Sin corregir: {tiers.gray}
            </span>
          </div>
        </div>
      )}

      {/* Student list */}
      <ActivityStudentList
        students={students || []}
        grades={gradesRecord}
      />
    </div>
  );
}
