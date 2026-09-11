import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { encrypt } from '@/lib/whatsapp/encryption'
import { subscribeWabaToApp } from '@/lib/whatsapp/meta-api'

const META_API_VERSION = 'v21.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

let _adminClient: any = null
function supabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _adminClient
}

async function resolveAccountId(
  supabase: any,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data?.account_id) return null
  return data.account_id as string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accountId = await resolveAccountId(supabase, user.id)
    if (!accountId) {
      return NextResponse.json(
        { error: 'Your profile is not linked to an account.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { accessToken } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 400 }
      )
    }

    // Step 1: Exchange short-lived token for long-lived access token
    const clientSecret = process.env.META_APP_SECRET
    const clientId = process.env.NEXT_PUBLIC_META_APP_ID

    let longLivedToken = accessToken
    if (clientSecret && clientId) {
      try {
        const exchangeUrl = `${META_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${accessToken}`
        const exchangeRes = await fetch(exchangeUrl)
        if (exchangeRes.ok) {
          const exchangeData = await exchangeRes.json()
          if (exchangeData.access_token) {
            longLivedToken = exchangeData.access_token
          }
        }
      } catch (err) {
        console.warn('Long-lived token exchange failed, using short-lived token:', err)
      }
    }

    // Step 2: Fetch WABA IDs connected to this login
    const wabaUrl = `${META_API_BASE}/me/whatsapp_business_accounts`
    const wabaRes = await fetch(wabaUrl, {
      headers: { Authorization: `Bearer ${longLivedToken}` },
    })

    if (!wabaRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch WhatsApp Business Accounts from Meta' },
        { status: 400 }
      )
    }

    const wabaData = await wabaRes.json()
    const wabas = wabaData.data || []
    if (wabas.length === 0) {
      return NextResponse.json(
        { error: 'No WhatsApp Business Accounts found under this Meta login' },
        { status: 400 }
      )
    }

    // Grab the first WABA
    const wabaId = wabas[0].id

    // Step 3: Fetch phone numbers for this WABA
    const phoneUrl = `${META_API_BASE}/${wabaId}/phone_numbers`
    const phoneRes = await fetch(phoneUrl, {
      headers: { Authorization: `Bearer ${longLivedToken}` },
    })

    if (!phoneRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch phone numbers for the WABA' },
        { status: 400 }
      )
    }

    const phoneData = await phoneRes.json()
    const phones = phoneData.data || []
    if (phones.length === 0) {
      return NextResponse.json(
        { error: 'No phone numbers registered under the selected WABA' },
        { status: 400 }
      )
    }

    // Grab the first phone number
    const targetPhone = phones[0]
    const phoneNumberId = targetPhone.id

    // Step 4: Encrypt credentials
    const encryptedAccessToken = encrypt(longLivedToken)
    const verifyToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const encryptedVerifyToken = encrypt(verifyToken)

    // Step 5: Subscribe WABA to this app
    try {
      await subscribeWabaToApp({
        wabaId,
        accessToken: longLivedToken,
      })
    } catch (err) {
      console.warn('WABA app subscription failed (non-fatal):', err)
    }

    // Step 6: Save Configuration
    const baseRow = {
      phone_number_id: phoneNumberId,
      waba_id: wabaId,
      access_token: encryptedAccessToken,
      verify_token: encryptedVerifyToken,
      status: 'connected',
      connected_at: new Date().toISOString(),
      registered_at: new Date().toISOString(),
      subscribed_apps_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: existing } = await supabase
      .from('whatsapp_config')
      .select('id')
      .eq('account_id', accountId)
      .maybeSingle()

    if (existing) {
      const { error: updateError } = await supabase
        .from('whatsapp_config')
        .update(baseRow)
        .eq('account_id', accountId)

      if (updateError) {
        console.error('Error updating whatsapp_config:', updateError)
        return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 })
      }
    } else {
      const { error: insertError } = await supabase
        .from('whatsapp_config')
        .insert({
          account_id: accountId,
          user_id: user.id,
          ...baseRow,
        })

      if (insertError) {
        console.error('Error inserting whatsapp_config:', insertError)
        return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      verifyToken,
      phoneInfo: {
        id: phoneNumberId,
        display_phone_number: targetPhone.display_phone_number,
      },
    })
  } catch (error) {
    console.error('Error in Embedded Signup route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
