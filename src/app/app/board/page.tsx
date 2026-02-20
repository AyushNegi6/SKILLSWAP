"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, Badge, Button } from "@/components/ui";

type FeedItem = {
  id: string;
  text: string;
  created_at: string;
};

function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return createClient(url, key);
}

export default function BoardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    if (!url || !key) {
      setError("Missing Supabase env vars in .env.local");
      setLoading(false);
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = supabaseBrowser();
        const { data, error: e } = await supabase
          .from("activity_feed")
          .select("id,text,created_at")
          .order("created_at", { ascending: false })
          .limit(20);

        if (e) setError(e.message);
        setFeed((data ?? []) as FeedItem[]);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load board");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Public board</div>
            <div className="text-xs text-(--muted2)">
              Real swaps posted by users
            </div>
          </div>
          <Badge>public</Badge>
        </div>
      </Card>

      {error && (
        <Card className="p-5">
          <div className="text-sm font-semibold">Can’t load board</div>
          <div className="mt-2 text-sm text-(--muted)">{error}</div>
        </Card>
      )}

      {!error && !loading && feed.length === 0 && (
        <Card className="p-6">
          <div className="text-sm font-semibold">No swaps yet</div>
          <div className="mt-2 text-sm text-(--muted)">
            When people complete a swap, it will show here.
          </div>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {!error &&
          feed.map((x) => (
            <Card key={x.id} className="p-5">
              <div className="text-sm font-semibold">{x.text}</div>
              <div className="mt-2 text-xs text-(--muted2)">
                {new Date(x.created_at).toLocaleString()}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="soft" className="w-full">
                  👏 Nice
                </Button>
                <Button variant="soft" className="w-full">
                  Share
                </Button>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
