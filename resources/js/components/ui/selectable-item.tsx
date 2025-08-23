import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface SelectItemProps {
  value: string;
  disabled?: boolean;
  textValue?: string;
  onChange: (value: string) => void;
  label: string;
  selected?: boolean;
}

const SelectableItem = ({ value, onChange, label, selected }: SelectItemProps) => {
  return (
    <div
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
      )}
      onClick={() => onChange(value)}
    >
      <span className={cn("absolute right-2 flex size-3.5 items-center justify-center", { hidden: !selected })}>
        <div>
          <CheckIcon className="size-4" />
        </div>
      </span>
      <div>{label}</div>
    </div>
  )
}

export default SelectableItem
