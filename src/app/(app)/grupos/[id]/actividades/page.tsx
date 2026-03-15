import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActivityActions } from "./activity-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ActivitiesPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, stage, subject")
    .eq("id", id)
    .single();

  if (!group) notFound();

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("group_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto w-full mb-20">
      <Link
        href={`/grupos/${id}`}
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-8"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Volver a {group.name}
      </Link>

      <div className="mb-8">
        <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">
          Actividades
        </h2>
        <p className="text-on-surface-variant mt-1">
          Define actividades con criterios de evaluación para correcciones criteriales.
        </p>
      </div>

      <ActivityActions groupId={id} activities={activities || []} groupStage={group.stage} groupSubject={group.subject} />
    </div>
  );
}
