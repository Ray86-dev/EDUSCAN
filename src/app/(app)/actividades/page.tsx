import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { IconArrowRight } from "@/components/icons";

export default async function GlobalActivitiesPage() {
  const supabase = await createClient();

  // Obtener todos los grupos del usuario
  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, stage, subject")
    .order("name");

  // Obtener todas las actividades
  const groupIds = (groups || []).map((g) => g.id);
  const { data: activities } = groupIds.length > 0
    ? await supabase
        .from("activities")
        .select("id, group_id, title, description, criteria_codes, created_at")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Agrupar actividades por grupo
  const groupMap = new Map<string, typeof groups extends (infer T)[] | null ? T : never>();
  for (const g of groups || []) {
    groupMap.set(g.id, g);
  }

  const stageLabels: Record<string, string> = {
    infantil: "Infantil",
    primaria: "Primaria",
    eso: "ESO",
    bachillerato: "Bachillerato",
    fp: "FP",
    adultos: "Adultos",
  };

  // Agrupar actividades por group_id
  const activitiesByGroup = new Map<string, typeof activities>();
  for (const a of activities || []) {
    const list = activitiesByGroup.get(a.group_id) || [];
    list.push(a);
    activitiesByGroup.set(a.group_id, list);
  }

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">
          Actividades
        </h2>
        <p className="text-on-surface-variant mt-1">
          Todas las actividades de evaluación de tus grupos.
        </p>
      </div>

      {(activities || []).length > 0 ? (
        <div className="space-y-8">
          {(groups || []).filter((g) => activitiesByGroup.has(g.id)).map((group) => (
            <div key={group.id}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-headline font-bold text-on-surface">
                  {group.name}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed uppercase tracking-wide">
                  {stageLabels[group.stage] || group.stage}
                </span>
              </div>
              <div className="space-y-2">
                {(activitiesByGroup.get(group.id) || []).map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/grupos/${group.id}/actividades/${activity.id}`}
                    className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-xl hover:bg-surface-container transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-on-surface truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {activity.criteria_codes && activity.criteria_codes.length > 0 && (
                          <span className="text-xs text-on-surface-variant">
                            {activity.criteria_codes.length} criterios
                          </span>
                        )}
                        <span className="text-xs text-on-surface-variant">
                          {new Date(activity.created_at).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                    <IconArrowRight size={18} className="text-on-surface-variant/40 group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-outline-variant rounded-xl p-10 text-center">
          <span className="material-symbols-outlined text-on-surface-variant/40 text-4xl mb-3 block">assignment</span>
          <p className="font-headline font-bold text-on-surface mb-1">
            No hay actividades creadas
          </p>
          <p className="text-sm text-on-surface-variant mb-4">
            Crea actividades desde la página de cada grupo.
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
