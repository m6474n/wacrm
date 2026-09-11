"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Zap,
  Plus,
  MoreVertical,
  Copy,
  Pencil,
  Trash2,
  FileText,
  MessageCircle,
  Clock,
  Users,
  PhoneCall,
  Loader2,
  Compass,
  Briefcase,
  Building2,
  MapPin,
  Sparkles,
  CalendarCheck,
  HelpCircle,
  Star,
  Search,
  Bot,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { useCan } from "@/hooks/use-can"
import { useTranslations } from "next-intl"
import type { Automation } from "@/types"
import { Button } from "@/components/ui/button"
import { GatedButton } from "@/components/ui/gated-button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AUTOMATION_TEMPLATES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_ORDER,
  type AutomationTemplateDefinition,
  type TemplateCategory,
  type TemplateSlug,
} from "@/lib/automations/templates"
import { triggerMeta, formatRelative } from "@/lib/automations/trigger-meta"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, typeof Zap> = {
  Compass,
  Briefcase,
  Building2,
  MapPin,
  Users,
  Sparkles,
  CalendarCheck,
  HelpCircle,
  Star,
  Clock,
  PhoneCall,
  MessageCircle,
}

export default function AutomationsPage() {
  const router = useRouter()
  const canCreate = useCan("send-messages")
  const t = useTranslations("Automations.list")
  const [automations, setAutomations] = useState<Automation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Automation | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [galleryModalOpen, setGalleryModalOpen] = useState(false)
  const [showInlineTemplates, setShowInlineTemplates] = useState(true)

  async function load() {
    try {
      const supabase = createClient()
      const { data, error: fetchErr } = await supabase
        .from("automations")
        .select("*")
        .order("created_at", { ascending: false })
      if (fetchErr) throw fetchErr
      setAutomations((data ?? []) as Automation[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load automations")
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleActive(a: Automation, next: boolean) {
    // Optimistic flip so the switch feels instant.
    setAutomations((prev) =>
      prev?.map((x) => (x.id === a.id ? { ...x, is_active: next } : x)) ?? prev,
    )
    const res = await fetch(`/api/automations/${a.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_active: next }),
    })
    if (!res.ok) {
      // Roll back on error.
      setAutomations((prev) =>
        prev?.map((x) => (x.id === a.id ? { ...x, is_active: !next } : x)) ?? prev,
      )
      const body = await res.json().catch(() => ({}))
      toast.error(body?.error ?? t("toasts.updateError"))
      return
    }
    toast.success(next ? t("toasts.activated") : t("toasts.paused"))
  }

  async function duplicate(a: Automation) {
    const res = await fetch(`/api/automations/${a.id}/duplicate`, { method: "POST" })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body?.error ?? t("toasts.duplicateError"))
      return
    }
    toast.success(t("toasts.duplicated"))
    load()
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    const res = await fetch(`/api/automations/${pendingDelete.id}`, { method: "DELETE" })
    setDeleting(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body?.error ?? t("toasts.deleteError"))
      return
    }
    toast.success(t("toasts.deleted"))
    setPendingDelete(null)
    load()
  }

  function startFromTemplate(slug: TemplateSlug) {
    router.push(`/automations/new?template=${slug}`)
  }

  const filteredTemplates = useMemo(() => {
    return TEMPLATE_ORDER.map((slug) => AUTOMATION_TEMPLATES[slug]).filter((tmpl) => {
      if (!tmpl) return false
      const matchesCat =
        selectedCategory === "all" || tmpl.category === selectedCategory
      const q = searchQuery.trim().toLowerCase()
      if (!q) return matchesCat
      const matchesSearch =
        tmpl.name.toLowerCase().includes(q) ||
        tmpl.description.toLowerCase().includes(q) ||
        tmpl.badge.toLowerCase().includes(q) ||
        tmpl.highlights.some((h) => h.toLowerCase().includes(q))
      return matchesCat && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-sm text-red-400">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("retry")}
        </Button>
      </div>
    )
  }

  if (automations === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const hasAutomations = automations.length > 0

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-medium">
              {automations.length} Active Workflows
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setGalleryModalOpen(true)}
            className="border-border/80 hover:bg-muted/80 text-foreground flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>{t("browseTemplates")}</span>
          </Button>
          <GatedButton
            canAct={canCreate}
            gateReason="create automations"
            onClick={() => router.push("/automations/new")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {t("create")}
          </GatedButton>
        </div>
      </div>

      {/* Prebuilt Templates Section */}
      <section className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Bot className="h-4 w-4" />
              </span>
              <h2 className="text-base font-semibold text-foreground">{t("templatesTitle")}</h2>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                {t("noAiBadge")}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("templatesSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInlineTemplates(!showInlineTemplates)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showInlineTemplates ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5 mr-1" />
                  {t("hideTemplates")}
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5 mr-1" />
                  {t("viewAllTemplates", { count: TEMPLATE_ORDER.length })}
                </>
              )}
            </Button>
          </div>
        </div>

        {showInlineTemplates && (
          <div className="space-y-4">
            {/* Category Filter Pills & Search */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                {TEMPLATE_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id
                  const label =
                    cat.id === "all"
                      ? t("allCategories")
                      : cat.id === "company_info"
                      ? t("categoryCompanyInfo")
                      : cat.id === "support"
                      ? t("categorySupport")
                      : cat.id === "sales"
                      ? t("categorySales")
                      : t("categoryFeedback")

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              <div className="relative w-full lg:w-72">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-muted/50 border-border/60"
                />
              </div>
            </div>

            {/* Template Cards Grid */}
            {filteredTemplates.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {t("noTemplatesFound")}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredTemplates.map((tmpl) => (
                  <TemplateCard
                    key={tmpl.slug}
                    template={tmpl}
                    onSelect={() => startFromTemplate(tmpl.slug)}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* User Automations Section */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>Your Workflows</span>
            <span className="text-xs font-normal text-muted-foreground">
              ({automations.length})
            </span>
          </h2>
        </div>

        {!hasAutomations ? (
          <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Zap className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">{t("emptyTitle")}</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {t("emptyDesc")}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGalleryModalOpen(true)}
              className="mt-4 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {t("browseTemplates")}
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {automations.map((a) => (
              <AutomationCard
                key={a.id}
                automation={a}
                onToggle={(next) => toggleActive(a, next)}
                onEdit={() => router.push(`/automations/${a.id}/edit`)}
                onDuplicate={() => duplicate(a)}
                onLogs={() => router.push(`/automations/${a.id}/logs`)}
                onDelete={() => setPendingDelete(a)}
                t={t}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Template Browser Modal */}
      <Dialog open={galleryModalOpen} onOpenChange={setGalleryModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <DialogTitle className="text-xl font-bold">
                {t("templatesTitle")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("browseTemplatesDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {TEMPLATE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id
                const label =
                  cat.id === "all"
                    ? t("allCategories")
                    : cat.id === "company_info"
                    ? t("categoryCompanyInfo")
                    : cat.id === "support"
                    ? t("categorySupport")
                    : cat.id === "sales"
                    ? t("categorySales")
                    : t("categoryFeedback")

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-muted/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 py-1">
              {filteredTemplates.map((tmpl) => (
                <TemplateCard
                  key={tmpl.slug}
                  template={tmpl}
                  onSelect={() => {
                    setGalleryModalOpen(false)
                    startFromTemplate(tmpl.slug)
                  }}
                  t={t}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setGalleryModalOpen(false)}>
              {t("closeGallery")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!pendingDelete} onOpenChange={(v) => !v && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteDesc", { name: pendingDelete?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TemplateCard({
  template,
  onSelect,
  t,
}: {
  template: AutomationTemplateDefinition
  onSelect: () => void
  t: ReturnType<typeof useTranslations>
}) {
  const Icon = ICON_MAP[template.iconName] || Zap
  const meta = triggerMeta(template.trigger_type)
  const stepsCount = template.steps.length

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 transition-all duration-200 hover:border-primary/50 hover:bg-card/90 hover:shadow-md">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105 group-hover:bg-primary/20">
            <Icon className="h-5 w-5" />
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {template.badge}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
          {template.name}
        </h3>

        <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {template.description}
        </p>

        {/* Highlights */}
        {template.highlights && template.highlights.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {template.highlights.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium"
              >
                {h}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-1.5 py-0.2 text-[10px] font-medium",
              meta.pillClass
            )}
          >
            {meta.label}
          </span>
          <span className="text-muted-foreground/60">•</span>
          <span>
            {stepsCount === 1
              ? t("stepsCount", { count: stepsCount })
              : t("stepsCountPlural", { count: stepsCount })}
          </span>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={onSelect}
          className="h-7 px-2.5 text-xs bg-primary/15 text-primary hover:bg-primary hover:text-primary-foreground transition-colors group/btn"
        >
          <span>{t("useTemplate")}</span>
          <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
        </Button>
      </div>
    </div>
  )
}

function AutomationCard({
  automation,
  onToggle,
  onEdit,
  onDuplicate,
  onLogs,
  onDelete,
  t,
}: {
  automation: Automation
  onToggle: (next: boolean) => void
  onEdit: () => void
  onDuplicate: () => void
  onLogs: () => void
  onDelete: () => void
  t: ReturnType<typeof useTranslations>
}) {
  const meta = triggerMeta(automation.trigger_type)
  return (
    <li className="rounded-xl border border-border bg-card transition-colors hover:border-border">
      <div className="flex items-center gap-4 p-4">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10"
          aria-hidden
        >
          <Zap className="h-5 w-5 text-primary" />
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {automation.name}
            </span>
            {automation.is_active && (
              <span className="relative flex h-2 w-2" aria-label="active">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            )}
          </div>
          {automation.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{automation.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                meta.pillClass,
              )}
            >
              {meta.label}
            </span>
            <span className="tabular-nums">
              {automation.execution_count === 1
                ? t("runs", { count: automation.execution_count })
                : t("runsPlural", { count: automation.execution_count })}
            </span>
            <span aria-hidden>·</span>
            <span>{t("lastRun", { time: formatRelative(automation.last_executed_at) })}</span>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <Switch
            checked={automation.is_active}
            onCheckedChange={(v) => onToggle(!!v)}
            aria-label={automation.is_active ? t("deactivate") : t("activate")}
          />

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open menu"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[popup-open]:bg-muted"
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4" />
                {t("duplicate")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogs}>
                <FileText className="h-4 w-4" />
                {t("viewLogs")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  )
}
