export interface ProjectRow {
  id: string;
  name: string;
  location: string | null;
  project_type: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type AnalysisStatus = 'pending' | 'processing' | 'complete' | 'failed';

export interface MediaAssetRow {
  id: string;
  project_id: string;
  cloudinary_public_id: string;
  cloudinary_asset_id: string | null;
  resource_type: string;
  secure_url: string;
  original_filename: string | null;
  mime_type: string | null;
  status: string;
  analysis_status: AnalysisStatus;
  created_at: string;
  updated_at: string;
}

export interface MaterialRow {
  id: string;
  project_id: string;
  media_asset_id: string;
  material_type: string;
  visual_condition: string | null;
  visible_damage: string[];
  context_description: string | null;
  reuse_candidate: boolean;
  ai_confidence: number | null;
  review_status: string;
  quantity_estimate: number | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyzeResult {
  mediaAssetId: string;
  sceneSummary: string;
  materials: MaterialRow[];
  warnings: string[];
}

export interface ReuseRequestRow {
  id: string;
  project_id: string;
  title: string;
  description: string;
  style?: string | null;
  target_dimensions?: string | null;
  budget_text?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReuseMatchRow {
  id: string;
  material_id: string;
  reuse_request_id: string;
  match_score: number;
  reason: string;
  created_at: string;
}

export interface GeneratedConceptRow {
  id: string;
  material_id: string;
  reuse_request_id: string | null;
  prompt: string;
  concept_type: string;
  cloudinary_public_id: string | null;
  secure_url: string;
  created_at: string;
}

export interface OpportunityData {
  project: ProjectRow;
  material: MaterialRow;
  sourceMedia: MediaAssetRow;
  reuseRequest?: ReuseRequestRow | null;
  match?: ReuseMatchRow | null;
  concepts: GeneratedConceptRow[];
}
