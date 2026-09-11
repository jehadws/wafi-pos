export type ResetMode = 'wipe_plus_grocery' | 'wipe_all' | string;

export interface ResetModeOption {
  label: string;
  value: ResetMode;
}

export interface ResetSettingsPayload {
  mode: ResetMode;
  create_sales: boolean;
  create_procurements: boolean;
}

export interface ResetSettingsOptions {
  modes: ResetModeOption[];
}

export interface ResetPageProps {
  title?: string;
  description?: string;
  identifier?: string;
  payload?: ResetSettingsPayload;
  options: ResetSettingsOptions;
}
