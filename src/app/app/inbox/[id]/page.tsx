import { supabaseServer } from "@/lib/supabase/server";
import { Card, Textarea, Button, Badge } from "@/components/ui";
import { sendMessage } from "./actions";

export default async function ThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const conversationId = params.id;
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  const { data: convo } = await supabase
    .from("conversations")
    .select(
      `
      id,
      swap:swaps(id,status,teach_skill,learn_skill,requester_id,recipient_id)
    `,
    )
    .eq("id", conversationId)
    .single();

  const { data: msgs } = await supabase
    .from("messages")
    .select("id,body,sender_id,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Conversation</div>
          <Badge>{convo?.swap?.status ?? "unknown"}</Badge>
        </div>
        <div className="mt-1 text-sm text-black/70">
          Swap: {convo?.swap?.teach_skill} ↔ {convo?.swap?.learn_skill}
        </div>
      </Card>

      <Card className="space-y-3">
        {(msgs ?? []).map((m) => {
          const mine = m.sender_id === auth.user!.id;
          return (
            <div
              key={m.id}
              className={`rounded-xl px-3 py-2 text-sm ${
                mine
                  ? "bg-black text-white ml-auto w-fit max-w-[80%]"
                  : "bg-black/5 w-fit max-w-[80%]"
              }`}
            >
              {m.body}
            </div>
          );
        })}
        {(msgs ?? []).length === 0 && (
          <div className="text-sm text-black/70">No messages yet. Say hi.</div>
        )}
      </Card>

      <Card>
        <form
          action={sendMessage.bind(null, conversationId)}
          className="space-y-3"
        >
          <Textarea name="body" rows={3} placeholder="Type a message..." />
          <Button type="submit" className="w-full">
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}
