"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function requestSwap(formData: FormData) {
  const recipientId = String(formData.get("recipientId") || "");
  const teachSkill = String(formData.get("teachSkill") || "").trim();
  const learnSkill = String(formData.get("learnSkill") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!recipientId || !teachSkill || !learnSkill) return;

  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;

  const { data: swap, error } = await supabase
    .from("swaps")
    .insert({
      requester_id: data.user.id,
      recipient_id: recipientId,
      teach_skill: teachSkill,
      learn_skill: learnSkill,
      message,
    })
    .select("id")
    .single();

  if (error || !swap) return;

  const { data: convo } = await supabase
    .from("conversations")
    .insert({ swap_id: swap.id })
    .select("id")
    .single();

  if (convo?.id) redirect(`/app/inbox/${convo.id}`);
  redirect("/app/inbox");
}
