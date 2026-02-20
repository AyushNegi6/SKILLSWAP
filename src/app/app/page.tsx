"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button, Card, Badge } from "@/components/ui";

export default function AppHome() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      const userEmail = data.session?.user?.email ?? null;
      if (!userEmail) router.replace("/login");
      if (mounted) setEmail(userEmail);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const userEmail = session?.user?.email ?? null;
      if (!userEmail) router.replace("/login");
      setEmail(userEmail);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold">
            SkillSwap
          </Link>
          <Badge className="bg-white border border-slate-200 text-slate-700">
            Logged in
          </Badge>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="p-6">
            <div className="text-xs text-slate-500">Account</div>
            <div className="mt-2 text-sm font-semibold">
              {email ? email : "Checking session…"}
            </div>
            <div className="mt-5 flex gap-2">
              <Button
                onClick={signOut}
                variant="soft"
                className="border border-slate-200 bg-white"
              >
                Sign out
              </Button>
              <Link href="/app/profile">
                <Button>Setup profile</Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-xs text-slate-500">Next pages</div>
            <div className="mt-2 text-sm font-semibold">
              Explore • Messages • Reviews
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/app/explore">
                <Button variant="ghost">Explore</Button>
              </Link>
              <Link href="/app/messages">
                <Button variant="ghost">Messages</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
