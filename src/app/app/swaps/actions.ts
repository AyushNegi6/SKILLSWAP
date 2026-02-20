"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function updateSwapStatus(formData: FormData) {
  const swapId = String(formData.get("swapId") || "");
  const status = String(formData.get("status") || "");

  if (!swapId || !status) return;

  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;

  const { data: swap } = await supabase
    .from("swaps")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", swapId)
    .select("id,teach_skill,learn_skill")
    .single();

  // When completed → add to activity feed
  if (status === "completed" && swap) {
    await supabase.from("activity_feed").insert({
      swap_id: swap.id,
      text: `Recently swapped: ${swap.teach_skill} for ${swap.learn_skill}`,
    });
  }
}
