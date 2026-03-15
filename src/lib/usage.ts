import { SupabaseClient } from "@supabase/supabase-js";

interface UsageResult {
  allowed: boolean;
  used: number;
  limit: number;
}

export async function checkDailyLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<UsageResult> {
  // Obtener plan del usuario
  const { data: user } = await supabase
    .from("users")
    .select("plan_tier")
    .eq("id", userId)
    .single();

  const planTier = user?.plan_tier || "free";
  const limit = planTier === "premium" ? Infinity : 2;

  // Obtener fecha actual en hora canaria (Atlantic/Canary)
  const now = new Date();
  const canaryDate = now.toLocaleDateString("en-CA", {
    timeZone: "Atlantic/Canary",
  }); // formato YYYY-MM-DD

  // Buscar uso de hoy
  const { data: usage } = await supabase
    .from("usage_logs")
    .select("corrections_count")
    .eq("user_id", userId)
    .eq("date", canaryDate)
    .single();

  const used = usage?.corrections_count || 0;

  return {
    allowed: used < limit,
    used,
    limit,
  };
}

export async function incrementUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const now = new Date();
  const canaryDate = now.toLocaleDateString("en-CA", {
    timeZone: "Atlantic/Canary",
  });

  // Upsert: crear o incrementar
  const { data: existing } = await supabase
    .from("usage_logs")
    .select("id, corrections_count")
    .eq("user_id", userId)
    .eq("date", canaryDate)
    .single();

  if (existing) {
    await supabase
      .from("usage_logs")
      .update({ corrections_count: existing.corrections_count + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("usage_logs").insert({
      user_id: userId,
      date: canaryDate,
      corrections_count: 1,
    });
  }
}
