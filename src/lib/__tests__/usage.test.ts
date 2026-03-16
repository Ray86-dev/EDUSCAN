import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkDailyLimit, incrementUsage } from "../usage";

// Mock Supabase client
function createMockSupabase(overrides: {
  planTier?: string;
  correctionsCount?: number | null;
  existingUsageId?: string | null;
}) {
  const { planTier = "free", correctionsCount = 0, existingUsageId = null } = overrides;

  const mockUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });

  const mockInsert = vi.fn().mockResolvedValue({ error: null });

  return {
    from: vi.fn((table: string) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { plan_tier: planTier }, error: null }),
            }),
          }),
        };
      }
      if (table === "usage_logs") {
        return {
          select: () => ({
            eq: (col: string) => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: existingUsageId
                      ? { id: existingUsageId, corrections_count: correctionsCount }
                      : null,
                    error: existingUsageId ? null : { code: "PGRST116" },
                  }),
              }),
            }),
          }),
          update: mockUpdate,
          insert: mockInsert,
        };
      }
      return {};
    }),
    _mockUpdate: mockUpdate,
    _mockInsert: mockInsert,
  };
}

describe("checkDailyLimit", () => {
  it("allows free user with 0 corrections", async () => {
    const supabase = createMockSupabase({ correctionsCount: 0 });
    const result = await checkDailyLimit(supabase as any, "user-1");
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(0);
    expect(result.limit).toBe(2);
  });

  it("allows free user with 1 correction", async () => {
    const supabase = createMockSupabase({
      correctionsCount: 1,
      existingUsageId: "log-1",
    });
    const result = await checkDailyLimit(supabase as any, "user-1");
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(1);
  });

  it("blocks free user with 2 corrections", async () => {
    const supabase = createMockSupabase({
      correctionsCount: 2,
      existingUsageId: "log-1",
    });
    const result = await checkDailyLimit(supabase as any, "user-1");
    expect(result.allowed).toBe(false);
    expect(result.used).toBe(2);
    expect(result.limit).toBe(2);
  });

  it("allows premium user with many corrections", async () => {
    const supabase = createMockSupabase({
      planTier: "premium",
      correctionsCount: 100,
      existingUsageId: "log-1",
    });
    const result = await checkDailyLimit(supabase as any, "user-1");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Infinity);
  });

  it("defaults to free tier when user has no plan_tier", async () => {
    const supabase = createMockSupabase({ planTier: undefined as any });
    const result = await checkDailyLimit(supabase as any, "user-1");
    expect(result.limit).toBe(2);
  });
});

describe("incrementUsage", () => {
  it("creates a new usage_log when none exists for today", async () => {
    const supabase = createMockSupabase({ existingUsageId: null });
    await incrementUsage(supabase as any, "user-1");
    expect(supabase._mockInsert).toHaveBeenCalled();
  });

  it("updates existing usage_log when one exists", async () => {
    const supabase = createMockSupabase({
      existingUsageId: "log-1",
      correctionsCount: 1,
    });
    await incrementUsage(supabase as any, "user-1");
    expect(supabase._mockUpdate).toHaveBeenCalled();
  });
});
