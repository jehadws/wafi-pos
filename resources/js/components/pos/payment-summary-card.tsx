import { formatCurrency } from "@/utils/format"
import { cn } from "@/lib/utils"

interface SummaryCardProps {
  label: string
  amount: number
  variant: "total" | "discount" | "paid" | "change"
  isNegative?: boolean
}

export default function SummaryCard({ label, amount, variant, isNegative = false }: SummaryCardProps) {
  const variants = {
    total: "bg-blue-100 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800/50",
    discount: "bg-pink-100 dark:bg-pink-900/50 border-pink-200 dark:border-pink-800/50",
    paid: "bg-green-100 dark:bg-green-900/50 border-green-200 dark:border-green-800/50",
    change: "bg-orange-100 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800/50",
  }

  return (
    <div className={cn("border rounded-lg p-4", variants[variant])}>
      <div className="flex justify-between items-center">
        <span className="font-medium text-muted-foreground">{label} :</span>
        <span className="text-xl font-bold text-foreground">
          {isNegative && amount < 0 ? `-${formatCurrency(Math.abs(amount))}` : formatCurrency(amount)}
        </span>
      </div>
    </div>
  )
}
