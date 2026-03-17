import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { IconArrowRight } from "@/components/icons";

export default async function CorregirGrupoPage() {
  const supabase = await createClient();

  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, stage, subject, students(count)")
    .order("name");

  const studentCountByGroup = new Map<string, number>();
  for (const g of groups || []) {
    studentCountByGroup.set(g.id, (g.students as unknown as { count: number }[])?.[0]?.count || 0);
  }

  const stageLabels: Record<string, string> = {
    infantil: "Infantil",
    primaria: "Primaria",
    eso: "ESO",
    bachillerato: "Bachillerato",
    fp: "FP",
    adultos: "Adultos",
  };

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">
          Corregir grupo
        </h2>
        <p className="text-on-surface-variant mt-1">
          Selecciona el grupo para iniciar la sesión de corrección.
        </p>
      </div>

      {groups && groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/corregir/sesion/${group.id}`}
              className="flex items-center justify-between bg-surface-container-lowest p-5 rounded-xl border-l-4 border-primary hover:bg-surface-container transition-colors group"
            >
              <div>
                <h3 className="font-headline font-bold text-on-surface">
                  {group.name}
                </h3>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed uppercase tracking-wide">
                    {stageLabels[group.stage] || group.stage}
                  </span>
                  {group.subject && (
                    <span className="text-xs text-on-surface-variant">{group.subject}</span>
                  )}
                  <span className="text-xs text-on-surface-variant">
                    {studentCountByGroup.get(group.id) || 0} alumnos
                  </span>
                </div>
              </div>
              <IconArrowRight size={20} className="text-on-surface-variant/40 group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-outline-variant rounded-xl p-10 text-center">
          <span className="material-symbols-outlined text-on-surface-variant/40 text-4xl mb-3 block">group_add</span>
          <p className="font-headline font-bold text-on-surface mb-1">
            No tienes grupos creados
          </p>
          <p className="text-sm text-on-surface-variant mb-4">
            Crea un grupo con alumnos para corregir en lote.
          </p>
          <Link
            href="/grupos"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors min-h-[44px]"
          >
            Ir a Grupos
          </Link>
        </div>
      )}
    </div>
  );
}
