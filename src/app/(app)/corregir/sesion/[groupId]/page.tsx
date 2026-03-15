import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionFlow } from "./session-flow";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function BatchCorrectionPage({ params }: PageProps) {
  const { groupId } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (!group) notFound();

  const { data: students } = await supabase
    .from("students")
    .select("id, list_number, first_surname, second_surname, name")
    .eq("group_id", groupId)
    .order("list_number", { ascending: true, nullsFirst: false })
    .order("first_surname", { ascending: true });

  // Obtener actividades del grupo
  const { data: activities } = await supabase
    .from("activities")
    .select("id, title, criteria_codes")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  // Obtener correcciones existentes para estos alumnos
  const studentIds = (students || []).map((s) => s.id);
  const { data: existingCorrections } = studentIds.length > 0
    ? await supabase
        .from("corrections")
        .select("id, student_id, grade, grade_label, created_at")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Map: solo la corrección más reciente por alumno
  const latestByStudent = new Map<string, { id: string; grade: number; grade_label: string }>();
  for (const c of existingCorrections || []) {
    if (c.student_id && !latestByStudent.has(c.student_id)) {
      latestByStudent.set(c.student_id, { id: c.id, grade: c.grade, grade_label: c.grade_label });
    }
  }

  const studentsWithStatus = (students || []).map((s) => {
    const existing = latestByStudent.get(s.id);
    return {
      ...s,
      correctionId: existing?.id || null,
      grade: existing?.grade ?? null,
      gradeLabel: existing?.grade_label ?? null,
    };
  });

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto w-full mb-20">
      <Link
        href={`/grupos/${groupId}`}
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-6"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Volver a {group.name}
      </Link>

      <div className="mb-8">
        <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">
          Corregir {group.name}
        </h2>
        <p className="text-on-surface-variant mt-1">
          Selecciona un alumno y sube su examen para corregirlo.
        </p>
      </div>

      <SessionFlow groupId={groupId} groupName={group.name} students={studentsWithStatus} activities={activities || []} />
    </div>
  );
}
