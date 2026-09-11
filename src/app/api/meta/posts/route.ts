import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchRecentInstagramMedia, fetchRecentFacebookPosts } from "@/lib/meta/graph-api";
import { decrypt } from "@/lib/whatsapp/encryption";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channel_id");

  if (!channelId) {
    return NextResponse.json({ error: "channel_id parameter is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: channel, error: chErr } = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .single();

  if (chErr || !channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  try {
    const decryptedToken = decrypt(channel.access_token);

    if (channel.platform === "instagram") {
      const posts = await fetchRecentInstagramMedia(channel.external_id, decryptedToken, 30);
      return NextResponse.json({ posts, platform: "instagram" });
    } else if (channel.platform === "facebook") {
      const posts = await fetchRecentFacebookPosts(channel.external_id, decryptedToken, 30);
      return NextResponse.json({ posts, platform: "facebook" });
    }

    return NextResponse.json({ posts: [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch posts from Meta" }, { status: 500 });
  }
}
