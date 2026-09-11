import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setInstagramIcebreakers } from "@/lib/meta/graph-api";
import { decrypt } from "@/lib/whatsapp/encryption";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch active account
  const { data: member } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const accountId = member?.account_id || user.id;

  const { data: channels, error } = await supabase
    .from("channels")
    .select("id, account_id, platform, external_id, name, username, avatar_url, status, settings, created_at, updated_at")
    .eq("account_id", accountId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ channels: channels || [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { channel_id, icebreakers, auto_like_comments, story_mention_reply_text } = body;

  if (!channel_id) {
    return NextResponse.json({ error: "channel_id is required" }, { status: 400 });
  }

  // Fetch channel
  const { data: channel, error: fetchErr } = await supabase
    .from("channels")
    .select("*")
    .eq("id", channel_id)
    .single();

  if (fetchErr || !channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  const updatedSettings = {
    ...channel.settings,
    ...(icebreakers !== undefined ? { icebreakers } : {}),
    ...(auto_like_comments !== undefined ? { auto_like_comments } : {}),
    ...(story_mention_reply_text !== undefined ? { story_mention_reply_text } : {}),
  };

  // If Instagram and icebreakers provided, update live on Meta
  if (channel.platform === "instagram" && icebreakers && Array.isArray(icebreakers)) {
    try {
      const decryptedToken = decrypt(channel.access_token);
      await setInstagramIcebreakers(channel.external_id, icebreakers, decryptedToken);
    } catch (_e) {
      // Non-blocking if Meta API fails
    }
  }

  const { data: updated, error: updateErr } = await supabase
    .from("channels")
    .update({
      settings: updatedSettings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", channel_id)
    .select("id, account_id, platform, external_id, name, username, avatar_url, status, settings, created_at, updated_at")
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ channel: updated });
}
