"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, Button, Badge } from "@/components/ui";
import { useToast } from "@/components/ToastProvider";

type Conversation = { id: string; swap_id: string; created_at: string };
type Swap = {
  id: string;
  requester_id: string;
  recipient_id: string;
  offer_skill: string | null;
  want_skill: string | null;
  status: string;
};
type ProfileMini = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

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

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [swapsById, setSwapsById] = useState<Record<string, Swap>>({});
  const [profilesById, setProfilesById] = useState<Record<string, ProfileMini>>(
    {},
  );

  async function loadAll(uid: string) {
    setLoading(true);

    // 1) Accepted swaps involving me
    const { data: swaps, error: sErr } = await supabase
      .from("swaps")
      .select("id,requester_id,recipient_id,offer_skill,want_skill,status")
      .eq("status", "accepted")
      .or(`requester_id.eq.${uid},recipient_id.eq.${uid}`);

    if (sErr)
      toast.push({ title: "Swaps error", desc: sErr.message, kind: "err" });

    const swapList = ((swaps as any) ?? []) as Swap[];
    const swapMap: Record<string, Swap> = {};
    swapList.forEach((s) => (swapMap[s.id] = s));
    setSwapsById(swapMap);

    const swapIds = swapList.map((s) => s.id);
    if (swapIds.length === 0) {
      setConvs([]);
      setProfilesById({});
      setLoading(false);
      return;
    }

    // 2) Conversations for those swaps
    const { data: cs, error: cErr } = await supabase
      .from("conversations")
      .select("id,swap_id,created_at")
      .in("swap_id", swapIds)
      .order("created_at", { ascending: false });

    if (cErr)
      toast.push({
        title: "Conversations error",
        desc: cErr.message,
        kind: "err",
      });

    const convList = ((cs as any) ?? []) as Conversation[];
    setConvs(convList);

    // 3) Load partner profiles
    const otherIds = Array.from(
      new Set(
        swapList.map((s) =>
          s.requester_id === uid ? s.recipient_id : s.requester_id,
        ),
      ),
    );

    const { data: ps, error: pErr } = await supabase
      .from("profiles")
      .select("id,name,avatar_url")
      .in("id", otherIds);

    if (pErr)
      toast.push({ title: "Profiles error", desc: pErr.message, kind: "err" });

    const pm: Record<string, ProfileMini> = {};
    (((ps as any) ?? []) as ProfileMini[]).forEach((p) => (pm[p.id] = p));
    setProfilesById(pm);

    setLoading(false);
  }

  useEffect(() => {
    if (!user?.id) return;
    loadAll(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const items = useMemo(() => {
    if (!user?.id) return [];
    return convs.map((c) => {
      const s = swapsById[c.swap_id];
      const otherId = s
        ? s.requester_id === user.id
          ? s.recipient_id
          : s.requester_id
        : "";
      const other = profilesById[otherId];
      return { c, s, other };
    });
  }, [convs, swapsById, profilesById, user?.id]);

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-[1480px] px-4">
        <section className="mt-4 page">
          <Card className="p-6">
            <div className="skeleton h-10 w-full" />
          </Card>
        </section>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-[1480px] px-4">
        <section className="mt-4 page">
          <Card className="p-6">
            <div className="emptyState">
              <div className="emptyIcon">🔒</div>
              <div className="text-sm font-semibold">Login required</div>
              <div className="text-sm text-(--muted)">
                Login to see your chats.
              </div>
            </div>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1480px] px-4">
      <section className="mt-4 page">
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Messages</div>
                <div className="text-xs text-(--muted2)">
                  Accepted swaps only
                </div>
              </div>
              <Badge>Chats</Badge>
            </div>

            <div className="mt-3 grid gap-2">
              {loading ? (
                <>
                  <div className="skeleton h-14 w-full" />
                  <div className="skeleton h-14 w-full" />
                  <div className="skeleton h-14 w-full" />
                </>
              ) : items.length === 0 ? (
                <div className="emptyState">
                  <div className="emptyIcon">💬</div>
                  <div className="text-sm font-semibold">No chats yet</div>
                  <div className="text-sm text-(--muted)">
                    A chat appears after a swap is accepted.
                  </div>
                  <Button
                    className="mt-3"
                    onClick={() => router.push("/app/explore")}
                  >
                    Go to Explore
                  </Button>
                </div>
              ) : (
                items.map(({ c, s, other }) => (
                  <button
                    key={c.id}
                    className="w-full text-left rounded-2xl border border-(--stroke) bg-white/80 p-3 hoverlift"
                    onClick={() => router.push(`/app/messages/${c.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full overflow-hidden border border-(--stroke) bg-white grid place-items-center">
                        {other?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={other.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-(--muted)">
                            {initials(other?.name)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {other?.name ?? "User"}
                        </div>
                        <div className="text-xs text-(--muted2) truncate">
                          {s?.offer_skill ?? "—"} ↔ {s?.want_skill ?? "—"}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="emptyState">
              <div className="emptyIcon">👋</div>
              <div className="text-sm font-semibold">Say hi</div>
              <div className="text-sm text-(--muted)">
                Open a chat from the left.
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
