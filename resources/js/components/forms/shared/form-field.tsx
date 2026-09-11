'use client';

import { Label } from '@/components/ui/label';
import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export default function FormField({ label, description, required = false, error, children, htmlFor, className = '' }: FormFieldProps) {
  return (
    <div className={className}>
      <Label className={`text-sm font-medium ${required ? "after:text-destructive after:ms-1 after:content-['*']" : ''}`} htmlFor={htmlFor}>
        {label}
      </Label>
      <div className="mt-2">{children}</div>
      {error ? (
        <p className="text-destructive mt-1 text-sm">{error}</p>
      ) : (
        description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      )}
    </div>
  );
}
