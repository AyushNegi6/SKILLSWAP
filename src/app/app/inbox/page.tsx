import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui";

export default async function InboxPage() {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  const { data: convos } = await supabase
    .from("conversations")
    .select(
      `
      id,
      swap:swaps(
        id,status,teach_skill,learn_skill,requester_id,recipient_id,created_at,
        requester:profiles!swaps_requester_id_fkey(name),
        recipient:profiles!swaps_recipient_id_fkey(name)
      ),
      messages(body,created_at)
    `,
    )
    .order("created_at", { foreignTable: "messages", ascending: false })
    .limit(1, { foreignTable: "messages" });

  const list = (convos ?? []).map((c: any) => {
    const swap = c.swap;
    const me = auth.user!.id;
    const otherName =
      swap.requester_id === me ? swap.recipient?.name : swap.requester?.name;
    const last = (c.messages ?? [])[0];
    return { id: c.id, otherName, swap, last };
  });

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-semibold">Inbox</h1>
        <p className="mt-1 text-sm text-black/70">
          Email-style chat. No realtime needed.
        </p>
      </Card>

      <div className="space-y-3">
        {list.length === 0 ? (
          <Card>No conversations yet. Go to Explore and request a swap.</Card>
        ) : (
          list.map((c) => (
            <Link key={c.id} href={`/app/inbox/${c.id}`}>
              <Card className="hover:bg-white/90">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{c.otherName ?? "User"}</div>
                  <Badge>{c.swap.status}</Badge>
                </div>
                <div className="mt-1 text-sm text-black/70">
                  Swap: {c.swap.teach_skill} ↔ {c.swap.learn_skill}
                </div>
                <div className="mt-2 text-sm text-black/60">
                  {c.last?.body ? `Last: ${c.last.body}` : "No messages yet"}
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
