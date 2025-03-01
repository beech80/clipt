import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95 touch-manipulation",
  {
    variants: {
      variant: {
        default: "gaming-button border-[#9b87f5] hover:border-[#8B5CF6] bg-[#1A1F2C] text-white",
        destructive: "gaming-button border-red-500 hover:border-red-600 bg-[#1A1F2C] text-red-500",
        outline: "gaming-button border-[#403E43] hover:border-[#9b87f5] bg-[#1A1F2C] text-white",
        secondary: "gaming-button border-[#403E43] hover:border-[#9b87f5] bg-[#222222] text-white",
        ghost: "hover:bg-[#2A2F3C] text-white transition-colors",
        link: "text-[#9b87f5] underline-offset-4 hover:text-[#8B5CF6] hover:underline",
        gaming: "gaming-button border-[#403E43] hover:border-[#9b87f5] bg-[#1A1F2C] text-white hover:bg-gaming-600",
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
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }