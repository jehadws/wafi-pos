export interface TaxItem {
  id?: number;
  tax_id?: number;
  name: string;
  rate: number;
  tax_value?: number;
  description?: string;
}

export interface TaxGroup {
  id?: number;
  name?: string;
  description?: string;
  taxes?: TaxItem[];
}

export interface Tax {
  name: string;
  description: string;
  taxes: TaxItem[];
}
