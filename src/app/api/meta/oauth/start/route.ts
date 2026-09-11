import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMetaOAuthUrl } from "@/lib/meta/oauth";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/login`);
  }

  // Fetch the user's active account
  const { data: member } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const accountId = member?.account_id || user.id;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const redirectUri = `${baseUrl}/api/meta/oauth/callback`;

  // Encode state payload with account ID and nonce
  const statePayload = Buffer.from(
    JSON.stringify({
      accountId,
      userId: user.id,
      timestamp: Date.now(),
    })
  ).toString("base64url");

  const authUrl = getMetaOAuthUrl(redirectUri, statePayload);
  return NextResponse.redirect(authUrl);
}
