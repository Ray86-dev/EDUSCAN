import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ResultadosPage() {
  const supabase = await createClient();

  const { data: corrections } = await supabase
    .from("corrections")
    .select("id, grade, grade_label, ai_confidence, is_reviewed, created_at")
    .order("created_at", { ascending: false });

  // Calcular stats
  const grades = corrections?.map((c) => c.grade).filter((g) => g !== null) || [];
  const average = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
  const passRate = grades.length > 0 ? (grades.filter((g) => g >= 5).length / grades.length) * 100 : 0;

  // Distribución
  const distribution = [
    { label: "0-2", count: grades.filter((g) => g < 2).length },
    { label: "2-4", count: grades.filter((g) => g >= 2 && g < 4).length },
    { label: "4-6", count: grades.filter((g) => g >= 4 && g < 6).length },
    { label: "6-8", count: grades.filter((g) => g >= 6 && g < 8).length },
    { label: "8-10", count: grades.filter((g) => g >= 8).length },
  ];
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);
  const barColors = [
    "bg-surface-container",
    "bg-surface-container",
    "bg-primary-fixed",
    "bg-primary-container",
    "bg-primary",
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 pt-12 pb-32">
      {/* Hero */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="font-headline text-6xl font-light tracking-tighter text-primary mb-2">
              Resultados
            </h2>
            <p className="text-on-surface-variant font-light text-lg">
              {corrections?.length || 0} correcciones realizadas
            </p>
          </div>
        </div>
      </section>

      {corrections && corrections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Key Metrics */}
          <div className="md:col-span-4 grid grid-cols-1 gap-6">
            <div className="bg-surface-container-low p-8 rounded-xl border-l-4 border-primary">
              <span className="text-on-surface-variant text-sm font-medium tracking-wider uppercase">
                Media global
              </span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-headline text-5xl font-light">
                  {average.toFixed(1)}
                </span>
                <span className="text-on-surface-variant">/ 10</span>
              </div>
            </div>

            <div className="bg-surface-container-low p-8 rounded-xl border-l-4 border-secondary">
              <span className="text-on-surface-variant text-sm font-medium tracking-wider uppercase">
                Porcentaje de aprobados
              </span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-headline text-5xl font-light">
                  {passRate.toFixed(0)}%
                </span>
              </div>
              <div className="mt-6 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full"
                  style={{ width: `${passRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/20 shadow-sm">
            <h3 className="font-headline text-xl mb-12">Distribución de notas</h3>
            <div className="flex items-end justify-between h-48 gap-4 px-4">
              {distribution.map((d, i) => (
                <div key={d.label} className="flex flex-col items-center flex-1 gap-4">
                  <div
                    className={`w-full ${barColors[i]} rounded-t-lg transition-all hover:bg-primary-fixed-dim`}
                    style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? "8px" : "0" }}
                  />
                  <div className="text-center">
                    <span className="text-xs text-on-surface-variant block">{d.label}</span>
                    <span className="text-xs font-bold">{d.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Corrections List */}
          <div className="md:col-span-12 space-y-3">
            <h3 className="font-headline text-xl font-bold mb-4">Historial</h3>
            {corrections.map((c) => (
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
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    c.ai_confidence === "alta"
                      ? "bg-primary-fixed text-on-primary-fixed"
                      : c.ai_confidence === "media"
                      ? "bg-tertiary-fixed text-on-tertiary-fixed"
                      : "bg-error-container text-on-error-container"
                  }`}>
                    {c.ai_confidence}
                  </span>
                  {c.is_reviewed && (
                    <span className="text-xs font-medium px-2 py-1 bg-primary-fixed text-on-primary-fixed rounded-full">
                      Revisado
                    </span>
                  )}
                  <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors">
                    arrow_forward_ios
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4 block">
            analytics
          </span>
          <h3 className="text-xl font-headline font-bold text-on-surface-variant mb-2">
            Sin resultados aún
          </h3>
          <p className="text-on-surface-variant mb-6">
            Realiza tu primera corrección para ver las estadísticas aquí.
          </p>
          <Link
            href="/corregir"
            className="inline-flex px-8 py-3 bg-primary text-on-primary font-bold rounded-xl min-h-[44px]"
          >
            Corregir examen
          </Link>
        </div>
      )}
    </div>
  );
}
