// src/components/HomeHeroActions.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export default function HomeHeroActions() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthed(!!data.session?.user);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s?.user);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;

  // ✅ If logged in, hide these buttons on homepage
  if (authed) return null;

  return (
    <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
      <Link href="/login">
        <Button className="px-7 py-2.5">Get started</Button>
      </Link>

      <Link href="/login">
        <Button
          variant="soft"
          className="px-7 py-2.5 text-slate-900 border border-slate-200 bg-white/90 hover:bg-white"
        >
          Create profile
        </Button>
      </Link>
    </div>
  );
}
