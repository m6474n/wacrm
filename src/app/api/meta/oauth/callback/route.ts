import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeMetaCodeForLongLivedToken,
  discoverMetaAccounts,
  subscribePageWebhooks,
} from "@/lib/meta/oauth";
import { encrypt } from "@/lib/whatsapp/encryption";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
  const settingsUrl = `${baseUrl}/settings?tab=channels`;

  if (error || !code || !state) {
    const errorMsg = encodeURIComponent(errorDescription || error || "Meta authorization cancelled");
    return NextResponse.redirect(`${settingsUrl}&error=${errorMsg}`);
  }

  let stateData: { accountId: string; userId: string };
  try {
    stateData = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
  } catch (_e) {
    return NextResponse.redirect(`${settingsUrl}&error=Invalid+state+token`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== stateData.userId) {
    return NextResponse.redirect(`${settingsUrl}&error=Authentication+mismatch`);
  }

  try {
    const redirectUri = `${baseUrl}/api/meta/oauth/callback`;

    // 1. Exchange code for long-lived user token
    const { accessToken: userToken } = await exchangeMetaCodeForLongLivedToken(code, redirectUri);

    // 2. Discover all Facebook Pages and connected Instagram accounts
    const discoveredPages = await discoverMetaAccounts(userToken);

    if (discoveredPages.length === 0) {
      return NextResponse.redirect(`${settingsUrl}&error=No+Facebook+Pages+or+Instagram+accounts+found`);
    }

    // 3. For each page and linked IG account, subscribe to Webhooks and upsert to channels table
    for (const page of discoveredPages) {
      // Subscribe Page to Webhooks
      await subscribePageWebhooks(page.id, page.access_token).catch(() => false);

      const encryptedPageToken = encrypt(page.access_token);

      // Save Facebook Page channel
      await supabase.from("channels").upsert(
        {
          account_id: stateData.accountId,
          platform: "facebook",
          external_id: page.id,
          name: page.name,
          avatar_url: page.picture_url || null,
          access_token: encryptedPageToken,
          status: "connected",
          settings: {
            category: page.category,
            connected_by: user.id,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "account_id,platform,external_id" }
      );

      // If page has a linked Instagram Business / Creator account, save it too
      if (page.instagram_account) {
        const ig = page.instagram_account;
        await supabase.from("channels").upsert(
          {
            account_id: stateData.accountId,
            platform: "instagram",
            external_id: ig.id,
            name: ig.name || ig.username,
            username: ig.username,
            avatar_url: ig.profile_picture_url || null,
            access_token: encryptedPageToken, // Page token is used to manage linked IG account
            status: "connected",
            settings: {
              follower_count: ig.followers_count,
              connected_by: user.id,
              linked_page_id: page.id,
              linked_page_name: page.name,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "account_id,platform,external_id" }
        );
      }
    }

    return NextResponse.redirect(`${settingsUrl}&success=connected&count=${discoveredPages.length}`);
  } catch (err: any) {
    const msg = encodeURIComponent(err?.message || "Failed to connect Meta accounts");
    return NextResponse.redirect(`${settingsUrl}&error=${msg}`);
  }
}
