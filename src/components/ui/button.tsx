import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 transform active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-orange-500 text-white hover:bg-orange-600 shadow-sm hover:shadow-md border border-orange-500/20 dark:bg-orange-500 dark:hover:bg-orange-400",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-md border border-red-500/20",
        outline: "border-2 border-orange-500 bg-transparent text-orange-600 hover:bg-orange-50 hover:border-orange-600 shadow-sm hover:shadow-md dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-500/10 dark:hover:border-orange-300",
        secondary: "bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-200 shadow-sm hover:shadow-md dark:bg-orange-900/20 dark:text-orange-300 dark:hover:bg-orange-900/30 dark:border-orange-800",
        ghost: "text-text-primary hover:bg-surface/80 hover:text-text-primary border border-transparent hover:border-secondary/20",
        link: "text-orange-600 underline-offset-4 hover:underline hover:text-orange-700 border border-transparent dark:text-orange-400 dark:hover:text-orange-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }