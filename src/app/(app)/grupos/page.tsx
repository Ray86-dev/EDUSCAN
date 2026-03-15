import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GroupActions } from "./group-actions";

interface Group {
  id: string;
  name: string;
  stage: string;
  course: string | null;
  subject: string | null;
  subject_code: string | null;
  created_at: string;
  student_count: number;
}

const STAGE_LABELS: Record<string, string> = {
  infantil: "Infantil",
  primaria: "Primaria",
  eso: "ESO",
  bachillerato: "Bachillerato",
  fp: "FP",
  adultos: "Adultos",
};

const STAGE_COLORS: Record<string, { border: string; text: string }> = {
  infantil: { border: "border-tertiary", text: "text-tertiary" },
  primaria: { border: "border-secondary", text: "text-secondary" },
  eso: { border: "border-primary", text: "text-primary" },
  bachillerato: { border: "border-primary", text: "text-primary" },
  fp: { border: "border-tertiary", text: "text-tertiary" },
  adultos: { border: "border-secondary", text: "text-secondary" },
};

export default async function GruposPage() {
  const supabase = await createClient();

  // Fetch groups with student counts
  const { data: groups } = await supabase
    .from("groups")
    .select("*, students(count)")
    .order("created_at", { ascending: false });

  const groupsWithCount: Group[] = (groups || []).map((g) => ({
    id: g.id,
    name: g.name,
    stage: g.stage,
    course: g.course,
    subject: g.subject,
    subject_code: g.subject_code,
    created_at: g.created_at,
    student_count: (g.students as unknown as { count: number }[])?.[0]?.count || 0,
  }));

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto w-full mb-20">
      {/* Hero */}
      <section className="mb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-5xl font-headline font-extrabold text-primary mb-2 tracking-tight">
              Grupos
            </h2>
            <p className="text-on-surface-variant">
              Gestiona tus aulas y alumnos con serenidad.
            </p>
          </div>
        </div>
      </section>

      <GroupActions groups={groupsWithCount} stageLabels={STAGE_LABELS} stageColors={STAGE_COLORS} />
    </div>
  );
}
