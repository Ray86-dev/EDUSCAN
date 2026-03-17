import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { checkDailyLimit } from "@/lib/usage";
import { IconCameraExam, IconCorrectionsTotal, IconToday, IconArrowRight, IconArrowForward, IconEmpty, IconCurriculum } from "@/components/icons";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "docente";

  // Uso diario
  const usage = user ? await checkDailyLimit(supabase, user.id) : { used: 0, limit: 2, allowed: true };

  // Correcciones recientes
  const { data: recentCorrections } = await supabase
    .from("corrections")
    .select("id, grade, grade_label, created_at, is_reviewed")
    .order("created_at", { ascending: false })
    .limit(5);

  // Total de correcciones
  const { count: totalCorrections } = await supabase
    .from("corrections")
    .select("*", { count: "exact", head: true });

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-6 md:py-10">
      {/* Welcome Section */}
      <section className="mb-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
        <div className="md:col-span-8">
          <p className="text-primary font-medium mb-2 tracking-wide text-sm">
            BIENVENIDO DE NUEVO, {userName.toUpperCase()}
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-headline font-extrabold text-on-surface tracking-tight leading-tight">
            Tu espacio de <br />
            <span className="text-primary italic">enfoque.</span>
          </h2>
        </div>
        <div className="md:col-span-4 pb-2">
          <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-primary shadow-sm">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Has utilizado <strong>{usage.used} de {usage.limit === Infinity ? "∞" : usage.limit}</strong> correcciones hoy.
              {usage.allowed
                ? " El ambiente está tranquilo para empezar."
                : " Has alcanzado el límite diario."}
            </p>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recent corrections + CTA */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-headline font-bold text-on-surface">
              Correcciones recientes
            </h3>
            <Link href="/resultados" className="text-primary text-sm font-semibold hover:underline">
              Ver todas
            </Link>
          </div>

          {recentCorrections && recentCorrections.length > 0 ? (
            <div className="space-y-3">
              {recentCorrections.map((c) => (
                <Link
                  key={c.id}
                  href={`/resultados/${c.id}`}
                  className="flex items-center justify-between bg-surface-container-lowest p-5 rounded-xl hover:bg-surface-container transition-all group relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    c.grade >= 5 ? "bg-primary" : "bg-error"
                  }`} />
                  <div className="flex items-center gap-4 pl-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      c.grade >= 5 ? "bg-primary-fixed" : "bg-error-container"
                    }`}>
                      <span className={`font-headline font-bold text-lg ${
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
            <div className="bg-surface-container-lowest p-8 rounded-xl text-center">
              <IconEmpty size={48} className="text-on-surface-variant/50 mb-3 mx-auto block" />
              <p className="text-on-surface-variant text-sm mb-4">
                Aún no has realizado ninguna corrección.
              </p>
              <Link
                href="/corregir"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors min-h-[44px]"
              >
                Corregir mi primer examen
              </Link>
            </div>
          )}

          {/* CTA Corregir */}
          <Link
            href="/corregir"
            className="flex items-center gap-6 bg-surface-container-lowest p-6 rounded-xl transition-all hover:bg-surface-container hover:shadow-xl group"
          >
            <div className="h-20 w-20 bg-primary-container rounded-xl flex items-center justify-center shrink-0">
              <IconCameraExam size={40} className="text-on-primary-container" />
            </div>
            <div className="flex-1">
              <h4 className="font-headline font-bold text-xl mb-1">
                Nueva corrección
              </h4>
              <p className="text-sm text-on-surface-variant">
                Sube una foto de un examen manuscrito y obtén la corrección en segundos.
              </p>
            </div>
            <IconArrowForward size={28} className="text-primary/40 group-hover:text-primary transition-colors" />
          </Link>
        </div>

        {/* Right: Stats */}
        <div className="space-y-8">
          <h3 className="text-2xl font-headline font-bold text-on-surface">
            Resumen
          </h3>

          <div className="bg-surface-container-low rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-fixed rounded-lg flex items-center justify-center">
                <IconCorrectionsTotal size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-headline font-extrabold">{totalCorrections || 0}</p>
                <p className="text-xs text-on-surface-variant">Correcciones totales</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary-fixed rounded-lg flex items-center justify-center">
                  <IconToday size={24} className="text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-headline font-extrabold">
                    {usage.used} de {usage.limit === Infinity ? "∞" : usage.limit}
                  </p>
                  <p className="text-xs text-on-surface-variant">Correcciones hoy</p>
                </div>
              </div>
              {usage.limit !== Infinity && (
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usage.used >= usage.limit ? "bg-error" : "bg-primary"
                    }`}
                    style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            <Link
              href="/corregir"
              className="block w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors min-h-[44px]"
            >
              Corregir examen
            </Link>
          </div>

          {/* Currículos shortcut */}
          <Link
            href="/curriculos"
            className="flex items-center gap-4 bg-surface-container-lowest p-5 rounded-xl hover:bg-surface-container transition-all group"
          >
            <div className="w-12 h-12 bg-tertiary-container rounded-lg flex items-center justify-center shrink-0">
              <IconCurriculum size={24} className="text-on-tertiary-container" />
            </div>
            <div className="flex-1">
              <h4 className="font-headline font-bold text-sm">Currículos</h4>
              <p className="text-xs text-on-surface-variant">
                Gestiona criterios de evaluación LOMLOE
              </p>
            </div>
            <IconArrowRight size={20} className="text-on-surface-variant/40 group-hover:text-primary transition-colors" />
          </Link>

          {/* Quote */}
          <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <p className="text-on-surface font-headline text-lg font-bold leading-tight">
                &ldquo;La educación es el encendido de una llama.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
