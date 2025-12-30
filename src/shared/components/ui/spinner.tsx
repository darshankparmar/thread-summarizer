import * as React from "react"
import { cn } from "@/shared/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

export function Spinner({
  className,
  size = "md",
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "relative animate-spin rounded-full spinner-ring",
        {
          "h-6 w-6": size === "sm",
          "h-10 w-10": size === "md",
          "h-16 w-16": size === "lg",
        },
        className
      )}
      {...props}
    >
      <div className="absolute inset-1 rounded-full bg-[var(--color-background)]" />
    </div>
  )
}
