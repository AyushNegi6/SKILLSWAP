// src/lib/auth/useRequireAuth.ts
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useRequireAuth() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;

      if (!data?.user) {
        window.location.href = "/login";
        return;
      }

      setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { ready };
}
