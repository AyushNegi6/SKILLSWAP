"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, Button } from "@/components/ui";
import { useToast } from "@/components/ToastProvider";

type Msg = { id: string; sender_id: string; body: string; created_at: string };

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("id,sender_id,body,created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error)
      toast.push({ title: "Messages error", desc: error.message, kind: "err" });
    setMsgs(((data as any) ?? []) as Msg[]);
    setLoading(false);
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }

  useEffect(() => {
    if (!id) return;
    load();

    const channel = supabase
      .channel(`conv-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function send() {
    if (!user?.id) return;
    const body = text.trim();
    if (!body) return;

    const { error } = await supabase.from("messages").insert({
      conversation_id: id,
      sender_id: user.id,
      body,
    });

    if (error) {
      toast.push({ title: "Send failed", desc: error.message, kind: "err" });
      return;
    }
    setText("");
    await load();
  }

  return (
    <div className="mx-auto w-full max-w-[1480px] px-4">
      <section className="mt-4 page">
        <div className="grid gap-4">
          <Card className="p-4">
            <div className="text-sm font-semibold">Chat</div>
            <div className="text-xs text-(--muted2)">
              Keep it friendly. Version 1 = simple text.
            </div>
          </Card>

          <Card className="p-4">
            <div className="h-[58vh] overflow-y-auto rounded-2xl border border-(--stroke) bg-white/70 p-3">
              {loading ? (
                <div className="grid gap-2">
                  <div className="skeleton h-10 w-2/3" />
                  <div className="skeleton h-10 w-1/2" />
                  <div className="skeleton h-10 w-3/4" />
                </div>
              ) : msgs.length === 0 ? (
                <div className="emptyState">
                  <div className="emptyIcon">💭</div>
                  <div className="text-sm font-semibold">No messages yet</div>
                  <div className="text-sm text-(--muted)">
                    Start with a short intro.
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  {msgs.map((m) => {
                    const mine = m.sender_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm border border-(--stroke) ${
                            mine ? "bg-[rgba(47,99,255,.10)]" : "bg-white"
                          }`}
                        >
                          {m.body}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                className="input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
              />
              <Button onClick={send} disabled={!text.trim()}>
                Send
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
