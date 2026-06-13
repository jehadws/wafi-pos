import { useForm } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepActions } from "../components/step-actions";
import { STEPS } from "../config";

interface AppForm {
  name: string;
  language: string;
  currency: string;
  currency_symbol: string;
  timezone: string;
  date_format: string;
}

interface AppDetailsPageProps {
  onBack: () => void;
  onNext: () => void;
  languages?: Record<string, string>;
  default_lang?: string;
}

export function AppDetailsPage({ onBack, onNext, languages = {}, default_lang = "en" }: AppDetailsPageProps) {
  const { data, setData, post, processing, errors } = useForm<AppForm>({
    name: "",
    language: default_lang,
    currency: "USD",
    currency_symbol: "$",
    timezone: "UTC",
    date_format: "DD/MM/YYYY",
  });

  const handleSubmit = () => {
    post(route("setup.application"), {
      preserveScroll: true,
      onSuccess: onNext,
    });
  };

  return (
    <>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-violet-400">
        Step 3 — App Details
      </p>
      <h1 className="mb-1.5 text-[22px] font-semibold tracking-tight text-zinc-100">
        Configure your store
      </h1>
      <p className="mb-6 text-[13px] leading-relaxed text-zinc-500">
        These settings define how your store is displayed and how transactions
        are recorded.
      </p>

      <div className="grid flex-1 grid-cols-2 gap-4 content-start">
        {/* Store name */}
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label className="text-[12px] font-medium text-zinc-400">Store name</Label>
          <Input
            placeholder="My Store"
            value={data.name}
            onChange={(e) => setData("name", e.target.value)}
          />
          {errors.name && (
            <p className="text-[11px] text-red-400">{errors.name}</p>
          )}
        </div>

        {/* System Language */}
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label className="text-[12px] font-medium text-zinc-400">System language</Label>
          <Select
            value={data.language}
            onValueChange={(v) => setData("language", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(languages).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
              {Object.keys(languages).length === 0 && (
                <SelectItem value="en">English</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Currency */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] font-medium text-zinc-400">Currency</Label>
          <Select
            value={data.currency}
            onValueChange={(v) => setData("currency", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                ["USD", "USD — US Dollar"],
                ["EUR", "EUR — Euro"],
                ["GBP", "GBP — British Pound"],
                ["LYD", "LYD — Libyan Dinar"],
                ["SAR", "SAR — Saudi Riyal"],
                ["AED", "AED — UAE Dirham"],
              ].map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Symbol */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] font-medium text-zinc-400">
            Currency symbol
          </Label>
          <Input
            placeholder="$"
            value={data.currency_symbol}
            onChange={(e) => setData("currency_symbol", e.target.value)}
          />
        </div>

        {/* Timezone */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] font-medium text-zinc-400">Timezone</Label>
          <Select
            value={data.timezone}
            onValueChange={(v) => setData("timezone", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                "UTC",
                "Africa/Tripoli",
                "Asia/Riyadh",
                "Asia/Dubai",
                "Europe/London",
                "America/New_York",
              ].map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date format */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] font-medium text-zinc-400">
            Date format
          </Label>
          <Select
            value={data.date_format}
            onValueChange={(v) => setData("date_format", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map((fmt) => (
                <SelectItem key={fmt} value={fmt}>
                  {fmt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <StepActions
        current={2}
        total={STEPS.length}
        onBack={onBack}
        onNext={handleSubmit}
        nextLoading={processing}
      />
    </>
  );
}
