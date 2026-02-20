import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function supabaseServer() {
  const cookieStore: any = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // ✅ Works on older Next: build cookie list using cookieStore.get(name)
        getAll() {
          const names = [
            "sb-access-token",
            "sb-refresh-token",
            "sb-auth-token",
            "sb:token",
            "supabase-auth-token",
          ];

          const out: Array<{ name: string; value: string }> = [];

          for (const name of names) {
            const c = cookieStore.get?.(name);
            if (c?.value) out.push({ name, value: c.value });
          }

          return out;
        },

        // ✅ Works on older Next as well
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }: any) => {
            // Some Next versions use cookieStore.set(name,value,options)
            // some accept an object.
            try {
              cookieStore.set?.(name, value, options);
            } catch {
              cookieStore.set?.({ name, value, ...options });
            }
          });
        },
      },
    }
  );
}
