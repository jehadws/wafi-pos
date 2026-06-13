import { ReactNode } from "react";

export interface StepConfig {
  id: number;
  key: string;
  hash: string;
  label: string;
  description?: string;
  icon: ReactNode;
}
