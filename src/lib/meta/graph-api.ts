/**
 * Meta Graph API Client for Instagram & Facebook Messenger
 *
 * Implements ManyChat-level communication capabilities:
 * - Sending Instagram DMs (Text, Quick Replies, Buttons, Generic Templates)
 * - Sending Instagram Comment Replies & Liking Comments
 * - Sending Facebook Messenger Messages (Text, Buttons, Generic Templates)
 * - Fetching active Instagram Posts / Reels / Stories
 * - Configuring Instagram DM Icebreakers
 */

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE_URL = "https://graph.facebook.com";

export interface MetaMediaItem {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  comments_count?: number;
  like_count?: number;
}

export interface MetaPostItem {
  id: string;
  message?: string;
  created_time: string;
  permalink_url?: string;
  full_picture?: string;
}

/**
 * Sends a Direct Message to an Instagram user.
 */
export async function sendInstagramDM(
  igAccountId: string,
  recipientIgId: string,
  message: {
    text?: string;
    buttons?: Array<{ title: string; url?: string; payload?: string }>;
    quick_replies?: Array<{ title: string; payload: string }>;
    media_url?: string;
  },
  accessToken: string
): Promise<{ message_id: string; recipient_id: string }> {
  const url = `${GRAPH_BASE_URL}/${GRAPH_API_VERSION}/${igAccountId}/messages`;

  let messagePayload: any = {};

  if (message.buttons && message.buttons.length > 0) {
    // Generic template with buttons
    messagePayload = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: message.text || "Message",
              buttons: message.buttons.map((btn) => {
                if (btn.url) {
                  return { type: "web_url", url: btn.url, title: btn.title };
                }
                return { type: "postback", title: btn.title, payload: btn.payload || btn.title };
              }),
            },
          ],
        },
      },
    };
  } else if (message.quick_replies && message.quick_replies.length > 0) {
    messagePayload = {
      text: message.text || "",
      quick_replies: message.quick_replies.map((qr) => ({
        content_type: "text",
        title: qr.title,
        payload: qr.payload,
      })),
    };
  } else {
    messagePayload = {
      text: message.text || "",
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientIgId },
      message: messagePayload,
    }),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Failed to send Instagram DM: ${res.statusText}`);
  }

  return {
    message_id: data.message_id,
    recipient_id: data.recipient_id,
  };
}

/**
 * Publicly replies to an Instagram comment.
 */
export async function sendInstagramCommentReply(
  commentId: string,
  text: string,
  accessToken: string
): Promise<{ id: string }> {
  const url = `${GRAPH_BASE_URL}/${GRAPH_API_VERSION}/${commentId}/replies`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message: text,
    }),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Failed to reply to Instagram comment: ${res.statusText}`);
  }

  return { id: data.id };
}

/**
 * Automatically likes an Instagram comment.
 */
export async function likeInstagramComment(
  commentId: string,
  accessToken: string
): Promise<boolean> {
  const url = `${GRAPH_BASE_URL}/${GRAPH_API_VERSION}/${commentId}/likes`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (_e) {
    return false;
  }
}

/**
 * Sends a message via Facebook Messenger.
 */
export async function sendFacebookMessage(
  pageId: string,
  recipientPsid: string,
  message: {
    text?: string;
    buttons?: Array<{ title: string; url?: string; payload?: string }>;
    quick_replies?: Array<{ title: string; payload: string }>;
  },
  pageAccessToken: string
): Promise<{ message_id: string; recipient_id: string }> {
  const url = `${GRAPH_BASE_URL}/${GRAPH_API_VERSION}/${pageId}/messages`;

  let messagePayload: any = {};

  if (message.buttons && message.buttons.length > 0) {
    messagePayload = {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: message.text || "Choose an option:",
          buttons: message.buttons.map((btn) => {
            if (btn.url) {
              return { type: "web_url", url: btn.url, title: btn.title };
            }
            return { type: "postback", title: btn.title, payload: btn.payload || btn.title };
          }),
        },
      },
    };
  } else {
    messagePayload = {
      text: message.text || "",
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pageAccessToken}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientPsid },
      message: messagePayload,
    }),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Failed to send Facebook message: ${res.statusText}`);
  }

  return {
    message_id: data.message_id,
    recipient_id: data.recipient_id,
  };
}

/**
 * Publicly replies to a Facebook post comment.
 */
export async function sendFacebookCommentReply(
  commentId: string,
  text: string,
  pageAccessToken: string
): Promise<{ id: string }> {
  const url = `${GRAPH_BASE_URL}/${GRAPH_API_VERSION}/${commentId}/comments`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pageAccessToken}`,
    },
    body: JSON.stringify({
      message: text,
    }),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Failed to reply to Facebook comment: ${res.statusText}`);
  }

  return { id: data.id };
}

/**
 * Fetches recent Instagram Posts & Reels for the visual post selector.
 */
export async function fetchRecentInstagramMedia(
  igAccountId: string,
  accessToken: string,
  limit = 25
): Promise<MetaMediaItem[]> {
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments_count,like_count";
  const url = `${GRAPH_BASE_URL}/${GRAPH_API_VERSION}/${igAccountId}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || !Array.isArray(data.data)) {
    return [];
  }

  return data.data;
}

/**
 * Fetches recent Facebook page posts for post selector.
 */
export async function fetchRecentFacebookPosts(
  pageId: string,
  pageAccessToken: string,
  limit = 25
): Promise<MetaPostItem[]> {
  const fields = "id,message,created_time,permalink_url,full_picture";
  const url = `${GRAPH_BASE_URL}/${GRAPH_API_VERSION}/${pageId}/feed?fields=${fields}&limit=${limit}&access_token=${pageAccessToken}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || !Array.isArray(data.data)) {
    return [];
  }

  return data.data;
}

/**
 * Sets Instagram DM Icebreakers (FAQ question buttons).
 */
export async function setInstagramIcebreakers(
  igAccountId: string,
  icebreakers: Array<{ question: string; payload: string }>,
  accessToken: string
): Promise<boolean> {
  const url = `${GRAPH_BASE_URL}/${GRAPH_API_VERSION}/${igAccountId}/messenger_profile`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      platform: "instagram",
      ice_breakers: icebreakers.map((ib) => ({
        question: ib.question,
        payload: ib.payload,
      })),
    }),
  });

  const data = await res.json();
  return Boolean(data.result === "success" || data.success);
}
