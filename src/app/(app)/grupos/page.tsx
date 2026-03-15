export default function GruposPage() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto w-full">
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
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl hover:bg-primary-container transition-all shadow-sm min-h-[44px]">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="font-label font-medium">Nuevo Grupo</span>
          </button>
        </div>
      </section>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Group Card 1: Large */}
        <div className="md:col-span-8 group relative overflow-hidden bg-surface-container-lowest p-8 rounded-xl border-l-4 border-primary transition-all hover:shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-label uppercase tracking-widest text-secondary font-bold mb-2 block">
                Bachillerato
              </span>
              <h3 className="text-3xl font-headline font-bold text-on-surface mb-1">
                2º Bachillerato A
              </h3>
              <p className="text-on-surface-variant mb-6">
                Ciencias y Tecnología
              </p>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <AvatarBubble initials="JD" color="bg-primary-fixed" />
                  <AvatarBubble initials="MS" color="bg-secondary-fixed" />
                  <AvatarBubble initials="AL" color="bg-tertiary-fixed" />
                  <AvatarBubble initials="+25" color="bg-surface-container-high" muted />
                </div>
                <span className="text-sm font-label text-on-surface-variant">
                  28 estudiantes activos
                </span>
              </div>
            </div>
            <button className="p-3 text-primary hover:bg-primary-fixed-dim rounded-xl transition-colors">
              <span className="material-symbols-outlined">arrow_forward_ios</span>
            </button>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
        </div>

        {/* Group Card 2 */}
        <GroupCardSmall
          stage="ESO"
          name="4º ESO B"
          detail="Letras e Idiomas"
          count={22}
          accentColor="tertiary"
        />

        {/* Group Card 3 */}
        <GroupCardSmall
          stage="ESO"
          name="3º ESO C"
          detail="Programa Diversificación"
          count={15}
          accentColor="secondary"
        />

        {/* Group Card 4: Horizontal */}
        <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-xl border-l-4 border-primary/40 hover:bg-surface-container-low transition-colors flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary-fixed rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">
                school
              </span>
            </div>
            <div>
              <h3 className="text-xl font-headline font-bold text-on-surface">
                1º Bachillerato B
              </h3>
              <p className="text-on-surface-variant text-sm">
                Humanidades y Ciencias Sociales · 26 estudiantes
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button className="p-2 text-on-surface-variant hover:text-error transition-colors">
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="md:col-span-12 border-2 border-dashed border-outline-variant rounded-xl p-12 flex flex-col items-center justify-center group hover:border-primary/50 transition-colors cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-4 group-hover:bg-primary-fixed transition-colors">
            <span className="material-symbols-outlined text-outline group-hover:text-primary">
              add
            </span>
          </div>
          <p className="font-label font-medium text-on-surface-variant group-hover:text-primary transition-colors">
            Crear un nuevo grupo de estudio
          </p>
        </div>
      </div>
    </div>
  );
}

function AvatarBubble({
  initials,
  color,
  muted = false,
}: {
  initials: string;
  color: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`w-8 h-8 rounded-full ${color} border-2 border-surface-container-lowest flex items-center justify-center text-[10px] font-bold ${
        muted ? "text-on-surface-variant" : ""
      }`}
    >
      {initials}
    </div>
  );
}

function GroupCardSmall({
  stage,
  name,
  detail,
  count,
  accentColor,
}: {
  stage: string;
  name: string;
  detail: string;
  count: number;
  accentColor: string;
}) {
  const borderColors: Record<string, string> = {
    primary: "border-primary",
    secondary: "border-secondary",
    tertiary: "border-tertiary",
  };
  const textColors: Record<string, string> = {
    primary: "text-primary",
    secondary: "text-secondary",
    tertiary: "text-tertiary",
  };

  return (
    <div
      className={`md:col-span-4 bg-surface-container-low p-8 rounded-xl border-l-4 ${borderColors[accentColor]} hover:bg-surface-container transition-colors`}
    >
      <span
        className={`text-xs font-label uppercase tracking-widest ${textColors[accentColor]} font-bold mb-2 block`}
      >
        {stage}
      </span>
      <h3 className="text-2xl font-headline font-bold text-on-surface mb-1">
        {name}
      </h3>
      <p className="text-on-surface-variant text-sm mb-8">{detail}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-label font-medium text-on-surface">
          {count} estudiantes
        </span>
        <span className={`material-symbols-outlined ${textColors[accentColor]}`}>
          group
        </span>
      </div>
    </div>
  );
}
