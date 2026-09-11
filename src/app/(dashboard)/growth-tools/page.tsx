"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Zap,
  TrendingUp,
  Layers,
  Heart,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { InstagramIcon as Instagram, FacebookIcon as Facebook } from "@/components/icons/social-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Channel, PostAutomation, PostAutomationTargetType, PostAutomationMatch } from "@/types";

interface MetaPost {
  id: string;
  caption?: string;
  message?: string;
  media_type?: string;
  thumbnail_url?: string;
  media_url?: string;
  full_picture?: string;
  permalink?: string;
  timestamp?: string;
}

export default function GrowthToolsPage() {
  const [automations, setAutomations] = useState<PostAutomation[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [targetType, setTargetType] = useState<PostAutomationTargetType>("specific_post");
  const [selectedPost, setSelectedPost] = useState<MetaPost | null>(null);
  const [recentPosts, setRecentPosts] = useState<MetaPost[]>([]);
  const [fetchingPosts, setFetchingPosts] = useState(false);

  const [automationName, setAutomationName] = useState("");
  const [matchType, setMatchType] = useState<PostAutomationMatch>("contains");
  const [keywordsText, setKeywordsText] = useState("PRICE, LINK, SEND, INFO");
  const [publicReplies, setPublicReplies] = useState<string[]>([
    "Check your DMs! Sent you the info 🚀",
    "Just sent you a message with the details! ✨",
    "Check your inbox requests for the link 📩",
  ]);
  const [autoLike, setAutoLike] = useState(true);
  const [dmText, setDmText] = useState("Hey {{username}}! Here is the link and details you requested:");
  const [buttonTitle, setButtonTitle] = useState("Get Access Now 🚀");
  const [buttonUrl, setButtonUrl] = useState("https://example.com/offer");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [autoRes, chRes] = await Promise.all([
        fetch("/api/growth-tools"),
        fetch("/api/meta/channels"),
      ]);
      const autoData = await autoRes.json();
      const chData = await chRes.json();

      setAutomations(autoData.automations || []);
      setChannels(chData.channels || []);

      if (chData.channels && chData.channels.length > 0) {
        setSelectedChannelId(chData.channels[0].id);
      }
    } catch (err) {
      console.error("Failed to load growth tools data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWizard = () => {
    if (channels.length > 0 && selectedChannelId) {
      fetchChannelPosts(selectedChannelId);
    }
    setAutomationName("Instagram Post Auto-DM");
    setIsModalOpen(true);
  };

  const fetchChannelPosts = async (channelId: string) => {
    setFetchingPosts(true);
    try {
      const res = await fetch(`/api/meta/posts?channel_id=${channelId}`);
      const data = await res.json();
      setRecentPosts(data.posts || []);
      if (data.posts && data.posts.length > 0) {
        setSelectedPost(data.posts[0]);
      }
    } catch (_e) {
      setRecentPosts([]);
    } finally {
      setFetchingPosts(false);
    }
  };

  const handleToggleStatus = async (auto: PostAutomation) => {
    const nextStatus = auto.status === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/growth-tools/${auto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setAutomations((prev) =>
          prev.map((item) => (item.id === auto.id ? { ...item, status: nextStatus } : item))
        );
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/growth-tools/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAutomations((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete automation:", err);
    }
  };

  const handleSaveAutomation = async () => {
    const currentChannel = channels.find((c) => c.id === selectedChannelId);
    if (!currentChannel) return;

    setSaving(true);
    try {
      const keywords = keywordsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        channel_id: selectedChannelId,
        platform: currentChannel.platform,
        name: automationName || `${currentChannel.name} Comment Auto-DM`,
        target_type: targetType,
        target_post_id: selectedPost?.id || null,
        target_post_url: selectedPost?.permalink || null,
        target_post_thumbnail: selectedPost?.thumbnail_url || selectedPost?.media_url || selectedPost?.full_picture || null,
        keyword_match_type: matchType,
        keywords,
        public_replies: publicReplies.filter((r) => r.trim().length > 0),
        auto_like_comment: autoLike,
        dm_message_payload: {
          text: dmText,
          buttons: buttonTitle ? [{ title: buttonTitle, url: buttonUrl }] : [],
        },
      };

      const res = await fetch("/api/growth-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.automation) {
        setAutomations([data.automation, ...automations]);
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to save automation:", err);
    } finally {
      setSaving(false);
    }
  };

  // Aggregated Stats
  const totalComments = automations.reduce((acc, a) => acc + (a.stats?.comments || 0), 0);
  const totalDms = automations.reduce((acc, a) => acc + (a.stats?.dms_sent || 0), 0);
  const activeCount = automations.filter((a) => a.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary font-semibold mb-1">
            ManyChat-Grade Social Conversion
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Growth Tools &amp; Post Automations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Auto-reply publicly to Instagram &amp; Facebook comments, auto-like comments, and send instant DM funnels.
          </p>
        </div>

        {channels.length > 0 ? (
          <Button onClick={handleOpenWizard} className="gap-2 bg-primary text-primary-foreground shadow-sm">
            <Plus className="size-4" />
            New Comment Automation
          </Button>
        ) : (
          <Link href="/settings?tab=channels">
            <Button className="gap-2 bg-primary text-primary-foreground">
              <Instagram className="size-4" />
              Connect Instagram / Facebook
            </Button>
          </Link>
        )}
      </div>

      {/* KPI Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Comments Handled
            </CardTitle>
            <MessageSquare className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-foreground">{totalComments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Automatic public replies delivered</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Instant DMs Sent
            </CardTitle>
            <Zap className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-foreground">{totalDms.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Direct funnel messages dispatched</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Active Growth Tools
            </CardTitle>
            <TrendingUp className="size-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-foreground">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Live Instagram &amp; Facebook automations</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Connected Channels
            </CardTitle>
            <Layers className="size-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-foreground">{channels.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/settings?tab=channels" className="text-primary hover:underline">
                Manage accounts &rarr;
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Automations Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-sm border border-border bg-card">
          <RefreshCw className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : automations.length === 0 ? (
        <Card className="border border-dashed border-border bg-card/40 text-center py-16">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="flex size-14 items-center justify-center rounded-sm bg-primary/10 text-primary mb-4">
              <Sparkles className="size-7" />
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground">No Post Automations Yet</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Create your first ManyChat-style post comment auto-reply to turn reel comments and post reactions into paying customers.
            </p>
            {channels.length > 0 ? (
              <Button onClick={handleOpenWizard} className="mt-6 gap-2">
                <Plus className="size-4" />
                Create Post Automation
              </Button>
            ) : (
              <Link href="/settings?tab=channels" className="mt-6">
                <Button className="gap-2">
                  <Instagram className="size-4" />
                  Connect Social Channels First
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3">
            {automations.map((auto) => (
              <Card key={auto.id} className="border border-border bg-card hover:border-border/80 transition-colors">
                <CardContent className="p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left info */}
                  <div className="flex items-start gap-3.5">
                    {auto.target_post_thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={auto.target_post_thumbnail}
                        alt="Post thumbnail"
                        className="size-14 rounded-sm object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="flex size-14 items-center justify-center rounded-sm bg-muted text-muted-foreground shrink-0">
                        {auto.platform === "instagram" ? <Instagram className="size-6" /> : <Facebook className="size-6" />}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-foreground text-base">{auto.name}</span>
                        <Badge
                          variant="outline"
                          className={
                            auto.platform === "instagram"
                              ? "border-pink-500/30 text-pink-400 bg-pink-500/10"
                              : "border-blue-500/30 text-blue-400 bg-blue-500/10"
                          }
                        >
                          {auto.platform === "instagram" ? "Instagram" : "Facebook"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            auto.status === "active"
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                              : "border-slate-500/40 text-muted-foreground bg-muted"
                          }
                        >
                          {auto.status === "active" ? "Active" : "Paused"}
                        </Badge>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Target:{" "}
                          <strong className="text-foreground font-medium capitalize">
                            {auto.target_type.replace("_", " ")}
                          </strong>
                        </span>
                        <span>
                          Keywords:{" "}
                          <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground font-mono">
                            {auto.keywords.length > 0 ? auto.keywords.join(", ") : "Any comment"}
                          </code>
                        </span>
                        {auto.target_post_url && (
                          <a
                            href={auto.target_post_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            View Post <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right metrics & actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                    <div className="flex items-center gap-4 text-center">
                      <div>
                        <div className="font-heading font-bold text-foreground text-sm">
                          {(auto.stats?.comments || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] uppercase font-mono text-muted-foreground">Comments</div>
                      </div>
                      <div>
                        <div className="font-heading font-bold text-foreground text-sm">
                          {(auto.stats?.dms_sent || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] uppercase font-mono text-muted-foreground">DMs Sent</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(auto)}
                        className="gap-1.5 text-xs"
                      >
                        {auto.status === "active" ? (
                          <>
                            <Pause className="size-3.5" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="size-3.5" /> Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(auto.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Creation Wizard Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              New Post &amp; Reel Comment Automation
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Configure automatic public replies and instant DM funnels when users comment on your Instagram posts or reels.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-2 md:grid-cols-2">
            {/* Left: Configuration options */}
            <div className="space-y-4">
              {/* Channel Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Select Channel</Label>
                <select
                  value={selectedChannelId}
                  onChange={(e) => {
                    setSelectedChannelId(e.target.value);
                    fetchChannelPosts(e.target.value);
                  }}
                  className="w-full h-8 rounded-sm border border-input bg-card px-3 text-sm text-foreground outline-none"
                >
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.platform === "instagram" ? "📸 Instagram: @" : "🔵 Facebook: "}
                      {ch.username || ch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Automation Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Automation Name</Label>
                <Input
                  value={automationName}
                  onChange={(e) => setAutomationName(e.target.value)}
                  placeholder="e.g. Pricing Reel Auto-DM"
                />
              </div>

              {/* Target Post Mode */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Apply To</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={targetType === "specific_post" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTargetType("specific_post")}
                    className="text-xs"
                  >
                    Specific Post / Reel
                  </Button>
                  <Button
                    type="button"
                    variant={targetType === "all_posts" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTargetType("all_posts")}
                    className="text-xs"
                  >
                    Any Post / Next Post
                  </Button>
                </div>
              </div>

              {/* Post Picker (if specific_post) */}
              {targetType === "specific_post" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Select Post or Reel ({recentPosts.length} available)</span>
                    {fetchingPosts && <RefreshCw className="size-3 animate-spin" />}
                  </Label>
                  <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto rounded-sm border border-border p-2 bg-muted/20">
                    {recentPosts.length === 0 ? (
                      <div className="col-span-3 text-center py-6 text-xs text-muted-foreground">
                        {fetchingPosts ? "Loading posts..." : "No recent media found for this channel"}
                      </div>
                    ) : (
                      recentPosts.map((post) => {
                        const img = post.thumbnail_url || post.media_url || post.full_picture;
                        const isSelected = selectedPost?.id === post.id;
                        return (
                          <button
                            key={post.id}
                            type="button"
                            onClick={() => setSelectedPost(post)}
                            className={`relative aspect-square rounded-sm overflow-hidden border-2 transition-all ${
                              isSelected ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-border/80"
                            }`}
                          >
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img} alt="post" className="size-full object-cover" />
                            ) : (
                              <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
                                <ImageIcon className="size-4" />
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute top-1 right-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                                <Check className="size-3" />
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Trigger Keywords */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Trigger Keywords (Comma separated)</Label>
                <Input
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder="e.g. PRICE, SEND, LINK, INFO"
                />
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-muted-foreground">Match mode:</span>
                  <select
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value as PostAutomationMatch)}
                    className="h-6 rounded-sm border border-input bg-card px-2 text-xs text-foreground"
                  >
                    <option value="contains">Contains (Default)</option>
                    <option value="exact">Exact Match</option>
                    <option value="word">Whole Word Only</option>
                    <option value="all">Any Comment</option>
                  </select>
                </div>
              </div>

              {/* Public Comment Replies */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Public Comment Replies (Randomized)</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Spintax enabled</span>
                </Label>
                <div className="space-y-2">
                  {publicReplies.map((rep, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <Input
                        value={rep}
                        onChange={(e) => {
                          const next = [...publicReplies];
                          next[idx] = e.target.value;
                          setPublicReplies(next);
                        }}
                        className="text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setPublicReplies(publicReplies.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() =>
                      setPublicReplies([
                        ...publicReplies,
                        "Check your inbox for the link 📩",
                      ])
                    }
                    className="w-full text-xs gap-1"
                  >
                    <Plus className="size-3" /> Add Public Reply Variation
                  </Button>
                </div>
              </div>

              {/* Auto Like */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoLike"
                  checked={autoLike}
                  onChange={(e) => setAutoLike(e.target.checked)}
                  className="rounded border-input text-primary"
                />
                <Label htmlFor="autoLike" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                  <Heart className="size-3 text-red-500 fill-red-500" /> Automatically like commenter&apos;s comment
                </Label>
              </div>

              {/* Instant DM Configuration */}
              <div className="space-y-2 border-t border-border pt-3">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Zap className="size-3.5 text-primary" /> Instant Direct Message (DM) Response
                </Label>
                <Textarea
                  value={dmText}
                  onChange={(e) => setDmText(e.target.value)}
                  placeholder="Hey {{username}}! Here is your link:"
                  className="text-xs min-h-16"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Button Title</Label>
                    <Input
                      value={buttonTitle}
                      onChange={(e) => setButtonTitle(e.target.value)}
                      placeholder="e.g. Download Guide"
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Button URL</Label>
                    <Input
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="https://..."
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Interactive Mock Preview */}
            <div className="flex flex-col items-center justify-center rounded-sm border border-border bg-muted/30 p-4">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                <Sliders className="size-3.5" /> Live Preview
              </div>

              {/* Mock Instagram Post Card */}
              <div className="w-full max-w-xs rounded-sm border border-border bg-card shadow-sm overflow-hidden text-xs">
                {/* Post Header */}
                <div className="flex items-center gap-2 p-2.5 border-b border-border">
                  <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-[10px] text-primary">
                    d.
                  </div>
                  <span className="font-semibold text-foreground">deversol.hq</span>
                </div>

                {/* Post Media Preview */}
                <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground overflow-hidden">
                  {selectedPost?.thumbnail_url || selectedPost?.media_url || selectedPost?.full_picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedPost.thumbnail_url || selectedPost.media_url || selectedPost.full_picture}
                      alt="preview"
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-8 opacity-40" />
                  )}
                </div>

                {/* Comments Stream Mock */}
                <div className="p-3 space-y-2 border-b border-border bg-card">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">customer_1</span>
                    <span className="text-muted-foreground">PRICE please! 🔥</span>
                    {autoLike && <Heart className="size-3 text-red-500 fill-red-500 ml-auto shrink-0 mt-0.5" />}
                  </div>

                  {/* Public Reply Bubble */}
                  <div className="ml-4 pl-2 border-l-2 border-primary/40 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">deversol.hq</span>:{" "}
                    {publicReplies[0] || "Check your DMs! 🚀"}
                  </div>
                </div>

                {/* Direct Message Slide-in Mock */}
                <div className="p-3 bg-primary/5 border-t border-primary/20 space-y-2">
                  <div className="text-[10px] font-mono text-primary font-semibold flex items-center gap-1">
                    <Zap className="size-3" /> INSTANT DM DELIVERED:
                  </div>
                  <div className="rounded-sm bg-card border border-border p-2 text-foreground text-[11px] shadow-xs">
                    {dmText.replace("{{username}}", "customer_1")}
                  </div>
                  {buttonTitle && (
                    <div className="rounded-sm bg-primary text-primary-foreground text-center py-1.5 font-medium text-[11px] shadow-xs cursor-pointer">
                      {buttonTitle}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAutomation} disabled={saving}>
              {saving ? "Creating..." : "Launch Automation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
