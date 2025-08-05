import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { DESIGN_SYSTEM, type StatusType } from "@/constants/designSystem"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Status específicos brasileiros
        ativo: DESIGN_SYSTEM.status.ativo,
        inativo: DESIGN_SYSTEM.status.inativo,
        pendente: DESIGN_SYSTEM.status.pendente,
        pago: DESIGN_SYSTEM.status.pago,
        vencido: DESIGN_SYSTEM.status.vencido,
        cancelado: DESIGN_SYSTEM.status.cancelado,
        processando: DESIGN_SYSTEM.status.processando,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  status?: StatusType
  showDot?: boolean
  children?: React.ReactNode
}

function Badge({ className, variant, status, showDot = true, children, ...props }: BadgeProps) {
  // Se status for fornecido, usar ele como variant
  const actualVariant = status || variant

  return (
    <div className={cn(badgeVariants({ variant: actualVariant, className }))} {...props}>
      {showDot && status && (
        <div 
          className={cn(
            "w-2 h-2 rounded-full mr-2",
            DESIGN_SYSTEM.statusDots[status]
          )}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }