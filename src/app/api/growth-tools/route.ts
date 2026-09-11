import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const accountId = member?.account_id || user.id;

  const { data: automations, error } = await supabase
    .from("post_automations")
    .select("*, channel:channels(id, name, username, platform, avatar_url)")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ automations: automations || [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const accountId = member?.account_id || user.id;
  const body = await request.json();

  const {
    channel_id,
    platform,
    name,
    target_type = "specific_post",
    target_post_id,
    target_post_url,
    target_post_thumbnail,
    keyword_match_type = "contains",
    keywords = [],
    public_replies = [],
    auto_like_comment = true,
    dm_message_payload,
  } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!platform || (platform !== "instagram" && platform !== "facebook")) {
    return NextResponse.json({ error: "Valid platform is required (instagram or facebook)" }, { status: 400 });
  }

  const { data: newAutomation, error } = await supabase
    .from("post_automations")
    .insert({
      account_id: accountId,
      channel_id: channel_id || null,
      platform,
      name,
      target_type,
      target_post_id: target_post_id || null,
      target_post_url: target_post_url || null,
      target_post_thumbnail: target_post_thumbnail || null,
      keyword_match_type,
      keywords: Array.isArray(keywords) ? keywords : [],
      public_replies: Array.isArray(public_replies) ? public_replies : [],
      auto_like_comment: Boolean(auto_like_comment),
      dm_message_payload: dm_message_payload || { text: "Hey! Here is what you requested." },
      stats: { comments: 0, dms_sent: 0, button_clicks: 0, leads_captured: 0 },
      status: "active",
    })
    .select("*, channel:channels(id, name, username, platform, avatar_url)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ automation: newAutomation }, { status: 201 });
}
