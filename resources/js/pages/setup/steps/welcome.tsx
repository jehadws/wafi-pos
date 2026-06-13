import { ShieldCheck } from "lucide-react";
import { StepActions } from "../components/step-actions";
import { STEPS } from "../config";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function WelcomePage({
  onNext,
  languages,
  default_lang,
}: {
  onNext: () => void;
  languages?: Record<string, string>;
  default_lang?: string;
}) {
  const handleLanguageChange = (lang: string) => {
    // Redirect to ?lang=XX#/
    window.location.href = `?lang=${lang}#/`;
  };

  return (
    <>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-violet-400">
        Installation wizard
      </p>
      <h1 className="mb-1.5 text-[22px] font-semibold tracking-tight text-zinc-100">
        Welcome to NexoPOS
      </h1>
      <p className="mb-8 text-[13px] leading-relaxed text-zinc-500">
        Thank you for using NexoPOS to manage your store. This installation wizard will help you running NexoPOS in no time.
      </p>

      <div className="flex flex-1 flex-col items-center justify-start gap-6 pb-6 text-left">
        <div className="w-full flex flex-col gap-1.5">
          <Label className="text-[12px] font-medium text-zinc-400">Choose your language to get started.</Label>
          <Select
            value={default_lang}
            onValueChange={handleLanguageChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages && Object.entries(languages).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
              {(!languages || Object.keys(languages).length === 0) && (
                <SelectItem value="en">English</SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-zinc-600">Select what will be the default language of NexoPOS.</p>
        </div>

        <div className="w-full mt-4">
          <h3 className="text-lg font-medium text-zinc-200">Remaining Steps</h3>
          <ul className="mt-2 flex flex-col gap-2">
            <li className="flex items-center gap-2 text-[13px] text-zinc-400">
              <span className="text-zinc-600">→</span> Database Configuration
            </li>
            <li className="flex items-center gap-2 text-[13px] text-zinc-400">
              <span className="text-zinc-600">→</span> Application Configuration
            </li>
          </ul>
        </div>
      </div>

      <StepActions
        current={0}
        total={STEPS.length}
        onNext={onNext}
        nextLabel="Database Configuration"
      />
    </>
  );
}
