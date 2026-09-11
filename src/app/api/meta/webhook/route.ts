import crypto from "crypto";
import { NextResponse } from "next/server";
import { processIncomingComment } from "@/lib/automations/comment-engine";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Meta Webhook verification handshake (GET).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedVerifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || "deversol_meta_verify_token";

  if (mode === "subscribe" && token === expectedVerifyToken) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

/**
 * Validates Meta HMAC-SHA256 signature from x-hub-signature-256 header.
 */
function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret || !signatureHeader) return true; // Permissive in dev if secret not configured

  const signature = signatureHeader.startsWith("sha256=") ? signatureHeader.slice(7) : signatureHeader;
  const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch (_e) {
    return false;
  }
}

/**
 * Unified Meta Webhook event ingestion (POST).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch (_e) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { object, entry } = body;

  if (!Array.isArray(entry)) {
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  const supabase = getAdminClient();

  for (const item of entry) {
    // -------------------------------------------------------------
    // A. Instagram Webhook Events (object === 'instagram')
    // -------------------------------------------------------------
    if (object === "instagram") {
      const igAccountId = item.id;

      // 1. Comments changes (Post & Reel comment growth tool)
      if (Array.isArray(item.changes)) {
        for (const change of item.changes) {
          if (change.field === "comments" && change.value) {
            const val = change.value;
            // Ignore comment deletions or edits
            if (val.text && val.id) {
              await processIncomingComment({
                platform: "instagram",
                channelExternalId: igAccountId,
                postId: val.media?.id || "",
                commentId: val.id,
                commentText: val.text,
                senderId: val.from?.id || "",
                senderUsername: val.from?.username || "",
              }).catch((err) => console.error("[Webhook] IG comment process error:", err));
            }
          }
        }
      }

      // 2. Direct Messages (Inbound DMs, Story Mentions, Story Replies, Postbacks)
      if (Array.isArray(item.messaging)) {
        for (const msg of item.messaging) {
          const senderId = msg.sender?.id;
          const recipientId = msg.recipient?.id;
          const messageObj = msg.message;
          const postbackObj = msg.postback;

          // Ignore echoes (messages sent by our own business)
          if (messageObj?.is_echo) continue;

          // Save / update conversation and message in Supabase
          if (senderId && (messageObj || postbackObj)) {
            try {
              const textContent = messageObj?.text || postbackObj?.title || "Sent an attachment";
              const metaMsgId = messageObj?.mid || postbackObj?.mid || `ig_${Date.now()}`;

              // Find channel
              const { data: ch } = await supabase
                .from("channels")
                .select("id, account_id")
                .eq("platform", "instagram")
                .eq("external_id", igAccountId)
                .single();

              if (ch) {
                // Upsert Contact
                const { data: contact } = await supabase
                  .from("contacts")
                  .upsert(
                    {
                      account_id: ch.account_id,
                      name: `Instagram User (${senderId.slice(-4)})`,
                      ig_id: senderId,
                      preferred_channel: "instagram",
                    },
                    { onConflict: "ig_id" }
                  )
                  .select("id")
                  .single();

                // Upsert Conversation
                const { data: conv } = await supabase
                  .from("conversations")
                  .upsert(
                    {
                      account_id: ch.account_id,
                      channel: "instagram",
                      channel_id: ch.id,
                      contact_id: contact?.id || null,
                      external_user_id: senderId,
                      last_message_preview: textContent.slice(0, 100),
                      last_message_at: new Date().toISOString(),
                      status: "open",
                    },
                    { onConflict: "channel,external_user_id" }
                  )
                  .select("id")
                  .single();

                // Insert Message
                if (conv) {
                  await supabase.from("messages").insert({
                    conversation_id: conv.id,
                    channel: "instagram",
                    direction: "inbound",
                    sender_type: "customer",
                    content_type: messageObj?.attachments ? "image" : "text",
                    content_text: textContent,
                    meta_message_id: metaMsgId,
                  });
                }
              }
            } catch (err) {
              console.error("[Webhook] Error saving IG DM:", err);
            }
          }
        }
      }
    }

    // -------------------------------------------------------------
    // B. Facebook Page Events (object === 'page')
    // -------------------------------------------------------------
    if (object === "page") {
      const pageId = item.id;

      // 1. Page Feed changes (Post & Ad comment growth tools)
      if (Array.isArray(item.changes)) {
        for (const change of item.changes) {
          if (change.field === "feed" && change.value) {
            const val = change.value;
            if (val.item === "comment" && val.verb === "add" && val.message) {
              await processIncomingComment({
                platform: "facebook",
                channelExternalId: pageId,
                postId: val.post_id || "",
                commentId: val.comment_id,
                commentText: val.message,
                senderId: val.sender_id || val.from?.id || "",
                senderName: val.sender_name || val.from?.name || "",
              }).catch((err) => console.error("[Webhook] FB comment process error:", err));
            }
          }
        }
      }

      // 2. Facebook Messenger messages
      if (Array.isArray(item.messaging)) {
        for (const msg of item.messaging) {
          const senderId = msg.sender?.id;
          const messageObj = msg.message;
          const postbackObj = msg.postback;

          if (messageObj?.is_echo) continue;

          if (senderId && (messageObj || postbackObj)) {
            try {
              const textContent = messageObj?.text || postbackObj?.title || "Sent an attachment";
              const metaMsgId = messageObj?.mid || `fb_${Date.now()}`;

              const { data: ch } = await supabase
                .from("channels")
                .select("id, account_id")
                .eq("platform", "facebook")
                .eq("external_id", pageId)
                .single();

              if (ch) {
                const { data: contact } = await supabase
                  .from("contacts")
                  .upsert(
                    {
                      account_id: ch.account_id,
                      name: `Facebook User (${senderId.slice(-4)})`,
                      fb_psid: senderId,
                      preferred_channel: "facebook",
                    },
                    { onConflict: "fb_psid" }
                  )
                  .select("id")
                  .single();

                const { data: conv } = await supabase
                  .from("conversations")
                  .upsert(
                    {
                      account_id: ch.account_id,
                      channel: "facebook",
                      channel_id: ch.id,
                      contact_id: contact?.id || null,
                      external_user_id: senderId,
                      last_message_preview: textContent.slice(0, 100),
                      last_message_at: new Date().toISOString(),
                      status: "open",
                    },
                    { onConflict: "channel,external_user_id" }
                  )
                  .select("id")
                  .single();

                if (conv) {
                  await supabase.from("messages").insert({
                    conversation_id: conv.id,
                    channel: "facebook",
                    direction: "inbound",
                    sender_type: "customer",
                    content_type: "text",
                    content_text: textContent,
                    meta_message_id: metaMsgId,
                  });
                }
              }
            } catch (err) {
              console.error("[Webhook] Error saving FB message:", err);
            }
          }
        }
      }
    }
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
