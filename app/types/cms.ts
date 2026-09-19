export interface CmsCollection {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  fields: string[];
  created_at: string;
  updated_at: string;
}

export interface CmsRecord {
  id: string;
  collection_id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CmsCollectionWithRecords extends CmsCollection {
  records: CmsRecord[];
}

export interface CmsDetailSettings {
  enabled: boolean;
  collectionId: string;
  slugField: string;
  routePrefix?: string;
}