"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { toArrayFromCommaText } from "@/lib/utils";

export async function saveProfile(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const onlineOnly = formData.get("online_only") === "on";
  const bio = String(formData.get("bio") || "").trim();
  const teach = toArrayFromCommaText(String(formData.get("teach") || ""));
  const learn = toArrayFromCommaText(String(formData.get("learn") || ""));

  if (!name) return;

  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;

  await supabase
    .from("profiles")
    .update({
      name,
      city,
      online_only: onlineOnly,
      bio,
      teach_skills: teach,
      learn_skills: learn,
    })
    .eq("id", data.user.id);
}
