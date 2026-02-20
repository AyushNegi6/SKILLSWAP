"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button, Card, Badge } from "@/components/ui";

type Profile = {
  id: string;
  name: string | null;
  city: string | null;
  online_only: boolean | null;
  bio: string | null;
  teach_skills: string[] | null;
  learn_skills: string[] | null;
};

type SwapStatus = "open" | "pending" | "accepted" | "declined" | "cancelled";
type SwapKind = "public" | "direct";

type SwapRow = {
  id: string;
  requester_id: string;
  recipient_id: string | null;
  kind: SwapKind;
  offer_skill: string | null;
  want_skill: string | null;
  note: string | null;
  status: SwapStatus;
  created_at: string;
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

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="chip">{children}</span>;
}

function logSbError(tag: string, err: any) {
  if (!err) return;
  console.error(
    tag,
    err?.message ?? "",
    err?.details ?? "",
    err?.hint ?? "",
    err,
  );
}

export default function ExplorePage() {
  const router = useRouter();

  const [me, setMe] = useState<{ id: string } | null>(null);

  // keep full profiles for name mapping
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [publicSwaps, setPublicSwaps] = useState<SwapRow[]>([]);
  const [incoming, setIncoming] = useState<SwapRow[]>([]);
  const [outgoing, setOutgoing] = useState<SwapRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<"discover" | "requests">("discover");
  const [q, setQ] = useState("");

  // Create Swap modal
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<SwapKind>("direct");
  const [recipientId, setRecipientId] = useState("");
  const [offerSkill, setOfferSkill] = useState("");
  const [wantSkill, setWantSkill] = useState("");
  const [note, setNote] = useState("");

  // Quick Request modal per person card
  const [quickTo, setQuickTo] = useState<Profile | null>(null);

  const profileMap = useMemo(() => {
    const m = new Map<string, Profile>();
    allProfiles.forEach((p) => m.set(p.id, p));
    return m;
  }, [allProfiles]);

  function nameById(id: string) {
    return profileMap.get(id)?.name ?? "User";
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (error) logSbError("[auth.getUser]", error);
      if (!mounted) return;

      if (!data.user) {
        setMe(null);
        setAllProfiles([]);
        setProfiles([]);
        setPublicSwaps([]);
        setIncoming([]);
        setOutgoing([]);
        setLoading(false);
        return;
      }

      setMe({ id: data.user.id });
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (!session?.user) setMe(null);
      else setMe({ id: session.user.id });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function loadAll(userId: string) {
    setLoading(true);

    // profiles
    const { data: ps, error: pErr } = await supabase
      .from("profiles")
      .select(
        "id,name,city,online_only,bio,teach_skills,learn_skills,created_at",
      )
      .order("created_at", { ascending: false });

    if (pErr) logSbError("[profiles.select]", pErr);

    const all = ((ps as any) ?? []) as Profile[];
    setAllProfiles(all);
    setProfiles(all.filter((p) => p.id !== userId));

    // swaps
    const { data: swaps, error: sErr } = await supabase
      .from("swaps")
      .select(
        "id,requester_id,recipient_id,kind,offer_skill,want_skill,note,status,created_at",
      )
      .order("created_at", { ascending: false });

    if (sErr) logSbError("[swaps.select]", sErr);

    const allSwaps = (((swaps as any) ?? []) as SwapRow[]) ?? [];

    // Public swaps visible in discover (open only)
    setPublicSwaps(
      allSwaps.filter((s) => s.kind === "public" && s.status === "open"),
    );

    // Incoming direct pending for me
    setIncoming(
      allSwaps.filter(
        (s) =>
          s.kind === "direct" &&
          s.recipient_id === userId &&
          s.status === "pending",
      ),
    );

    // Outgoing: everything I created (direct + public)
    setOutgoing(allSwaps.filter((s) => s.requester_id === userId));

    setLoading(false);
  }

  useEffect(() => {
    if (!me?.id) return;
    loadAll(me.id);
  }, [me?.id]);

  const filteredPeople = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return profiles;

    return profiles.filter((p) => {
      const blob =
        `${p.name ?? ""} ${p.city ?? ""} ${p.bio ?? ""} ${(p.teach_skills ?? []).join(" ")} ${(p.learn_skills ?? []).join(" ")}`.toLowerCase();
      return blob.includes(qq);
    });
  }, [profiles, q]);

  const filteredPublicSwaps = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return publicSwaps;

    return publicSwaps.filter((s) => {
      const blob =
        `${s.offer_skill ?? ""} ${s.want_skill ?? ""} ${s.note ?? ""} ${nameById(
          s.requester_id,
        )}`.toLowerCase();
      return blob.includes(qq);
    });
  }, [publicSwaps, q, profileMap]);

  function resetModal() {
    setKind("direct");
    setRecipientId("");
    setOfferSkill("");
    setWantSkill("");
    setNote("");
  }

  async function createSwap(opts: { kind: SwapKind; toId?: string | null }) {
    if (!me?.id) return;

    const offer = offerSkill.trim();
    const want = wantSkill.trim();
    if (!offer || !want) return;

    const payload: any = {
      requester_id: me.id,
      kind: opts.kind,
      offer_skill: offer,
      want_skill: want,
      note: note.trim() || null,
      status: opts.kind === "public" ? "open" : "pending",
      recipient_id: null,
    };

    if (opts.kind === "direct") {
      const toId = opts.toId ?? recipientId;
      if (!toId) return;
      if (toId === me.id) return; // safety
      payload.recipient_id = toId;
    } else {
      // public
      payload.recipient_id = null;
    }

    const { error } = await supabase.from("swaps").insert(payload);
    if (error) {
      logSbError("[swaps.insert(createSwap)]", error);
      return;
    }

    setOpen(false);
    setQuickTo(null);
    resetModal();
    await loadAll(me.id);
    setTab("requests");
  }

  async function acceptSwap(swapId: string) {
    if (!me?.id) return;

    const { error: upErr } = await supabase
      .from("swaps")
      .update({ status: "accepted" })
      .eq("id", swapId)
      .eq("recipient_id", me.id);

    if (upErr) {
      logSbError("[swaps.update(accept)]", upErr);
      return;
    }

    const { error: cErr } = await supabase
      .from("conversations")
      .upsert({ swap_id: swapId }, { onConflict: "swap_id" });

    if (cErr) logSbError("[conversations.upsert]", cErr);

    await loadAll(me.id);
    router.push("/app/messages");
  }

  async function declineSwap(swapId: string) {
    if (!me?.id) return;

    const { error } = await supabase
      .from("swaps")
      .update({ status: "declined" })
      .eq("id", swapId)
      .eq("recipient_id", me.id);

    if (error) logSbError("[swaps.update(decline)]", error);
    await loadAll(me.id);
  }

  // ✅ "delete" = soft delete (cancel) so it becomes invisible everywhere
  async function cancelMySwap(swapId: string) {
    if (!me?.id) return;

    const { error } = await supabase
      .from("swaps")
      .update({ status: "cancelled" })
      .eq("id", swapId)
      .eq("requester_id", me.id)
      .in("status", ["open", "pending"]);

    if (error) logSbError("[swaps.update(cancel)]", error);
    await loadAll(me.id);
  }

  // ✅ Claim public swap: protected (can’t claim own, must still be open)
  async function claimPublicSwap(swapId: string) {
    if (!me?.id) return;

    // IMPORTANT: never allow claiming your own listing (also avoids DB constraint error)
    const row = publicSwaps.find((s) => s.id === swapId);
    if (!row) return;

    if (row.requester_id === me.id) return;

    const { error } = await supabase
      .from("swaps")
      .update({
        kind: "direct",
        recipient_id: me.id,
        status: "pending",
      })
      .eq("id", swapId)
      .eq("kind", "public")
      .eq("status", "open")
      .is("recipient_id", null)
      .neq("requester_id", me.id); // extra protection

    if (error) {
      logSbError("[swaps.update(claimPublic)]", error);
      return;
    }

    await loadAll(me.id);
    setTab("requests");
  }

  return (
    <div className="mx-auto w-full max-w-[1480px] px-2 sm:px-4">
      <section className="mt-4 page">
        <div className="flex flex-col gap-4">
          {/* top bar */}
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold">Explore</div>
                <div className="text-xs text-(--muted2)">
                  Discover people + public swaps. Create direct or public swap.
                  Accept → chat unlocks.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  className={`tabbtn ${tab === "discover" ? "tabon" : ""}`}
                  onClick={() => setTab("discover")}
                >
                  Discover
                </button>

                <button
                  className={`tabbtn ${tab === "requests" ? "tabon" : ""}`}
                  onClick={() => setTab("requests")}
                >
                  Requests
                  {incoming.length ? (
                    <span className="ml-2 chip2">{incoming.length}</span>
                  ) : null}
                </button>

                <Button onClick={() => setOpen(true)} className="px-5">
                  Create swap
                </Button>
              </div>
            </div>

            <div className="mt-3">
              <input
                className="input"
                placeholder="Search by name, city, skills, swap notes…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </Card>

          {loading ? (
            <div className="grid gap-3">
              <Card className="p-4">
                <div className="skeleton h-14 w-full" />
              </Card>
              <Card className="p-4">
                <div className="skeleton h-14 w-full" />
              </Card>
              <Card className="p-4">
                <div className="skeleton h-14 w-full" />
              </Card>
            </div>
          ) : !me ? (
            <Card className="p-6">
              <div className="emptyState">
                <div className="emptyIcon">🔒</div>
                <div className="text-sm font-semibold">Login required</div>
                <div className="text-sm text-(--muted)">
                  Please login to explore and create swaps.
                </div>
              </div>
            </Card>
          ) : tab === "discover" ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
              {/* LEFT: People */}
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredPeople.length === 0 ? (
                  <Card className="p-6 md:col-span-2 xl:col-span-3">
                    <div className="emptyState">
                      <div className="emptyIcon">🧭</div>
                      <div className="text-sm font-semibold">No people</div>
                      <div className="text-sm text-(--muted)">
                        Try different keywords.
                      </div>
                    </div>
                  </Card>
                ) : (
                  filteredPeople.map((p) => (
                    <Card key={p.id} className="p-4 hoverlift">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-full border border-(--stroke) bg-white overflow-hidden grid place-items-center">
                            <div className="text-xs font-semibold text-(--muted)">
                              {initials(p.name)}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {p.name ?? "Unnamed"}
                            </div>
                            <div className="text-xs text-(--muted2) truncate">
                              {p.online_only ? "Online only" : (p.city ?? "—")}
                            </div>
                          </div>
                        </div>
                        <Badge className="badge">Person</Badge>
                      </div>

                      {p.bio ? (
                        <div className="mt-3 text-sm text-(--muted) line-clamp-2">
                          {p.bio}
                        </div>
                      ) : null}

                      <div className="mt-3 grid gap-2">
                        <div>
                          <div className="text-[11px] text-(--muted2) mb-1">
                            Teaches
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(p.teach_skills ?? []).slice(0, 5).map((s) => (
                              <Chip key={s}>{s}</Chip>
                            ))}
                            {!p.teach_skills?.length ? (
                              <span className="text-xs text-(--muted2)">—</span>
                            ) : null}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] text-(--muted2) mb-1">
                            Wants
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(p.learn_skills ?? []).slice(0, 5).map((s) => (
                              <Chip key={s}>{s}</Chip>
                            ))}
                            {!p.learn_skills?.length ? (
                              <span className="text-xs text-(--muted2)">—</span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button
                          variant="soft"
                          className="w-full"
                          onClick={() => {
                            setQuickTo(p);
                            setKind("direct");
                            setRecipientId(p.id);
                            setOfferSkill("");
                            setWantSkill("");
                            setNote("");
                            setOpen(false);
                          }}
                        >
                          Request swap
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {/* RIGHT: Public swaps */}
              <div className="hidden lg:block">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Public swaps</div>
                      <div className="text-xs text-(--muted2)">
                        Claim → becomes a direct request to you.
                      </div>
                    </div>
                    <Badge className="badge">Open</Badge>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {filteredPublicSwaps.length === 0 ? (
                      <div className="emptyState">
                        <div className="emptyIcon">🪟</div>
                        <div className="text-sm font-semibold">
                          No public swaps
                        </div>
                        <div className="text-sm text-(--muted)">
                          Create one from “Create swap”.
                        </div>
                      </div>
                    ) : (
                      filteredPublicSwaps.slice(0, 30).map((s) => {
                        const mine = s.requester_id === me.id;

                        return (
                          <div
                            key={s.id}
                            className="rounded-2xl border border-(--stroke) bg-white/80 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-semibold">
                                {s.offer_skill ?? "—"} ↔ {s.want_skill ?? "—"}
                              </div>
                              <span className="chip2">
                                {mine
                                  ? "Your listing"
                                  : nameById(s.requester_id)}
                              </span>
                            </div>

                            {s.note ? (
                              <div className="mt-1 text-sm text-(--muted)">
                                {s.note}
                              </div>
                            ) : null}

                            <div className="mt-3 flex gap-2">
                              {mine ? (
                                <Button
                                  variant="ghost"
                                  className="w-full"
                                  onClick={() => cancelMySwap(s.id)}
                                >
                                  Close listing
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => claimPublicSwap(s.id)}
                                  className="w-full"
                                >
                                  Claim this swap
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Incoming requests */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Incoming</div>
                    <div className="text-xs text-(--muted2)">
                      Accept to unlock chat.
                    </div>
                  </div>
                  <Badge className="badge">Pending</Badge>
                </div>

                <div className="mt-3 grid gap-2">
                  {incoming.length === 0 ? (
                    <div className="emptyState">
                      <div className="emptyIcon">📩</div>
                      <div className="text-sm font-semibold">No requests</div>
                      <div className="text-sm text-(--muted)">
                        When someone requests a swap, it appears here.
                      </div>
                    </div>
                  ) : (
                    incoming.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-2xl border border-(--stroke) bg-white/80 p-3"
                      >
                        <div className="text-sm font-semibold">
                          {s.offer_skill ?? "—"} ↔ {s.want_skill ?? "—"}
                        </div>
                        {s.note ? (
                          <div className="mt-1 text-sm text-(--muted)">
                            {s.note}
                          </div>
                        ) : null}
                        <div className="mt-3 flex gap-2">
                          <Button
                            onClick={() => acceptSwap(s.id)}
                            className="px-5"
                          >
                            Accept
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => declineSwap(s.id)}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Outgoing status */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Your requests</div>
                    <div className="text-xs text-(--muted2)">
                      Cancel your pending/direct or close your public listing.
                    </div>
                  </div>
                  <Badge className="badge">History</Badge>
                </div>

                <div className="mt-3 grid gap-2">
                  {outgoing.length === 0 ? (
                    <div className="emptyState">
                      <div className="emptyIcon">🧾</div>
                      <div className="text-sm font-semibold">No outgoing</div>
                      <div className="text-sm text-(--muted)">
                        Create a swap request to see it here.
                      </div>
                    </div>
                  ) : (
                    outgoing.slice(0, 30).map((s) => {
                      const canCancel =
                        s.status === "pending" ||
                        (s.kind === "public" && s.status === "open");

                      return (
                        <div
                          key={s.id}
                          className="rounded-2xl border border-(--stroke) bg-white/80 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">
                              {s.offer_skill ?? "—"} ↔ {s.want_skill ?? "—"}
                            </div>
                            <span className="chip2">
                              {s.kind}:{s.status}
                            </span>
                          </div>

                          {s.note ? (
                            <div className="mt-1 text-sm text-(--muted)">
                              {s.note}
                            </div>
                          ) : null}

                          {canCancel ? (
                            <div className="mt-3">
                              <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => cancelMySwap(s.id)}
                              >
                                {s.kind === "public"
                                  ? "Close listing"
                                  : "Cancel request"}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Create Swap modal */}
      {open ? (
        <div className="modalOverlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Create swap</div>
                <div className="text-xs text-(--muted2)">
                  Direct (choose a person) or Public (visible to everyone).
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  resetModal();
                }}
              >
                Close
              </Button>
            </div>

            <div className="mt-4 grid gap-3">
              {/* kind toggle */}
              <div className="flex flex-wrap gap-2">
                <button
                  className={`tabbtn ${kind === "direct" ? "tabon" : ""}`}
                  onClick={() => setKind("direct")}
                  type="button"
                >
                  Direct (choose user)
                </button>
                <button
                  className={`tabbtn ${kind === "public" ? "tabon" : ""}`}
                  onClick={() => setKind("public")}
                  type="button"
                >
                  Public (anyone can claim)
                </button>
              </div>

              {kind === "direct" ? (
                <div>
                  <div className="text-xs text-(--muted2) mb-1">Send to</div>
                  <select
                    className="input"
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                  >
                    <option value="">Select a user…</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name ?? "Unnamed"} — {p.city ?? "—"}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <Card className="p-3 bg-white/70 border border-(--stroke)">
                  <div className="text-sm font-semibold">Public swap</div>
                  <div className="text-xs text-(--muted2)">
                    You don’t pick a person. It will appear in Public swaps.
                  </div>
                </Card>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-(--muted2) mb-1">
                    I can offer
                  </div>
                  <input
                    className="input"
                    value={offerSkill}
                    onChange={(e) => setOfferSkill(e.target.value)}
                    placeholder="e.g. Java, Excel, Guitar"
                  />
                </div>
                <div>
                  <div className="text-xs text-(--muted2) mb-1">I want</div>
                  <input
                    className="input"
                    value={wantSkill}
                    onChange={(e) => setWantSkill(e.target.value)}
                    placeholder="e.g. React, English"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs text-(--muted2) mb-1">
                  Note (optional)
                </div>
                <textarea
                  className="input min-h-[90px] resize-none"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Short message…"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                    resetModal();
                  }}
                >
                  Cancel
                </Button>

                <Button
                  onClick={() =>
                    createSwap({
                      kind,
                      toId: kind === "direct" ? recipientId : null,
                    })
                  }
                  disabled={
                    !offerSkill.trim() ||
                    !wantSkill.trim() ||
                    (kind === "direct" && !recipientId)
                  }
                >
                  {kind === "public" ? "Publish swap" : "Send request"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Quick Request modal (from person card) */}
      {quickTo ? (
        <div className="modalOverlay" onClick={() => setQuickTo(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">
                  Request swap with {quickTo.name ?? "User"}
                </div>
                <div className="text-xs text-(--muted2)">
                  Offer / Want can change per request (mood-based).
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setQuickTo(null);
                  setOfferSkill("");
                  setWantSkill("");
                  setNote("");
                }}
              >
                Close
              </Button>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-(--muted2) mb-1">
                    I can offer
                  </div>
                  <input
                    className="input"
                    value={offerSkill}
                    onChange={(e) => setOfferSkill(e.target.value)}
                    placeholder="e.g. Java"
                  />
                </div>
                <div>
                  <div className="text-xs text-(--muted2) mb-1">I want</div>
                  <input
                    className="input"
                    value={wantSkill}
                    onChange={(e) => setWantSkill(e.target.value)}
                    placeholder="e.g. English"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs text-(--muted2) mb-1">
                  Note (optional)
                </div>
                <textarea
                  className="input min-h-[90px] resize-none"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Short message…"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setQuickTo(null);
                    setOfferSkill("");
                    setWantSkill("");
                    setNote("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    createSwap({ kind: "direct", toId: quickTo.id })
                  }
                  disabled={!offerSkill.trim() || !wantSkill.trim()}
                >
                  Send request
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
