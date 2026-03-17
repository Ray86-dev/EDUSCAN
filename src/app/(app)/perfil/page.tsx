import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/get-user";
import { checkDailyLimit } from "@/lib/usage";
import LogoutButton from "./LogoutButton";
import SubscriptionButtons from "./SubscriptionButtons";
import ProfileAvatar from "./ProfileAvatar";

export default async function PerfilPage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) return null;

  const fullName = user?.user_metadata?.full_name || "Docente";
  const email = user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";

  // Obtener plan del usuario
  const { data: profile } = await supabase
    .from("users")
    .select("plan_tier, created_at")
    .eq("id", user!.id)
    .single();

  const planTier = profile?.plan_tier || "free";
  const usage = await checkDailyLimit(supabase, user!.id);
  const createdAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="max-w-lg mx-auto px-6 py-6 md:py-10 space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-primary tracking-tight">
          Perfil
        </h2>
        <p className="text-on-surface-variant mt-1">Tu cuenta de EduScan.</p>
      </div>

      {/* User info card */}
      <div className="bg-surface-container-low p-8 rounded-xl space-y-6">
        <div className="flex items-center gap-4">
          <ProfileAvatar userId={user!.id} avatarUrl={avatarUrl} fullName={fullName} />
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
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant">
                Correcciones hoy
              </span>
              <span className="text-sm font-medium">
                {planTier === "free"
                  ? `${usage.used} de ${usage.limit} usadas`
                  : "Ilimitadas"}
              </span>
            </div>
            {planTier === "free" && (
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] ${
                    usage.used >= usage.limit ? "bg-error" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <SubscriptionButtons planTier={planTier} />

      <LogoutButton />
    </div>
  );
}
