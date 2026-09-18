export type ModuleStatus = 'all' | 'enabled' | 'disabled' | 'invalid';

export type ModuleDependency = {
  'min-version'?: string;
  'max-version'?: string;
  name?: string;
};

export type ModuleCore = {
  'min-version'?: string;
  'max-version'?: string;
};

export type Module = {
  namespace: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  enabled: boolean;
  autoloaded: boolean;
  'psr-4-compliance': boolean;
  requires?: Record<string, ModuleDependency>;
  core?: ModuleCore;
  path?: string;
  relativePath?: string;
  'index-file'?: string | false;
  'routes-file'?: string | false;
  'api-file'?: string | false;
  'controllers-path'?: string;
  'views-path'?: string;
  'requires-composer'?: boolean;
  'composer-installed'?: boolean;
  'has-languages'?: boolean;
  files?: string[];
  migrations?: string[];
  'all-migrations'?: string[];
  providers?: string[];
  actions?: string[];
  filters?: string[];
  commands?: Record<string, string>;
};

export type ModuleListResponse = {
  modules: Module[];
  total_enabled: number;
  total_disabled: number;
  total_invalid: number;
};

export type ModuleActionResponse = {
  status: string;
  code?: string;
  message: string;
  module?: Module;
};
