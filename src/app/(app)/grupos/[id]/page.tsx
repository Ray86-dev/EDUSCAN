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

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto w-full mb-20">
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

      <StudentActions groupId={id} students={students || []} />
    </div>
  );
}
