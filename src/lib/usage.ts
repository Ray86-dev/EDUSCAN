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

/**
 * Atómico: check + increment en una sola transacción SQL.
 * Seguro para correcciones concurrentes (evita race conditions).
 * Llama a la función PostgreSQL try_increment_usage.
 */
export async function tryIncrementUsage(
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

  // Premium no tiene límite — incrementar directamente sin check
  if (planTier === "premium") {
    await incrementUsage(supabase, userId);
    return { allowed: true, used: 0, limit: Infinity };
  }

  const limit = 2;
  const { data, error } = await supabase.rpc("try_increment_usage", {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) {
    // Fallback al método no-atómico si la función RPC no existe aún
    const result = await checkDailyLimit(supabase, userId);
    if (result.allowed) await incrementUsage(supabase, userId);
    return result;
  }

  return {
    allowed: data.allowed,
    used: data.used,
    limit: data.limit,
  };
}
