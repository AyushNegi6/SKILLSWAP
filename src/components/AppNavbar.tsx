"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";

function initials(name?: string | null) {
  const n = (name ?? "").trim();
  if (!n) return "U";
  return n
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]!.toUpperCase())
    .join("");
}

export default function AppNavbar() {
  const { user, loading } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [meName, setMeName] = React.useState<string | null>(null);
  const [meAvatar, setMeAvatar] = React.useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!user?.id) {
        setMeName(null);
        setMeAvatar(null);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("name,avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!alive) return;
      if (error) return; // silent
      setMeName(data?.name ?? null);
      setMeAvatar(data?.avatar_url ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [user?.id]);

  async function logout() {
    setOpen(false);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.push({ title: "Logout failed", desc: error.message, kind: "err" });
      return;
    }
    toast.push({ title: "Logged out" });
    router.push("/");
  }

  const active = (href: string) => (pathname === href ? "bg-black/5" : "");

  return (
    <div className="sticky top-0 z-40 border-b border-(--stroke) bg-white/70 backdrop-blur">
      <div className="mx-auto w-full max-w-[1480px] px-4">
        <div className="flex h-[72px] items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent2))] grid place-items-center text-white font-bold">
              S
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">SkillSwap</div>
              <div className="text-xs text-(--muted2)">swap, not pay</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {loading ? null : user ? (
              <>
                <Link
                  href="/app/explore"
                  className={`tabbtn ${active("/app/explore")}`}
                >
                  Explore
                </Link>
                <Link
                  href="/app/messages"
                  className={`tabbtn ${active("/app/messages")}`}
                >
                  Messages
                </Link>

                <div className="relative">
                  <button
                    className="avatarBtn"
                    onClick={() => setOpen((p) => !p)}
                    aria-label="Profile menu"
                  >
                    <div className="flex items-center gap-2 px-2 py-1">
                      <div className="h-9 w-9 rounded-full overflow-hidden border border-(--stroke) bg-white grid place-items-center">
                        {meAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={meAvatar}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-(--muted)">
                            {initials(meName)}
                          </span>
                        )}
                      </div>
                      <div className="hidden sm:block text-left">
                        <div className="text-sm font-semibold leading-4">
                          {meName ?? "You"}
                        </div>
                        <div className="text-xs text-(--muted2)">Online</div>
                      </div>
                    </div>
                  </button>

                  {open ? (
                    <div className="menu" onMouseLeave={() => setOpen(false)}>
                      <div className="menuTop">
                        <div className="text-sm font-semibold">
                          {meName ?? "Your account"}
                        </div>
                        <div className="text-xs text-(--muted2)">
                          {user.email ?? ""}
                        </div>
                      </div>
                      <div className="menuDivider" />
                      <div
                        className="menuItem"
                        onClick={() => {
                          setOpen(false);
                          router.push("/app/profile");
                        }}
                      >
                        Profile
                      </div>
                      <div className="menuDivider" />
                      <div className="menuItem danger" onClick={logout}>
                        Logout
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="tabbtn">
                  Get started
                </Link>
                <Link href="/login">
                  <button className="tabbtn tabon">Create profile</button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
