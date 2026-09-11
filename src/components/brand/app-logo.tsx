import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface AppLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  subtitle?: string
  href?: string
  className?: string
  priority?: boolean
}

const SIZE_MAP = {
  sm: { box: "h-7 w-7", px: 28, rounded: "rounded-md" },
  md: { box: "h-9 w-9", px: 36, rounded: "rounded-lg" },
  lg: { box: "h-12 w-12", px: 48, rounded: "rounded-xl" },
  xl: { box: "h-14 w-14", px: 56, rounded: "rounded-2xl" },
}

export function AppLogo({
  size = "md",
  showText = false,
  subtitle,
  href,
  className,
  priority = false,
}: AppLogoProps) {
  const currentSize = SIZE_MAP[size]

  const content = (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden shadow-xs ring-1 ring-border/50 bg-background/80 transition-transform duration-200 group-hover:scale-105",
          currentSize.box,
          currentSize.rounded
        )}
      >
        <Image
          src="/ds_app_icon.png"
          alt="Deversol"
          width={currentSize.px}
          height={currentSize.px}
          className="h-full w-full object-contain p-0.5"
          priority={priority}
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-heading text-base font-bold tracking-tight text-foreground leading-none">
            deversol<span className="text-primary">.</span>
          </span>
          {subtitle && (
            <span className="mt-1 text-[10px] font-mono font-medium tracking-wider text-muted-foreground uppercase">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="group inline-flex items-center focus:outline-none">
        {content}
      </Link>
    )
  }

  return content
}
