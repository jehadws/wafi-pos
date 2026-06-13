import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepActions } from "../components/step-actions";
import { STEPS } from "../config";

interface ConfigForm {
  ns_store_name: string;
  admin_username: string;
  admin_email: string;
  password: string;
  confirm_password: string;
  language: string;
}

interface ConfigurationPageProps {
  onBack: () => void;
  onNext: () => void;
  languages?: Record<string, string>;
  default_lang?: string;
}

export function ConfigurationPage({ onBack, onNext, languages = {}, default_lang = "en" }: ConfigurationPageProps) {
  const [data, setData] = useState<ConfigForm>({
    ns_store_name: "",
    admin_username: "",
    admin_email: "",
    password: "",
    confirm_password: "",
    language: default_lang,
  });

  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");

  const handleDataChange = (field: keyof ConfigForm, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setProcessing(true);
    setErrorMessage("");
    setErrors({});
    
    try {
      const response = await fetch("/api/setup/configuration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.status !== "failed" && result.status !== "error") {
        onNext();
      } else {
        throw new Error(result.message || "An error occurred during application configuration.");
      }
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const Field = ({
    name,
    label,
    hint,
    className,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & {
    name: keyof ConfigForm;
    label: string;
    hint?: string;
    className?: string;
  }) => (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-[12px] font-medium text-zinc-400">{label}</Label>
      <Input
        {...props}
        value={data[name]}
        onChange={(e) => handleDataChange(name, e.target.value)}
      />
      {hint && <p className="text-[11px] text-zinc-600">{hint}</p>}
      {errors[name] && (
        <p className="text-[11px] text-red-400">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-violet-400">
        Step 3 — Configuration
      </p>
      <h1 className="mb-1.5 text-[22px] font-semibold tracking-tight text-zinc-100">
        Application Configuration
      </h1>
      <p className="mb-6 text-[13px] leading-relaxed text-zinc-500">
        Configure your store details and create an administrator account.
      </p>

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-400">
          {errorMessage}
        </div>
      )}

      <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-5 content-start">
        {/* Section: Store Details */}
        <div className="col-span-2">
           <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2 mb-3">Store Details</h3>
        </div>

        <Field
          name="ns_store_name"
          label="Store Name"
          placeholder="e.g. My Store"
          className="col-span-2"
        />

        {/* Section: Admin Account */}
        <div className="col-span-2 mt-2">
           <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2 mb-3">Administrator Account</h3>
        </div>

        <Field
          name="admin_username"
          label="Username"
          placeholder="admin"
          className="font-mono text-[12px]"
        />

        <Field
          name="admin_email"
          label="Email address"
          type="email"
          placeholder="admin@yourstore.com"
        />

        <Field
          name="password"
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
        />

        <Field
          name="confirm_password"
          label="Confirm password"
          type="password"
          placeholder="Repeat password"
        />
      </div>

      <StepActions
        current={2}
        total={STEPS.length}
        onBack={onBack}
        onNext={handleSubmit}
        nextLabel="Finish Installation"
        nextLoading={processing}
      />
    </>
  );
}
