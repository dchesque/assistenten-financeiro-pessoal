import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { DESIGN_SYSTEM } from "@/constants/designSystem"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: `bg-gradient-to-r ${DESIGN_SYSTEM.gradients.primary} text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700`,
        destructive: `bg-gradient-to-r ${DESIGN_SYSTEM.gradients.erro} text-white shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700`,
        outline: `${DESIGN_SYSTEM.glassmorphism.card} text-gray-700 border hover:bg-white/95 hover:text-gray-900`,
        secondary: `bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg hover:shadow-xl hover:from-gray-600 hover:to-gray-700`,
        ghost: "hover:bg-white/20 hover:text-gray-900 backdrop-blur-sm rounded-xl",
        link: "text-blue-600 underline-offset-4 hover:underline",
        success: `bg-gradient-to-r ${DESIGN_SYSTEM.gradients.sucesso} text-white shadow-lg hover:shadow-xl hover:from-green-600 hover:to-green-700`,
        warning: `bg-gradient-to-r ${DESIGN_SYSTEM.gradients.aviso} text-white shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700`,
        premium: `bg-gradient-to-r ${DESIGN_SYSTEM.gradients.empresa} text-white shadow-lg hover:shadow-xl hover:from-pink-600 hover:to-purple-700`,
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
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
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }