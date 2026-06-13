import { Database, PartyPopper, ShieldCheck, Store, UserCog } from "lucide-react";
import { StepConfig } from "./types";

export const STEPS: StepConfig[] = [
  {
    id: 0,
    key: "welcome",
    hash: "#/",
    label: "Welcome",
    icon: <ShieldCheck size={14} />,
  },
  {
    id: 1,
    key: "database",
    hash: "#/database",
    label: "Database",
    description: "Connection & credentials",
    icon: <Database size={14} />,
  },
  {
    id: 2,
    key: "configuration",
    hash: "#/configuration",
    label: "Configuration",
    description: "Store & admin details",
    icon: <Store size={14} />,
  },
  {
    id: 3,
    key: "complete",
    hash: "#/complete",
    label: "Complete",
    icon: <PartyPopper size={14} />,
  },
];
