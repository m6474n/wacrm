/**
 * Meta (Facebook & Instagram) OAuth & Account Discovery
 *
 * Implements 1-Click Facebook & Instagram Business Login:
 * 1. Generates Meta Login Dialog URL with all required permissions.
 * 2. Exchanges authorization code for 60-day Long-Lived User Token.
 * 3. Discovers all Facebook Pages and linked Instagram Business / Creator accounts.
 * 4. Subscribes Webhooks for automatic real-time comment & message handling.
 */

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE_URL = "https://graph.facebook.com";

export const REQUIRED_META_SCOPES = [
  "public_profile",
  "email",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "pages_manage_metadata",
  "pages_messaging",
  "instagram_basic",
  "instagram_manage_messages",
  "instagram_manage_comments",
];

export interface DiscoveredInstagramAccount {
  id: string; // Instagram Scoped ID
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
}

export interface DiscoveredPage {
  id: string; // Facebook Page ID
  name: string;
  category?: string;
  access_token: string; // Page Access Token
  picture_url?: string;
  instagram_account?: DiscoveredInstagramAccount | null;
}

/**
 * Builds the Meta Business Login OAuth URL.
 */
export function getMetaOAuthUrl(redirectUri: string, state: string): string {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID || "";
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: REQUIRED_META_SCOPES.join(","),
    response_type: "code",
    auth_type: "rerequest",
  });

  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
}

/**
 * Exchanges OAuth authorization code for a long-lived user token.
 */
export async function exchangeMetaCodeForLongLivedToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID || "";
  const appSecret = process.env.META_APP_SECRET || "";

  // 1. Exchange code for short-lived user token
  const tokenUrl = new URL(`${GRAPH_BASE_URL}/${GRAPH_API_VERSION}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const shortRes = await fetch(tokenUrl.toString());
  const shortData = await shortRes.json();

  if (!shortRes.ok || !shortData.access_token) {
    throw new Error(shortData?.error?.message || "Failed to exchange Meta code for user access token");
  }

  // 2. Exchange short-lived token for 60-day long-lived token
  const longTokenUrl = new URL(`${GRAPH_BASE_URL}/${GRAPH_API_VERSION}/oauth/access_token`);
  longTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
  longTokenUrl.searchParams.set("client_id", appId);
  longTokenUrl.searchParams.set("client_secret", appSecret);
  longTokenUrl.searchParams.set("fb_exchange_token", shortData.access_token);

  const longRes = await fetch(longTokenUrl.toString());
  const longData = await longRes.json();

  if (!longRes.ok || !longData.access_token) {
    // If long-lived exchange fails, fallback to short-lived token
    return {
      accessToken: shortData.access_token,
      expiresIn: shortData.expires_in || 5184000,
    };
  }

  return {
    accessToken: longData.access_token,
    expiresIn: longData.expires_in || 5184000, // Default 60 days
  };
}

/**
 * Discovers all Facebook Pages and linked Instagram accounts for the authenticated user.
 */
export async function discoverMetaAccounts(userAccessToken: string): Promise<DiscoveredPage[]> {
  const fields = [
    "id",
    "name",
    "category",
    "access_token",
    "picture{url}",
    "instagram_business_account{id,username,name,profile_picture_url,followers_count}",
  ].join(",");

  const url = `${GRAPH_BASE_URL}/${GRAPH_API_VERSION}/me/accounts?fields=${encodeURIComponent(fields)}&access_token=${userAccessToken}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || !Array.isArray(data.data)) {
    throw new Error(data?.error?.message || "Failed to fetch Facebook Pages and Instagram accounts");
  }

  return data.data.map((page: any) => {
    const ig = page.instagram_business_account;
    return {
      id: page.id,
      name: page.name,
      category: page.category,
      access_token: page.access_token,
      picture_url: page.picture?.data?.url || null,
      instagram_account: ig
        ? {
            id: ig.id,
            username: ig.username,
            name: ig.name,
            profile_picture_url: ig.profile_picture_url,
            followers_count: ig.followers_count,
          }
        : null,
    };
  });
}

/**
 * Subscribes a Facebook Page / Instagram Account to Webhooks for real-time messages & comments.
 */
export async function subscribePageWebhooks(pageId: string, pageAccessToken: string): Promise<boolean> {
  const url = `${GRAPH_BASE_URL}/${GRAPH_API_VERSION}/${pageId}/subscribed_apps`;
  const fields = "messages,messaging_postbacks,feed,comments,mention,story_insights";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: pageAccessToken,
      subscribed_fields: fields.split(","),
    }),
  });

  const data = await res.json();
  return Boolean(data?.success);
}
