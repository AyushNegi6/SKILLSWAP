"use client";

import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";
import { Button, Badge, Card } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";

type Tone = "blue" | "indigo" | "sky" | "slate" | "emerald" | "rose";

function Tile({
  label,
  sub,
  tone = "blue",
  rotate = "0deg",
  src,
}: {
  label: string;
  sub: string;
  tone?: Tone;
  rotate?: string;
  src: string;
}) {
  const accent =
    tone === "blue"
      ? "bg-blue-600"
      : tone === "indigo"
        ? "bg-indigo-600"
        : tone === "sky"
          ? "bg-sky-600"
          : tone === "emerald"
            ? "bg-emerald-600"
            : tone === "rose"
              ? "bg-rose-600"
              : "bg-slate-700";

  const size = "h-32 w-32 sm:h-36 sm:w-36 lg:h-40 lg:w-40";

  return (
    <div
      className="pointer-events-none select-none rotate-[var(--r)]"
      style={{ ["--r" as any]: rotate }}
    >
      <div className="rounded-[1.1rem] bg-white/92 p-2 shadow-sm">
        <div className="relative overflow-hidden rounded-[0.95rem] border border-slate-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className={`block object-cover ${size}`}
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/0 via-white/0 to-white/35" />
          <div className="absolute left-2 top-2 h-5 w-5 rounded-full bg-white/80" />
          <div
            className={`absolute left-2 top-2 h-5 w-5 rounded-full ${accent} opacity-90`}
          />
          <div className="absolute inset-x-0 bottom-0 p-2">
            <div className="rounded-xl border border-slate-200 bg-white/85 px-3 py-2 backdrop-blur">
              <div className="text-xs font-semibold text-slate-900">
                {label}
              </div>
              <div className="text-[11px] text-slate-500">{sub}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScrollColumn({
  tiles,
  direction = "up",
}: {
  tiles: Array<{
    label: string;
    sub: string;
    tone: Tone;
    rotate: string;
    src: string;
  }>;
  direction?: "up" | "down";
}) {
  const animation =
    direction === "up"
      ? "tileMarqueeUp 26s linear infinite"
      : "tileMarqueeDown 26s linear infinite";

  return (
    <div className="relative h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-linear-to-b from-white/95 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-linear-to-t from-white/95 to-transparent" />
      <div
        className="will-change-transform"
        style={{
          display: "flex",
          flexDirection: "column",
          animation,
          transform: "translateZ(0)",
          pointerEvents: "none",
        }}
      >
        <div className="flex flex-col gap-6 py-6">
          {tiles.map((t, i) => (
            <Tile key={`a-${t.label}-${i}`} {...t} />
          ))}
        </div>
        <div className="flex flex-col gap-6 py-6">
          {tiles.map((t, i) => (
            <Tile key={`b-${t.label}-${i}`} {...t} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();

  const leftCol1 = [
    {
      label: "Coding",
      sub: "teach",
      tone: "blue",
      rotate: "-8deg",
      src: "/tiles/coding.jpg",
    },
    {
      label: "Cooking",
      sub: "learn",
      tone: "rose",
      rotate: "7deg",
      src: "/tiles/cooking.jpg",
    },
    {
      label: "Excel",
      sub: "teach",
      tone: "emerald",
      rotate: "-6deg",
      src: "/tiles/excel.jpg",
    },
    {
      label: "Resume",
      sub: "swap",
      tone: "sky",
      rotate: "8deg",
      src: "/tiles/resume.jpg",
    },
    {
      label: "Chess",
      sub: "learn",
      tone: "slate",
      rotate: "-6deg",
      src: "/tiles/chess.jpg",
    },
    {
      label: "UI Design",
      sub: "teach",
      tone: "sky",
      rotate: "6deg",
      src: "/tiles/design.jpg",
    },
  ] as const;

  const leftCol2 = [
    {
      label: "Java",
      sub: "teach",
      tone: "indigo",
      rotate: "6deg",
      src: "/tiles/java.jpg",
    },
    {
      label: "React",
      sub: "learn",
      tone: "blue",
      rotate: "-6deg",
      src: "/tiles/react.jpg",
    },
    {
      label: "Typing",
      sub: "learn",
      tone: "sky",
      rotate: "7deg",
      src: "/tiles/typing.jpg",
    },
    {
      label: "Interview",
      sub: "learn",
      tone: "rose",
      rotate: "-7deg",
      src: "/tiles/interview.jpg",
    },
    {
      label: "Drawing",
      sub: "teach",
      tone: "indigo",
      rotate: "6deg",
      src: "/tiles/drawing.jpg",
    },
    {
      label: "Productivity",
      sub: "learn",
      tone: "slate",
      rotate: "-6deg",
      src: "/tiles/productivity.jpg",
    },
  ] as const;

  const rightCol1 = [
    {
      label: "Guitar",
      sub: "learn",
      tone: "indigo",
      rotate: "7deg",
      src: "/tiles/guitar.jpg",
    },
    {
      label: "English",
      sub: "learn",
      tone: "slate",
      rotate: "-6deg",
      src: "/tiles/english.jpg",
    },
    {
      label: "Speaking",
      sub: "learn",
      tone: "rose",
      rotate: "6deg",
      src: "/tiles/speaking.jpg",
    },
    {
      label: "Camera",
      sub: "swap",
      tone: "slate",
      rotate: "-6deg",
      src: "/tiles/camera.jpg",
    },
    {
      label: "Photography",
      sub: "swap",
      tone: "sky",
      rotate: "7deg",
      src: "/tiles/photography.jpg",
    },
    {
      label: "Piano",
      sub: "learn",
      tone: "rose",
      rotate: "-6deg",
      src: "/tiles/piano.jpg",
    },
  ] as const;

  const rightCol2 = [
    {
      label: "Fitness",
      sub: "swap",
      tone: "emerald",
      rotate: "-7deg",
      src: "/tiles/fitness.jpg",
    },
    {
      label: "Design",
      sub: "teach",
      tone: "sky",
      rotate: "6deg",
      src: "/tiles/design2.jpg",
    },
    {
      label: "DSA",
      sub: "swap",
      tone: "blue",
      rotate: "-6deg",
      src: "/tiles/dsa.jpg",
    },
    {
      label: "Sketching",
      sub: "learn",
      tone: "slate",
      rotate: "6deg",
      src: "/tiles/sketch.jpg",
    },
    {
      label: "Presentation",
      sub: "teach",
      tone: "emerald",
      rotate: "-6deg",
      src: "/tiles/presentation.jpg",
    },
    {
      label: "Music",
      sub: "learn",
      tone: "indigo",
      rotate: "6deg",
      src: "/tiles/music.jpg",
    },
  ] as const;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <style>{`
        @keyframes tileMarqueeUp { 0%{transform:translate3d(0,0%,0)} 100%{transform:translate3d(0,-50%,0)} }
        @keyframes tileMarqueeDown { 0%{transform:translate3d(0,-50%,0)} 100%{transform:translate3d(0,0%,0)} }
      `}</style>

      <div className="bg-grid absolute inset-0 opacity-20" />
      <AppNavbar />

      <main className="relative z-10">
        <div className="mx-auto w-full max-w-[1480px] px-4">
          <section className="relative mt-4 h-[calc(100vh-88px)]">
            <div className="relative h-full w-full overflow-hidden rounded-[2.75rem] border border-slate-200 bg-white shadow-sm">
              <div className="absolute inset-y-0 left-0 z-10 hidden w-[380px] grid-cols-2 gap-6 px-6 py-6 lg:grid">
                <ScrollColumn tiles={[...leftCol1]} direction="up" />
                <ScrollColumn tiles={[...leftCol2]} direction="down" />
              </div>

              <div className="absolute inset-y-0 right-0 z-10 hidden w-[380px] grid-cols-2 gap-6 px-6 py-6 lg:grid">
                <ScrollColumn tiles={[...rightCol1]} direction="down" />
                <ScrollColumn tiles={[...rightCol2]} direction="up" />
              </div>

              <div className="relative z-20 flex h-full items-center justify-center px-6 lg:px-[410px]">
                <div className="w-full max-w-[760px] text-center">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Badge>Peer-to-peer</Badge>
                    <Badge>Free</Badge>
                    <Badge>Async chat</Badge>
                    <Badge>City / Online</Badge>
                  </div>

                  <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02]">
                    Teach one skill,
                    <br />
                    learn another.
                  </h1>

                  <p className="mt-5 text-sm sm:text-base leading-7 text-slate-600">
                    Create a profile, find people nearby (or online), request a
                    swap, then learn in a simple message thread.
                  </p>

                  <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                    {user ? (
                      <>
                        <Link href="/app/explore">
                          <Button className="px-7 py-2.5">Explore</Button>
                        </Link>
                        <Link href="/app/messages">
                          <Button variant="soft" className="px-7 py-2.5">
                            Messages
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/login">
                          <Button className="px-7 py-2.5">Get started</Button>
                        </Link>
                        <Link href="/login">
                          <Button variant="soft" className="px-7 py-2.5">
                            Create profile
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="mt-8 hidden sm:grid grid-cols-3 gap-3">
                    <Card className="p-4">
                      <div className="text-xs text-(--muted2)">Matching</div>
                      <div className="mt-1 text-sm font-semibold">
                        Skills + city
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-xs text-(--muted2)">Messaging</div>
                      <div className="mt-1 text-sm font-semibold">
                        Accepted swaps only
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-xs text-(--muted2)">Trust</div>
                      <div className="mt-1 text-sm font-semibold">Reviews</div>
                    </Card>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-white/70 to-transparent z-30" />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
