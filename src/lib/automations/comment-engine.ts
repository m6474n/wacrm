/**
 * Post & Reel Comment Automation Engine (ManyChat-Grade)
 *
 * Handles:
 * - Real-time keyword matching on Instagram & Facebook comments
 * - Spintax randomized public comment replies to avoid Meta spam detection
 * - Automated comment liking
 * - Contact creation/enrichment in CRM
 * - Automated instant DM delivery with interactive buttons / links
 * - Live analytics tracking
 */

import { createClient } from "@supabase/supabase-js";
import {
  sendInstagramCommentReply,
  likeInstagramComment,
  sendInstagramDM,
  sendFacebookCommentReply,
  sendFacebookMessage,
} from "@/lib/meta/graph-api";
import { decrypt } from "@/lib/whatsapp/encryption";
import type { PostAutomation } from "@/types";

// Service client for automated background webhook processing
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Parses Spintax syntax e.g. "{Hey|Hi|Hello} @{{username}}! {Check your DM|Sent it 🚀}"
 */
export function parseSpintax(template: string, variables: Record<string, string> = {}): string {
  let result = template.replace(/\{([^{}]+)\}/g, (_match, group) => {
    const options = group.split("|");
    const picked = options[Math.floor(Math.random() * options.length)];
    return picked.trim();
  });

  // Interpolate variables e.g. {{username}}
  for (const [key, val] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
  }

  return result;
}

/**
 * Evaluates whether a comment matches the automation keywords.
 */
export function matchesKeywords(
  commentText: string,
  keywords: string[],
  matchType: "all" | "exact" | "contains" | "word"
): boolean {
  if (!keywords || keywords.length === 0 || matchType === "all") {
    return true; // Matches any comment
  }

  const cleanText = commentText.trim().toLowerCase();

  return keywords.some((kw) => {
    const cleanKw = kw.trim().toLowerCase();
    if (!cleanKw) return false;

    switch (matchType) {
      case "exact":
        return cleanText === cleanKw;
      case "word": {
        const regex = new RegExp(`\\b${cleanKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        return regex.test(commentText);
      }
      case "contains":
      default:
        return cleanText.includes(cleanKw);
    }
  });
}

export interface IncomingCommentEvent {
  platform: "instagram" | "facebook";
  channelExternalId: string; // IG Account ID or FB Page ID
  postId: string;
  commentId: string;
  commentText: string;
  senderId: string; // IGSID or PSID
  senderUsername?: string;
  senderName?: string;
}

/**
 * Core event processor for incoming Instagram & Facebook comments.
 */
export async function processIncomingComment(event: IncomingCommentEvent): Promise<{ handled: boolean; reason?: string }> {
  const supabase = getAdminClient();

  // 1. Fetch connected channel
  const { data: channel, error: chErr } = await supabase
    .from("channels")
    .select("*")
    .eq("platform", event.platform)
    .eq("external_id", event.channelExternalId)
    .single();

  if (chErr || !channel) {
    return { handled: false, reason: "Channel not found" };
  }

  // Avoid self-replies
  if (channel.external_id === event.senderId || (channel.username && channel.username === event.senderUsername)) {
    return { handled: false, reason: "Self-comment ignored" };
  }

  // 2. Fetch active post_automations for this channel
  const { data: automations, error: autoErr } = await supabase
    .from("post_automations")
    .select("*")
    .eq("channel_id", channel.id)
    .eq("status", "active");

  if (autoErr || !automations || automations.length === 0) {
    return { handled: false, reason: "No active automations for channel" };
  }

  let decryptedToken: string;
  try {
    decryptedToken = decrypt(channel.access_token);
  } catch (err: any) {
    return { handled: false, reason: `Token decryption error: ${err.message}` };
  }

  // 3. Find matching automation
  const matched = (automations as PostAutomation[]).find((auto) => {
    // Post ID matching
    const postMatches =
      auto.target_type === "all_posts" ||
      auto.target_type === "next_post" ||
      auto.target_type === "reels_only" ||
      auto.target_post_id === event.postId;

    if (!postMatches) return false;

    // Keyword matching
    return matchesKeywords(event.commentText, auto.keywords, auto.keyword_match_type);
  });

  if (!matched) {
    return { handled: false, reason: "No automation keyword/post match" };
  }

  const variables = {
    username: event.senderUsername || event.senderName || "there",
    name: event.senderName || event.senderUsername || "there",
  };

  // 4. Send Public Comment Reply (if configured)
  if (matched.public_replies && matched.public_replies.length > 0) {
    const rawTemplate = matched.public_replies[Math.floor(Math.random() * matched.public_replies.length)];
    const replyText = parseSpintax(rawTemplate, variables);

    try {
      if (event.platform === "instagram") {
        await sendInstagramCommentReply(event.commentId, replyText, decryptedToken);
      } else {
        await sendFacebookCommentReply(event.commentId, replyText, decryptedToken);
      }
    } catch (err) {
      console.error("[CommentEngine] Failed to send public comment reply:", err);
    }
  }

  // 5. Auto-like comment (if enabled)
  if (matched.auto_like_comment && event.platform === "instagram") {
    likeInstagramComment(event.commentId, decryptedToken).catch(() => false);
  }

  // 6. Upsert Contact into CRM
  try {
    const contactData: any = {
      account_id: channel.account_id,
      name: event.senderName || event.senderUsername || "Social Lead",
      preferred_channel: event.platform,
      user_id: channel.settings?.connected_by || channel.account_id,
    };

    if (event.platform === "instagram") {
      contactData.ig_username = event.senderUsername;
      contactData.ig_id = event.senderId;
    } else {
      contactData.fb_psid = event.senderId;
    }

    await supabase.from("contacts").upsert(contactData, {
      onConflict: event.platform === "instagram" ? "ig_id" : "fb_psid",
      ignoreDuplicates: false,
    });
  } catch (_e) {
    // Non-blocking contact sync
  }

  // 7. Send Instant DM
  if (matched.dm_message_payload) {
    const dmText = parseSpintax(matched.dm_message_payload.text || "Hey! Here is the info you requested.", variables);
    const dmButtons = matched.dm_message_payload.buttons?.map((b) => ({
      title: b.title,
      url: b.url,
      payload: b.flow_node_key || b.title,
    }));

    try {
      if (event.platform === "instagram") {
        await sendInstagramDM(
          channel.external_id,
          event.senderId,
          {
            text: dmText,
            buttons: dmButtons,
          },
          decryptedToken
        );
      } else {
        await sendFacebookMessage(
          channel.external_id,
          event.senderId,
          {
            text: dmText,
            buttons: dmButtons,
          },
          decryptedToken
        );
      }
    } catch (err) {
      console.error("[CommentEngine] Failed to send instant DM:", err);
    }
  }

  // 8. Update stats on automation
  const currentStats = matched.stats || { comments: 0, dms_sent: 0, button_clicks: 0, leads_captured: 0 };
  await supabase
    .from("post_automations")
    .update({
      stats: {
        ...currentStats,
        comments: (currentStats.comments || 0) + 1,
        dms_sent: (currentStats.dms_sent || 0) + 1,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", matched.id);

  return { handled: true };
}
