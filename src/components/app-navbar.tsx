"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

function TopLine() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
  );
}

function initials(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
}

export default function AppNavbar({
  variant = "app",
}: {
  variant?: "app" | "public";
}) {
  const [authed, setAuthed] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const ok = !!data.session;
      setAuthed(ok);

      if (ok && data.session?.user?.id) {
        const uid = data.session.user.id;
        const prof = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", uid)
          .maybeSingle();

        if (!prof.error && prof.data) {
          setDisplayName(prof.data.name ?? null);
          setAvatarUrl(prof.data.avatar_url ?? null);
        } else {
          setDisplayName(null);
          setAvatarUrl(null);
        }
      } else {
        setDisplayName(null);
        setAvatarUrl(null);
      }
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_e, session) => {
        setAuthed(!!session);
        if (session?.user?.id) {
          const prof = await supabase
            .from("profiles")
            .select("name, avatar_url")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!prof.error && prof.data) {
            setDisplayName(prof.data.name ?? null);
            setAvatarUrl(prof.data.avatar_url ?? null);
          } else {
            setDisplayName(null);
            setAvatarUrl(null);
          }
        } else {
          setDisplayName(null);
          setAvatarUrl(null);
        }
      },
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const logout = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const showAppLinks = variant === "app" ? authed : false;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--stroke)] bg-white/80 backdrop-blur py-3">
      <TopLine />
      <div className="mx-auto w-full max-w-[1560px] px-3 sm:px-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="grid h-10 w-10 place-items-center rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600">
                S
              </div>
              <div className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-r from-blue-500/18 to-indigo-500/14 blur-md" />
            </div>

            <div className="leading-tight">
              <div className="text-sm font-semibold text-[var(--text)]">
                SkillSwap
              </div>
              <div className="text-xs text-[var(--muted2)]">swap, not pay</div>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            {showAppLinks ? (
              <>
                <Link href="/app/explore">
                  <Button variant="ghost" className="navlink">
                    Explore
                  </Button>
                </Link>
                <Link href="/app/messages">
                  <Button variant="ghost" className="navlink">
                    Messages
                  </Button>
                </Link>

                {/* ✅ Avatar dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    className="avatarBtn"
                    onClick={() => setOpen((v) => !v)}
                    aria-label="Account menu"
                  >
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full grid place-items-center font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600">
                        {initials(displayName)}
                      </div>
                    )}
                  </button>

                  {open ? (
                    <div className="menu">
                      <div className="menuTop">
                        <div className="text-sm font-semibold">
                          {displayName || "Your account"}
                        </div>
                        <div className="text-xs text-[var(--muted2)]">
                          Signed in
                        </div>
                      </div>

                      <div className="menuDivider" />

                      <Link href="/app/profile" onClick={() => setOpen(false)}>
                        <div className="menuItem">Profile</div>
                      </Link>
                      <button className="menuItem danger" onClick={logout}>
                        Logout
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <Link href="/login">
                <Button className="px-5">Get started</Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
