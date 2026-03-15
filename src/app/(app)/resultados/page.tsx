export default function ResultadosPage() {
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
              Resumen analítico del grupo 4º ESO B - Biología
            </p>
          </div>
          <button className="flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/10 min-h-[44px]">
            <span className="material-symbols-outlined text-xl">download</span>
            <span>Exportar datos</span>
          </button>
        </div>
      </section>

      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Key Metrics */}
        <div className="md:col-span-4 grid grid-cols-1 gap-6">
          {/* Average */}
          <div className="bg-surface-container-low p-8 rounded-xl border-l-4 border-primary">
            <span className="text-on-surface-variant text-sm font-medium tracking-wider uppercase">
              Media del grupo
            </span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-headline text-5xl font-light">7.4</span>
              <span className="text-on-surface-variant">/ 10</span>
            </div>
            <div className="mt-4 flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span className="text-xs">+0.5 vs examen anterior</span>
            </div>
          </div>

          {/* Pass rate */}
          <div className="bg-surface-container-low p-8 rounded-xl border-l-4 border-secondary">
            <span className="text-on-surface-variant text-sm font-medium tracking-wider uppercase">
              Porcentaje de aprobados
            </span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-headline text-5xl font-light">88%</span>
            </div>
            <div className="mt-6 h-1 w-full bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full" style={{ width: "88%" }} />
            </div>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/20 shadow-sm">
          <h3 className="font-headline text-xl mb-12">Distribución de notas</h3>
          <div className="flex items-end justify-between h-48 gap-4 px-4">
            <DistributionBar label="0-2" height={10} />
            <DistributionBar label="2-4" height={15} />
            <DistributionBar label="4-6" height={45} color="bg-primary-fixed" />
            <DistributionBar label="6-8" height={75} color="bg-primary-container" />
            <DistributionBar label="8-10" height={60} color="bg-primary" />
          </div>
        </div>

        {/* Progress Analysis */}
        <div className="md:col-span-12 mt-4">
          <div className="bg-surface-container-low rounded-xl overflow-hidden">
            <div className="px-8 py-10 flex flex-col md:flex-row items-center gap-12">
              {/* Donut Chart */}
              <div className="flex-shrink-0 relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-surface-container-highest"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="2"
                  />
                  <path
                    className="stroke-primary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeDasharray="75, 100"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-headline text-3xl font-light">75%</span>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Ritmo
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <h4 className="font-headline text-2xl font-light">Análisis de Progreso</h4>
                <p className="text-on-surface-variant font-light leading-relaxed">
                  El grupo muestra una consolidación en los conceptos fundamentales de
                  genética. Se recomienda reforzar la sección de metabolismo celular,
                  donde el 40% de los alumnos ha mostrado dificultades menores. El
                  tiempo de respuesta medio ha sido de 42 minutos por examen.
                </p>
                <div className="pt-2 flex gap-4">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span>Objetivos alcanzados</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-tertiary" />
                    <span>En seguimiento</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DistributionBar({
  label,
  height,
  color = "bg-surface-container",
}: {
  label: string;
  height: number;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center flex-1 gap-4">
      <div
        className={`w-full ${color} rounded-t-lg transition-all hover:bg-primary-fixed-dim`}
        style={{ height: `${height}%` }}
      />
      <span className="text-xs text-on-surface-variant">{label}</span>
    </div>
  );
}
