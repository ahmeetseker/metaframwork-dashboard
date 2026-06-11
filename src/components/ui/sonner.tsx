import type { CSSProperties } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
import { useStore } from "@/store"

const Toaster = ({ ...props }: ToasterProps) => {
  const mode = useStore((s) => s.mode)
  return (
    <Sonner
      theme={mode}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          // Toasts are repeated/stacked items (sonner shows up to 3), so per
          // DESIGN.md §4 budgets they are NOT glass: no backdrop-filter, solid
          // fallback fill instead — same geometry, zero blur cost.
          "--normal-bg": "var(--glass-fallback)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "transparent",
          "--border-radius": "var(--radius-glass)",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          // Compact floating surface (<360px) → sanctioned 16px glass radius.
          // Overlay-tier drop + shadow stack + rim restated as important (same
          // tokens) because sonner's unlayered box-shadow beats layered styles.
          toast:
            "cn-toast [--radius-glass:16px] [box-shadow:0_32px_80px_-20px_rgb(0_0_0/0.45),var(--glass-shadow),var(--glass-rim)]!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
