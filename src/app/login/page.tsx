"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AppNavbar from "@/components/AppNavbar";
import { Button, Card } from "@/components/ui";
import { useToast } from "@/components/ToastProvider";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const toast = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pw,
    });
    setLoading(false);
    if (error)
      return toast.push({
        title: "Login failed",
        desc: error.message,
        kind: "err",
      });
    toast.push({ title: "Welcome back" });
    router.push("/app/explore");
  }

  async function signUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password: pw });
    setLoading(false);
    if (error)
      return toast.push({
        title: "Signup failed",
        desc: error.message,
        kind: "err",
      });
    toast.push({
      title: "Account created",
      desc: "Now complete your profile.",
    });
    router.push("/app/profile");
  }

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <div className="mx-auto max-w-[520px] px-4 pt-10">
        <Card className="p-6">
          <div className="text-lg font-semibold">Login / Signup</div>
          <div className="mt-1 text-sm text-(--muted)">
            Use email + password (v1 simple).
          </div>

          <div className="mt-5 grid gap-3">
            <input
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input"
              placeholder="Password"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </div>

          <div className="mt-5 flex gap-2">
            <Button
              onClick={signIn}
              disabled={loading || !email || pw.length < 6}
            >
              Login
            </Button>
            <Button
              variant="soft"
              onClick={signUp}
              disabled={loading || !email || pw.length < 6}
            >
              Create account
            </Button>
          </div>

          <div className="mt-3 text-xs text-(--muted2)">
            Password should be 6+ chars.
          </div>
        </Card>
      </div>
    </div>
  );
}
