"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button, Card } from "@/components/ui";

type Profile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  city: string | null;
  online_only: boolean;
  teach_skills: string[];
  learn_skills: string[];
  bio: string | null;
};

function uniqClean(list: string[]) {
  const out: string[] = [];
  for (const raw of list) {
    const v = raw.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (!out.some((x) => x.toLowerCase() === key)) out.push(v);
  }
  return out;
}

function ChipsInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const parts = draft
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    if (!parts.length) return;
    onChange(uniqClean([...value, ...parts]));
    setDraft("");
  };

  return (
    <div>
      <div className="text-sm font-semibold">{label}</div>

      <div className="mt-2 flex flex-wrap gap-2">
        {value.map((s) => (
          <span
            key={s}
            className="chip inline-flex items-center gap-2 hoverlift"
          >
            {s}
            <button
              type="button"
              className="text-xs opacity-70 hover:opacity-100"
              onClick={() => onChange(value.filter((x) => x !== s))}
              aria-label={`Remove ${s}`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder || "Type and press Enter (or comma)"}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="soft" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [teach, setTeach] = useState<string[]>([]);
  const [learn, setLearn] = useState<string[]>([]);

  const canSave = useMemo(() => !!uid && !saving, [uid, saving]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id ?? null;
      if (!mounted) return;

      setUid(userId);

      if (!userId) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Try load profile row
      const { data: p, error } = await supabase
        .from("profiles")
        .select(
          "id,name,avatar_url,city,online_only,teach_skills,learn_skills,bio",
        )
        .eq("id", userId)
        .maybeSingle();

      if (!mounted) return;

      // ✅ If no row exists yet, create local blank profile (so UI works)
      const pp: Profile =
        (p as any) ??
        ({
          id: userId,
          name: null,
          avatar_url: null,
          city: null,
          online_only: false,
          teach_skills: [],
          learn_skills: [],
          bio: null,
        } as Profile);

      if (error && !p) {
        // If it’s a real error (not “no row”), show it once
        console.warn(error.message);
      }

      setProfile(pp);

      setName(pp.name || "");
      setCity(pp.city || "");
      setOnlineOnly(!!pp.online_only);
      setAvatarUrl(pp.avatar_url || "");
      setBio(pp.bio || "");
      setTeach(pp.teach_skills || []);
      setLearn(pp.learn_skills || []);

      setLoading(false);
    };

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const save = async () => {
    if (!uid) return;

    setSaving(true);

    const payload = {
      id: uid,
      name: name.trim() || null,
      city: city.trim() || null,
      online_only: onlineOnly,
      avatar_url: avatarUrl.trim() || null,
      bio: bio.trim() || null,
      teach_skills: uniqClean(teach),
      learn_skills: uniqClean(learn),
    };

    const { error } = await supabase.from("profiles").upsert(payload, {
      onConflict: "id",
    });

    setSaving(false);

    if (error) return alert(error.message);

    alert("Saved ✅");
  };

  if (loading) {
    return (
      <div className="page mx-auto w-full max-w-[1480px] px-2 sm:px-4 py-6">
        <div className="card p-6">
          <div className="h-6 w-40 skeleton" />
          <div className="mt-4 h-10 w-full skeleton" />
          <div className="mt-3 h-10 w-full skeleton" />
          <div className="mt-3 h-24 w-full skeleton" />
        </div>
      </div>
    );
  }

  if (!uid) {
    return (
      <div className="page mx-auto w-full max-w-[1480px] px-2 sm:px-4 py-6">
        <div className="card emptyState">
          <div className="emptyIcon">🔒</div>
          <div className="text-lg font-semibold">Login required</div>
          <div className="text-sm text-(--muted)">
            Please login to edit your profile.
          </div>
        </div>
      </div>
    );
  }

  // profile exists locally even if DB row didn't exist
  return (
    <div className="page mx-auto w-full max-w-[1480px] px-2 sm:px-4 py-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <Card className="p-6">
          <div className="text-xl font-semibold">Your profile</div>
          <div className="mt-1 text-sm text-(--muted)">
            Keep this basic. Swap details are chosen when you create a swap in
            Explore.
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-sm font-semibold">Name</div>
              <input
                className="input mt-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <div className="text-sm font-semibold">City</div>
              <input
                className="input mt-2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <div className="text-sm font-semibold">Avatar URL (optional)</div>
              <input
                className="input mt-2"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Paste image URL"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="text-sm font-semibold">Bio (optional)</div>
              <textarea
                className="input mt-2 min-h-[96px]"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <label className="sm:col-span-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlineOnly}
                onChange={(e) => setOnlineOnly(e.target.checked)}
              />
              I’m open to online-only swaps
            </label>
          </div>

          <div className="mt-6 grid gap-6">
            <ChipsInput
              label="Skills you can teach (optional)"
              value={teach}
              onChange={setTeach}
            />
            <ChipsInput
              label="Skills you want to learn (optional)"
              value={learn}
              onChange={setLearn}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button disabled={!canSave} onClick={save}>
              {saving ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-lg font-semibold">Preview</div>
          <div className="mt-4 flex items-center gap-3">
            <img
              src={
                avatarUrl.trim() ||
                `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || uid || "user")}`
              }
              className="h-14 w-14 rounded-2xl border border-(--stroke) bg-white object-cover"
              alt=""
            />
            <div>
              <div className="font-semibold">{name || "Your name"}</div>
              <div className="text-sm text-(--muted2)">
                {city || "Online"} {onlineOnly ? "• Online-only" : ""}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
