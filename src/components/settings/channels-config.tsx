"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Trash2,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { InstagramIcon as Instagram, FacebookIcon as Facebook, MetaIcon } from "@/components/icons/social-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Channel, IcebreakerQuestion } from "@/types";

export function ChannelsConfig() {
  const searchParams = useSearchParams();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Icebreaker modal state
  const [icebreakerChannel, setIcebreakerChannel] = useState<Channel | null>(null);
  const [icebreakers, setIcebreakers] = useState<IcebreakerQuestion[]>([]);
  const [savingIcebreakers, setSavingIcebreakers] = useState(false);

  // Disconnect confirmation modal
  const [disconnectChannel, setDisconnectChannel] = useState<Channel | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetchChannels();
    const successParam = searchParams.get("success");
    const errorParam = searchParams.get("error");
    if (successParam === "connected") {
      setSuccessMsg("Successfully connected Meta accounts!");
    } else if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meta/channels");
      const data = await res.json();
      if (data.channels) {
        setChannels(data.channels);
      }
    } catch (_e) {
      setError("Failed to load connected channels");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenIcebreakers = (ch: Channel) => {
    setIcebreakerChannel(ch);
    setIcebreakers(ch.settings?.icebreakers || [
      { question: "What are your services?", payload: "SERVICES_QUERY" },
      { question: "Book a consultation", payload: "BOOK_CALL" },
    ]);
  };

  const handleSaveIcebreakers = async () => {
    if (!icebreakerChannel) return;
    setSavingIcebreakers(true);
    try {
      const res = await fetch("/api/meta/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: icebreakerChannel.id,
          icebreakers,
        }),
      });
      const data = await res.json();
      if (data.channel) {
        setChannels((prev) =>
          prev.map((c) => (c.id === data.channel.id ? data.channel : c))
        );
        setIcebreakerChannel(null);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save icebreakers");
    } finally {
      setSavingIcebreakers(false);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectChannel) return;
    setDisconnecting(true);
    try {
      const res = await fetch(`/api/meta/channels/${disconnectChannel.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setChannels((prev) => prev.filter((c) => c.id !== disconnectChannel.id));
        setDisconnectChannel(null);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to disconnect channel");
    } finally {
      setDisconnecting(false);
    }
  };

  const igChannels = channels.filter((c) => c.platform === "instagram");
  const fbChannels = channels.filter((c) => c.platform === "facebook");

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-sm border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Connection Banner */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-sm bg-primary/10 text-primary">
                  <Instagram className="size-4" />
                </span>
                Meta Accounts (Instagram & Facebook)
              </CardTitle>
              <CardDescription className="mt-1 text-muted-foreground">
                Connect your business Facebook Pages and Instagram accounts via 1-click Meta Business Login to activate post comment automations, instant DM replies, and story triggers.
              </CardDescription>
            </div>
            <a href="/api/meta/oauth/start" className="shrink-0">
              <Button className="h-10 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium">
                <Instagram className="size-4" />
                <Facebook className="size-4" />
                Connect Facebook & Instagram
              </Button>
            </a>
          </div>
        </CardHeader>
      </Card>

      {/* Connected Accounts View */}
      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-sm border border-border bg-card">
          <RefreshCw className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : channels.length === 0 ? (
        <Card className="border border-dashed border-border bg-card/50 text-center py-12">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="flex size-14 items-center justify-center rounded-sm bg-muted text-muted-foreground mb-4">
              <Instagram className="size-7" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">No Social Channels Connected</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Click &quot;Connect Facebook &amp; Instagram&quot; above to link your Instagram Professional account and Facebook Page in under 30 seconds.
            </p>
            <a href="/api/meta/oauth/start" className="mt-5">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="size-4" />
                Connect with Meta
              </Button>
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Instagram Accounts Section */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Instagram className="size-3.5" />
              Connected Instagram Accounts ({igChannels.length})
            </h3>
            {igChannels.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No Instagram accounts found linked to your Facebook pages.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {igChannels.map((ig) => (
                  <Card key={ig.id} className="border border-border bg-card hover:border-border/80 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {ig.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={ig.avatar_url}
                              alt={ig.name}
                              className="size-11 rounded-sm object-cover border border-border"
                            />
                          ) : (
                            <div className="flex size-11 items-center justify-center rounded-sm bg-pink-500/10 text-pink-500">
                              <Instagram className="size-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-heading font-bold text-foreground flex items-center gap-1.5">
                              {ig.name}
                            </div>
                            <div className="text-xs font-mono text-primary font-medium">
                              @{ig.username || ig.external_id}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                          Active 🟢
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                        <span className="flex items-center gap-1">
                          <Users className="size-3.5" />
                          {ig.settings?.follower_count ? `${ig.settings.follower_count.toLocaleString()} Followers` : "Professional Account"}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          ID: {ig.external_id}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenIcebreakers(ig)}
                          className="gap-1 text-xs"
                        >
                          <HelpCircle className="size-3.5" />
                          Icebreakers (FAQs)
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDisconnectChannel(ig)}
                          className="text-destructive hover:bg-destructive/10 text-xs"
                        >
                          <Trash2 className="size-3.5" />
                          Disconnect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Facebook Pages Section */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Facebook className="size-3.5" />
              Connected Facebook Pages ({fbChannels.length})
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {fbChannels.map((fb) => (
                <Card key={fb.id} className="border border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {fb.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={fb.avatar_url}
                            alt={fb.name}
                            className="size-11 rounded-sm object-cover border border-border"
                          />
                        ) : (
                          <div className="flex size-11 items-center justify-center rounded-sm bg-blue-500/10 text-blue-500">
                            <Facebook className="size-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-heading font-bold text-foreground">
                            {fb.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {fb.settings?.category || "Business Page"}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                        Active 🟢
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                      <span className="font-mono text-[10px]">Page ID: {fb.external_id}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDisconnectChannel(fb)}
                        className="text-destructive hover:bg-destructive/10 text-xs"
                      >
                        <Trash2 className="size-3.5" />
                        Disconnect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Icebreakers Configuration Modal */}
      <Dialog open={Boolean(icebreakerChannel)} onOpenChange={(open) => !open && setIcebreakerChannel(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              Instagram DM Icebreakers ({icebreakerChannel?.username})
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Icebreakers are question prompts displayed to users when they first open a direct message thread with your Instagram account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {icebreakers.map((ib, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder="e.g. What are your pricing plans?"
                  value={ib.question}
                  onChange={(e) => {
                    const next = [...icebreakers];
                    next[idx] = { ...next[idx], question: e.target.value };
                    setIcebreakers(next);
                  }}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIcebreakers(icebreakers.filter((_, i) => i !== idx))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}

            {icebreakers.length < 4 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setIcebreakers([
                    ...icebreakers,
                    { question: "How can I get started?", payload: `FAQ_${Date.now()}` },
                  ])
                }
                className="gap-1.5 text-xs w-full mt-2"
              >
                <Plus className="size-3.5" />
                Add Icebreaker Prompt (Max 4)
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIcebreakerChannel(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveIcebreakers} disabled={savingIcebreakers}>
              {savingIcebreakers ? "Saving..." : "Save on Instagram"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Modal */}
      <Dialog open={Boolean(disconnectChannel)} onOpenChange={(open) => !open && setDisconnectChannel(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-foreground">
              Disconnect {disconnectChannel?.name}?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Disconnecting this channel will stop all active comment auto-replies, DM keyword triggers, and story automations for this account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectChannel(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
