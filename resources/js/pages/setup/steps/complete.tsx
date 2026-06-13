import { CheckCircle2, ArrowRight } from "lucide-react";
import { router } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CompletePage({ storeName }: { storeName?: string }) {
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10">
          <CheckCircle2 size={28} className="text-emerald-400" />
        </div>

        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-zinc-100">
            Installation complete
          </h1>
          <p className="mt-1.5 text-[13px] text-zinc-500">
            NexoPOS is ready. Here's a summary of what was set up.
          </p>
        </div>

        <div className="grid w-full max-w-xs grid-cols-2 gap-2">
          {[
            { label: "Database", value: "Connected", ok: true },
            { label: "Migrations", value: "Applied", ok: true },
            { label: "Store", value: storeName ?? "My Store", ok: false },
            { label: "Admin", value: "admin", ok: false, mono: true },
          ].map((chip) => (
            <div
              key={chip.label}
              className="flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5"
            >
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                {chip.label}
              </span>
              <span
                className={cn(
                  "text-[13px] font-medium",
                  chip.ok ? "text-emerald-400" : "text-zinc-200",
                  chip.mono && "font-mono text-[12px]"
                )}
              >
                {chip.value}
                {chip.ok && " ✓"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-end gap-2 border-t border-zinc-800 pt-5">
        <Button variant="outline" size="sm" asChild>
          <a href="https://my.nexopos.com/en/documentation" target="_blank" rel="noreferrer">
            View documentation
          </a>
        </Button>
        <Button
          size="sm"
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-500"
          onClick={() => router.visit(route("dashboard"))}
        >
          Go to dashboard <ArrowRight size={13} />
        </Button>
      </div>
    </>
  );
}
