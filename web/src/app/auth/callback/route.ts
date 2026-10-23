import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { authConfigured } from "@/lib/supabase/env";

/** Only allow redirects to a page on this site. */
const safePath = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/");

/** Where Google and the email link send people back to. Turns the one-time code into a session. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safePath(searchParams.get("next"));
  const code = searchParams.get("code");

  if (authConfigured && code) {
    const supabase = await getServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/signin?error=1&next=${encodeURIComponent(next)}`);
}
