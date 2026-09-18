export type ShopProvider = 'stripe' | 'paypal' | 'external';

export interface ShopSettings {
  project_id: string;
  provider: ShopProvider;
  currency: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}