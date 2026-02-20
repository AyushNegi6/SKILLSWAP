"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function sendMessage(conversationId: string, formData: FormData) {
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: data.user.id,
    body,
  });
}
