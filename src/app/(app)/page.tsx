export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-10">
      {/* Welcome Section */}
      <section className="mb-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
        <div className="md:col-span-8">
          <p className="text-primary font-medium mb-2 tracking-wide text-sm">
            BIENVENIDO DE NUEVO
          </p>
          <h2 className="text-5xl md:text-6xl font-headline font-extrabold text-on-surface tracking-tight leading-tight">
            Tu espacio de <br />
            <span className="text-primary italic">enfoque.</span>
          </h2>
        </div>
        <div className="md:col-span-4 pb-2">
          <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-primary shadow-sm">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Hoy tienes 12 exámenes pendientes por corregir. El ambiente está
              tranquilo para empezar.
            </p>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Exams to grade */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-headline font-bold text-on-surface">
              Exámenes por corregir
            </h3>
            <button className="text-primary text-sm font-semibold hover:underline">
              Ver todos
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exam Card 1 */}
            <ExamCard
              title="Biología - Genética"
              group="4º ESO B"
              groupColor="primary"
              progress={72}
              current={18}
              total={25}
            />
            {/* Exam Card 2 */}
            <ExamCard
              title="Lengua Castellana"
              group="3º ESO C"
              groupColor="secondary"
              progress={5}
              current={0}
              total={30}
              label="Listo para calificar"
              accentColor="tertiary"
            />

            {/* Zen Mode Card */}
            <div className="md:col-span-2 group bg-surface-container-lowest p-6 rounded-xl transition-all hover:bg-surface-container hover:shadow-xl flex flex-col md:flex-row gap-6 items-center">
              <div className="h-24 w-24 bg-primary-container rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-primary-container text-4xl">
                  auto_awesome
                </span>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="font-headline font-bold text-xl mb-1">
                  Modo Enfoque
                </h4>
                <p className="text-sm text-on-surface-variant mb-4">
                  Elimina distracciones y concéntrate en la corrección.
                </p>
                <button className="px-6 py-2 bg-primary text-on-primary rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors min-h-[44px]">
                  Activar Zen Mode
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Schedule */}
        <div className="space-y-8">
          <h3 className="text-2xl font-headline font-bold text-on-surface">
            Próximas fechas
          </h3>
          <div className="bg-surface-container-low rounded-2xl p-6 space-y-6">
            <DateItem month="Mar" day={18} title="Cierre de Actas Trimestrales" subtitle="Secretaría del centro" />
            <DateItem month="Mar" day={22} title="Examen Final: Biología" subtitle="Aula 204 · 09:00" />
            <DateItem month="Abr" day={2} title="Reunión de Departamento" subtitle="Virtual · Meet" />

            <button className="w-full py-3 bg-secondary-container text-on-secondary-container rounded-xl font-bold text-sm hover:bg-secondary-container/80 transition-colors mt-4 min-h-[44px]">
              Añadir Recordatorio
            </button>
          </div>

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

function ExamCard({
  title,
  group,
  groupColor = "primary",
  progress,
  current,
  total,
  label = "Progreso",
  accentColor = "primary",
}: {
  title: string;
  group: string;
  groupColor?: string;
  progress: number;
  current: number;
  total: number;
  label?: string;
  accentColor?: string;
}) {
  const accentClasses: Record<string, string> = {
    primary: "bg-primary",
    tertiary: "bg-tertiary",
    secondary: "bg-secondary",
  };
  const tagClasses: Record<string, string> = {
    primary: "bg-primary-fixed text-on-primary-fixed",
    secondary: "bg-secondary-fixed text-on-secondary-fixed",
    tertiary: "bg-tertiary-fixed text-on-tertiary-fixed",
  };

  return (
    <div className="group bg-surface-container-lowest p-6 rounded-xl transition-all hover:bg-surface-container hover:shadow-xl relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${accentClasses[accentColor]}`} />
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="font-headline font-bold text-lg mb-1">{title}</h4>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${tagClasses[groupColor]}`}>
            {group}
          </span>
        </div>
        <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">
          grading
        </span>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between text-xs text-on-surface-variant">
          <span>{label}</span>
          <span className="font-bold">
            {current} / {total}
          </span>
        </div>
        <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${accentClasses[accentColor]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function DateItem({
  month,
  day,
  title,
  subtitle,
}: {
  month: string;
  day: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 bg-surface-container-lowest rounded-lg flex flex-col items-center justify-center shrink-0 shadow-sm">
        <span className="text-[10px] font-bold text-primary uppercase">{month}</span>
        <span className="text-xl font-headline font-extrabold leading-none">{day}</span>
      </div>
      <div>
        <h5 className="font-bold text-sm">{title}</h5>
        <p className="text-xs text-on-surface-variant">{subtitle}</p>
      </div>
    </div>
  );
}
