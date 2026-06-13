import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepActions } from "../components/step-actions";
import { STEPS } from "../config";

interface DatabaseForm {
  database_driver: string;
  hostname: string;
  database_port: string;
  database_name: string;
  username: string;
  password: string;
  database_prefix: string;
}

type TestStatus = "idle" | "testing" | "success" | "error";

interface DatabasePageProps {
  onBack: () => void;
  onNext: () => void;
}

export function DatabasePage({ onBack, onNext }: DatabasePageProps) {
  const [data, setData] = useState<DatabaseForm>({
    database_driver: "mysql",
    hostname: "127.0.0.1",
    database_port: "3306",
    database_name: "",
    username: "",
    password: "",
    database_prefix: "ns_",
  });
  
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testSteps, setTestSteps] = useState<
    { label: string; status: "pending" | "ok" | "error" }[]
  >([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Check on mount if database is already configured
  React.useEffect(() => {
    const checkDb = async () => {
      try {
        const response = await fetch("/api/setup/check-database", {
          headers: { "Accept": "application/json" }
        });
        const result = await response.json();
        if (result.status === "success" || result.data?.message) {
          onNext(); // Already configured, skip this step
        }
      } catch (error) {
        // Ignore, stay on page to configure
      }
    };
    checkDb();
  }, [onNext]);

  const handleDataChange = (field: keyof DatabaseForm, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTestAndContinue = async () => {
    setProcessing(true);
    setTestStatus("testing");
    setErrorMessage("");
    setErrors({});
    
    setTestSteps([
      { label: "Connecting and saving configuration", status: "pending" },
    ]);

    try {
      const response = await fetch("/api/setup/database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        setTestSteps([{ label: "Connecting and saving configuration", status: "ok" }]);
        
        // Second check as requested by original flow
        const checkResponse = await fetch("/api/setup/check-database", {
            headers: { "Accept": "application/json" }
        });
        const checkResult = await checkResponse.json();
        
        if (checkResult.status === "success" || checkResult.data?.message) {
            setTestStatus("success");
            setTimeout(onNext, 600);
        } else {
            throw new Error(checkResult.message || "Failed to verify database connection.");
        }
      } else {
        throw new Error(result.message || "An error occurred during database setup.");
      }
    } catch (error: any) {
      setTestSteps([{ label: "Connecting and saving configuration", status: "error" }]);
      setTestStatus("error");
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
    name: keyof DatabaseForm;
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
        className="font-mono text-[12px]"
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
        Step 2 — Database
      </p>
      <h1 className="mb-1.5 text-[22px] font-semibold tracking-tight text-zinc-100">
        Connect your database
      </h1>
      <p className="mb-6 text-[13px] leading-relaxed text-zinc-500">
        Enter your database credentials. NexoPOS will test the connection before continuing.
      </p>

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-400">
          {errorMessage}
        </div>
      )}

      <div className="grid flex-1 grid-cols-2 gap-4 content-start">
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label className="text-[12px] font-medium text-zinc-400">Database connection</Label>
          <select
            className="flex h-9 w-full rounded-md border border-zinc-800 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            value={data.database_driver}
            onChange={(e) => handleDataChange("database_driver", e.target.value)}
          >
            <option value="mysql" className="bg-zinc-900">MySQL / MariaDB</option>
            <option value="sqlite" className="bg-zinc-900">SQLite</option>
          </select>
        </div>

        {data.database_driver === "mysql" && (
          <>
            <Field
              name="hostname"
              label="Database host"
              placeholder="127.0.0.1"
              className="col-span-2"
            />
            <Field name="database_port" label="Port" placeholder="3306" />
            <Field name="database_name" label="Database name" placeholder="nexopos_v4" />
            <Field name="username" label="Username" placeholder="root" />
            <Field
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
            />
          </>
        )}

        {data.database_driver === "sqlite" && (
           <div className="col-span-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-[12px] text-zinc-400">
               Make sure Sqlite module is available for PHP. Your database will be located on the database directory.
           </div>
        )}

        <Field
          name="database_prefix"
          label="Database Prefix"
          placeholder="ns_"
          hint="Provide the database prefix."
          className="col-span-2"
        />
      </div>

      {testStatus !== "idle" && (
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          {testSteps.map((step) => (
            <div
              key={step.label}
              className="flex items-center gap-2.5 text-[12px]"
            >
              <span
                className={cn(
                  "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px]",
                  step.status === "ok" && "bg-emerald-500/20 text-emerald-400",
                  step.status === "error" && "bg-red-500/20 text-red-400",
                  step.status === "pending" && "bg-violet-500/20 text-violet-400"
                )}
              >
                {step.status === "ok" ? "✓" : step.status === "error" ? "✗" : "⋯"}
              </span>
              <span className="text-zinc-400">{step.label}</span>
            </div>
          ))}
        </div>
      )}

      <StepActions
        current={1}
        total={STEPS.length}
        onBack={onBack}
        onNext={handleTestAndContinue}
        nextLabel="Save Settings"
        nextLoading={processing}
      />
    </>
  );
}
