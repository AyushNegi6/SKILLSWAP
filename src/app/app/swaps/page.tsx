import { supabaseServer } from "@/lib/supabase/server";
import { Card, Button, Badge } from "@/components/ui";
import { updateSwapStatus } from "./actions";

export default async function SwapsPage() {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  const { data: swaps } = await supabase
    .from("swaps")
    .select(
      `
      id,status,teach_skill,learn_skill,message,created_at,
      requester_id,recipient_id,
      requester:profiles!swaps_requester_id_fkey(name),
      recipient:profiles!swaps_recipient_id_fkey(name)
    `,
    )
    .or(`requester_id.eq.${auth.user!.id},recipient_id.eq.${auth.user!.id}`)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-semibold">Swaps</h1>
        <p className="mt-1 text-sm text-black/70">
          Accept/decline/completed. Completed swaps appear on the public board.
        </p>
      </Card>

      <div className="space-y-3">
        {(swaps ?? []).length === 0 ? (
          <Card>No swaps yet. Go explore and request one.</Card>
        ) : (
          swaps!.map((s: any) => {
            const isRecipient = s.recipient_id === auth.user!.id;

            return (
              <Card key={s.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">
                    {s.requester?.name} ↔ {s.recipient?.name}
                  </div>
                  <Badge>{s.status}</Badge>
                </div>

                <div className="mt-1 text-sm text-black/70">
                  {s.teach_skill} ↔ {s.learn_skill}
                </div>

                {s.message && (
                  <div className="mt-2 text-sm text-black/60">{s.message}</div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {isRecipient && s.status === "pending" && (
                    <>
                      <form action={updateSwapStatus}>
                        <input type="hidden" name="swapId" value={s.id} />
                        <input type="hidden" name="status" value="accepted" />
                        <Button type="submit">Accept</Button>
                      </form>
                      <form action={updateSwapStatus}>
                        <input type="hidden" name="swapId" value={s.id} />
                        <input type="hidden" name="status" value="declined" />
                        <Button type="submit" variant="ghost">
                          Decline
                        </Button>
                      </form>
                    </>
                  )}

                  {(s.status === "accepted" || s.status === "pending") && (
                    <form action={updateSwapStatus}>
                      <input type="hidden" name="swapId" value={s.id} />
                      <input type="hidden" name="status" value="completed" />
                      <Button type="submit" variant="ghost">
                        Mark completed
                      </Button>
                    </form>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
