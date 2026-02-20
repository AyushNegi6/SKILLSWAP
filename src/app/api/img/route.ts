import { NextResponse } from "next/server";

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function normalizeKey(q: string) {
  const s = q.trim().toLowerCase();
  const first = s.split(/\s+/)[0] ?? s;

  // keep keys stable and simple
  const map: Record<string, string> = {
    // learning/teaching labels -> image keys
    coding: "coding",
    computer: "coding",

    design: "design",
    "web design": "design",

    guitar: "guitar",
    piano: "piano",

    cooking: "cooking",
    yoga: "yoga",
    fitness: "fitness",
    camera: "camera",

    english: "english",
    speaking: "english",

    excel: "excel",
    spreadsheet: "excel",

    resume: "resume file",
    cv: "resume",

    drawing: "drawing",
    sketch: "drawing",
  };

  return map[s] || map[first] || first || s;
}

/**
 * Curated = guaranteed correct “photo vibe” images.
 * Uses Special:FilePath so you don't need the long upload.wikimedia.org hash URL.
 */
const CURATED_FILES: Record<string, string> = {
  // Cooking: people cooking in kitchen (photo)
  cooking: "People_Cooking_in_the_Kitchen_10.jpg", // :contentReference[oaicite:1]{index=1}

  // Guitar: clean guitar photo
  guitar: "Guitar_2.jpg", // :contentReference[oaicite:2]{index=2}

  // Coding: keyboard photo
  coding: "Computer_Keyboard_1_2018-06-16.jpg", // :contentReference[oaicite:3]{index=3}

  // Yoga: yoga class photo
  yoga: "YogaClass.jpg", // :contentReference[oaicite:4]{index=4}

  // Camera: old camera photo
  camera: "Old_camera-whole.jpg", // :contentReference[oaicite:5]{index=5}

  // Fitness: workout photo
  fitness: "Gym_Working_out.jpg", // :contentReference[oaicite:6]{index=6}

  // Excel: closeup spreadsheet photo
  excel: "Closeup_of_Excel_Spreadsheet_template_to_track_printouts_(29911005444).jpg", // :contentReference[oaicite:7]{index=7}

  // Resume/CV: curriculum vitae photo
  resume: "Foto_Curriculum_Vitae.jpg", // :contentReference[oaicite:8]{index=8}

  // Piano: simple piano photo
  piano: "A_piano.jpg", // :contentReference[oaicite:9]{index=9}

  // English speaking: microphone photo
  english: "Microphone_1.jpg", // :contentReference[oaicite:10]{index=10}

  // Drawing: pencil drawing photo
  drawing: "Pencil_drawing_photo_Vladimir_Dashyan2.jpg", // :contentReference[oaicite:11]{index=11}

  // Design: web design photo
  design: "Web_design_-_geograph.org.uk_-_3147325.jpg", // :contentReference[oaicite:12]{index=12}
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawQ = (searchParams.get("q") ?? "").trim();
  const seed = searchParams.get("seed") ?? "1";

  const fallback = `https://picsum.photos/seed/${encodeURIComponent(
    rawQ || "skillswap"
  )}-${seed}/720/720`;

  if (!rawQ) return NextResponse.redirect(fallback, { status: 307 });

  const key = normalizeKey(rawQ);

  // ✅ 1) Curated-first (guaranteed correct)
  const curated = CURATED_FILES[key];
  if (curated) {
    const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
      curated
    )}?width=720`;
    return NextResponse.redirect(url, { status: 307 });
  }

  // ✅ 2) If not curated, try Commons search (best-effort)
  const base = key;
  const q = `${base} photo`;

  const cirrus = [
    `(${q})`,
    `(filemime:image/jpeg OR filemime:image/png)`,
    `-filemime:image/svg+xml`,
    `-intitle:logo -intitle:icon -intitle:diagram -intitle:map -intitle:flag`,
    `-insource:svg -insource:vector`,
  ].join(" ");

  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("origin", "*");

  api.searchParams.set("generator", "search");
  api.searchParams.set("gsrnamespace", "6");
  api.searchParams.set("gsrlimit", "18");
  api.searchParams.set("gsrwhat", "text");
  api.searchParams.set("gsrsort", "relevance");
  api.searchParams.set("gsrsearch", cirrus);

  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url");
  api.searchParams.set("iiurlwidth", "720");
  api.searchParams.set("iiurlheight", "720");

  try {
    const res = await fetch(api.toString(), { next: { revalidate: 60 * 60 } });
    if (!res.ok) return NextResponse.redirect(fallback, { status: 307 });

    const data: any = await res.json();
    const pages: any[] = data?.query?.pages ? Object.values(data.query.pages) : [];

    const urls: string[] = [];
    for (const p of pages) {
      const u = p?.imageinfo?.[0]?.thumburl || p?.imageinfo?.[0]?.url;
      if (typeof u === "string" && u.startsWith("http")) urls.push(u);
    }

    if (!urls.length) return NextResponse.redirect(fallback, { status: 307 });

    const idx = Math.abs(hash(`${base}-${seed}`)) % urls.length;
    return NextResponse.redirect(urls[idx], { status: 307 });
  } catch {
    return NextResponse.redirect(fallback, { status: 307 });
  }
}
