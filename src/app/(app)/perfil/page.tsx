import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const fullName = user?.user_metadata?.full_name || "Docente";
  const email = user?.email || "";

  // Obtener plan del usuario
  const { data: profile } = await supabase
    .from("users")
    .select("plan_tier, created_at")
    .eq("id", user!.id)
    .single();

  const planTier = profile?.plan_tier || "free";
  const createdAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="max-w-lg mx-auto px-6 py-10 space-y-8">
      <div>
        <h2 className="text-4xl font-headline font-extrabold text-primary tracking-tight">
          Perfil
        </h2>
        <p className="text-on-surface-variant mt-1">Tu cuenta de EduScan.</p>
      </div>

      {/* User info card */}
      <div className="bg-surface-container-low p-8 rounded-xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container text-3xl">
              person
            </span>
          </div>
          <div>
            <h3 className="text-xl font-headline font-bold">{fullName}</h3>
            <p className="text-on-surface-variant text-sm">{email}</p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">Plan</span>
            <span className="text-sm font-bold px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full capitalize">
              {planTier}
            </span>
          </div>
          {createdAt && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant">Miembro desde</span>
              <span className="text-sm font-medium">{createdAt}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">
              Correcciones diarias
            </span>
            <span className="text-sm font-medium">
              {planTier === "free" ? "2 / día" : "Ilimitadas"}
            </span>
          </div>
        </div>
      </div>

      <LogoutButton />
    </div>
  );
}
