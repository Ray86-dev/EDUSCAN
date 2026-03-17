import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/get-user";
import { IconArrowRight, IconEmpty } from "@/components/icons";
import { Greeting } from "@/components/Greeting";

export default async function DashboardPage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "docente";

  // Correcciones recientes
  const { data: recentCorrections } = await supabase
    .from("corrections")
    .select("id, grade, grade_label, created_at, is_reviewed")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="max-w-2xl mx-auto w-full px-6 py-6 md:py-10">
      <section className="mb-8">
        <Greeting name={userName} />
      </section>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-headline font-bold text-on-surface">
            Correcciones recientes
          </h3>
          {recentCorrections && recentCorrections.length > 0 && (
            <Link href="/resultados" className="text-primary text-sm font-semibold hover:underline">
              Ver todas
            </Link>
          )}
        </div>

        {recentCorrections && recentCorrections.length > 0 ? (
          <div className="space-y-3">
            {recentCorrections.map((c) => (
              <Link
                key={c.id}
                href={`/resultados/${c.id}`}
                className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-xl hover:bg-surface-container transition-colors group relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  c.grade >= 5 ? "bg-primary" : "bg-error"
                }`} />
                <div className="flex items-center gap-4 pl-3">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                    c.grade >= 5 ? "bg-primary-fixed" : "bg-error-container"
                  }`}>
                    <span className={`font-headline font-bold text-base ${
                      c.grade >= 5 ? "text-primary" : "text-error"
                    }`}>
                      {c.grade?.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{c.grade_label}</p>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(c.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.is_reviewed && (
                    <span className="text-xs font-medium px-2 py-1 bg-primary-fixed text-on-primary-fixed rounded-full">
                      Revisado
                    </span>
                  )}
                  <IconArrowRight size={20} className="text-on-surface-variant/40 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-lowest p-10 rounded-xl text-center">
            <IconEmpty size={48} className="text-on-surface-variant/40 mb-4 mx-auto block" />
            <p className="text-on-surface-variant text-sm mb-5">
              Aún no has corregido ningún examen.
            </p>
            <Link
              href="/corregir"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors min-h-[44px] shadow-md shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              Corregir mi primer examen
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
