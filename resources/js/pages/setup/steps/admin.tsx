import React from "react";
import { useForm } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepActions } from "../components/step-actions";
import { STEPS } from "../config";

interface AdminForm {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  password_confirmation: string;
}

interface AdminPageProps {
  onBack: () => void;
  onNext: () => void;
}

export function AdminPage({ onBack, onNext }: AdminPageProps) {
  const { data, setData, post, processing, errors } = useForm<AdminForm>({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    password: "",
    password_confirmation: "",
  });

  const handleSubmit = () => {
    post(route("setup.admin"), {
      preserveScroll: true,
      onSuccess: onNext,
    });
  };

  const Field = ({
    name,
    label,
    className,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & {
    name: keyof AdminForm;
    label: string;
    className?: string;
  }) => (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-[12px] font-medium text-zinc-400">{label}</Label>
      <Input
        {...props}
        value={data[name]}
        onChange={(e) => setData(name, e.target.value)}
      />
      {errors[name] && (
        <p className="text-[11px] text-red-400">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-violet-400">
        Step 4 — Admin Account
      </p>
      <h1 className="mb-1.5 text-[22px] font-semibold tracking-tight text-zinc-100">
        Create your admin account
      </h1>
      <p className="mb-6 text-[13px] leading-relaxed text-zinc-500">
        This account will have full access to the system. You can add more users
        after installation.
      </p>

      <div className="grid flex-1 grid-cols-2 gap-4 content-start">
        <Field name="first_name" label="First name" placeholder="Ahmad" />
        <Field name="last_name" label="Last name" placeholder="Al-Mansouri" />
        <Field
          name="email"
          label="Email address"
          type="email"
          placeholder="admin@yourstore.com"
          className="col-span-2"
        />
        <Field
          name="username"
          label="Username"
          placeholder="admin"
          className="col-span-2 font-mono"
        />
        <Field
          name="password"
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
        />
        <Field
          name="password_confirmation"
          label="Confirm password"
          type="password"
          placeholder="Repeat password"
        />
      </div>

      <StepActions
        current={3}
        total={STEPS.length}
        onBack={onBack}
        onNext={handleSubmit}
        nextLabel="Install NexoPOS"
        nextLoading={processing}
      />
    </>
  );
}
