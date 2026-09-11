-- ============================================================
-- Migration 040: Omnichannel Instagram & Facebook Automation
-- ============================================================

-- 1. Channels table: stores connected Facebook Pages, Instagram
--    Professional accounts, and WhatsApp accounts.
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'facebook')),
  external_id TEXT NOT NULL, -- Page ID or Instagram Scoped ID / WABA ID
  name TEXT NOT NULL, -- Page Name or IG Username
  username TEXT, -- @handle for Instagram
  avatar_url TEXT,
  access_token TEXT NOT NULL, -- Encrypted long-lived page/account access token
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'token_expired')),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb, -- Icebreakers, persistent menu, auto-like preferences
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_account_channel UNIQUE (account_id, platform, external_id)
);

CREATE INDEX IF NOT EXISTS idx_channels_account_id ON channels(account_id);
CREATE INDEX IF NOT EXISTS idx_channels_platform_external_id ON channels(platform, external_id);

-- Enable RLS for channels
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access channels in their account" ON channels
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

-- 2. Post Automations (Comment Growth Tools) table
CREATE TABLE IF NOT EXISTS post_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook')),
  name TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'specific_post' CHECK (target_type IN ('specific_post', 'all_posts', 'next_post', 'reels_only', 'live')),
  target_post_id TEXT, -- Meta Post/Media ID (NULL if all_posts or next_post)
  target_post_url TEXT,
  target_post_thumbnail TEXT,
  keyword_match_type TEXT NOT NULL DEFAULT 'contains' CHECK (keyword_match_type IN ('all', 'exact', 'contains', 'word')),
  keywords TEXT[] NOT NULL DEFAULT '{}',
  public_replies TEXT[] NOT NULL DEFAULT '{}', -- Randomized public comments (Spintax supported)
  auto_like_comment BOOLEAN NOT NULL DEFAULT true,
  flow_id UUID REFERENCES flows(id) ON DELETE SET NULL,
  dm_message_payload JSONB NOT NULL DEFAULT '{"text": "Hey! Here is the link you requested."}'::jsonb,
  stats JSONB NOT NULL DEFAULT '{"comments": 0, "dms_sent": 0, "button_clicks": 0, "leads_captured": 0}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_automations_account_id ON post_automations(account_id);
CREATE INDEX IF NOT EXISTS idx_post_automations_post_id ON post_automations(platform, target_post_id);

-- Enable RLS for post_automations
ALTER TABLE post_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access post_automations in their account" ON post_automations
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

-- 3. Extend conversations with omnichannel fields
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'instagram', 'facebook')),
  ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS external_user_id TEXT,
  ADD COLUMN IF NOT EXISTS external_username TEXT;

CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_external_user_id ON conversations(channel, external_user_id);

-- 4. Extend messages with omnichannel fields
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'instagram', 'facebook')),
  ADD COLUMN IF NOT EXISTS meta_message_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_comment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_meta_message_id ON messages(meta_message_id);

-- 5. Extend contacts with social profile fields
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS ig_username TEXT,
  ADD COLUMN IF NOT EXISTS ig_id TEXT,
  ADD COLUMN IF NOT EXISTS fb_psid TEXT,
  ADD COLUMN IF NOT EXISTS preferred_channel TEXT DEFAULT 'whatsapp';

CREATE INDEX IF NOT EXISTS idx_contacts_ig_username ON contacts(ig_username);
CREATE INDEX IF NOT EXISTS idx_contacts_ig_id ON contacts(ig_id);
CREATE INDEX IF NOT EXISTS idx_contacts_fb_psid ON contacts(fb_psid);
