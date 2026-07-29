import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "draft" | "listed";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground": variant === "default",
          "border-transparent bg-secondary text-secondary-foreground": variant === "secondary",
          "border-transparent bg-destructive text-destructive-foreground": variant === "destructive",
          "text-foreground": variant === "outline",
          "border-transparent bg-green-500/15 text-green-700 dark:text-green-400": variant === "success",
          "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400": variant === "warning",
          "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400": variant === "info",
          "border-transparent bg-teal-500/15 text-teal-700 dark:text-teal-400": variant === "listed",
          "border-transparent bg-gray-500/15 text-gray-700 dark:text-gray-400": variant === "draft",
        },
        className
      )}
      {...props}
    />
  )
}
export { Badge }
