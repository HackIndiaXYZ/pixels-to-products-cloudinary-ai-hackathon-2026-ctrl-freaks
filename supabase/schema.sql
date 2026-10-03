create extension if not exists pgcrypto;

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  project_type text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  cloudinary_public_id text not null,
  cloudinary_asset_id text,
  resource_type text not null default 'image',
  secure_url text not null,
  original_filename text,
  mime_type text,
  status text not null default 'uploaded',
  analysis_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  media_asset_id uuid not null references media_assets(id) on delete cascade,
  material_type text not null,
  visual_condition text,
  visible_damage jsonb not null default '[]'::jsonb,
  context_description text,
  reuse_candidate boolean not null default false,
  ai_confidence numeric(5,4),
  review_status text not null default 'ai_pending',
  quantity_estimate numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reuse_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  style text,
  target_dimensions text,
  budget_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reuse_matches (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials(id) on delete cascade,
  reuse_request_id uuid not null references reuse_requests(id) on delete cascade,
  match_score numeric(5,2) not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists generated_concepts (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials(id) on delete cascade,
  reuse_request_id uuid references reuse_requests(id) on delete set null,
  prompt text not null,
  concept_type text,
  cloudinary_public_id text,
  secure_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_media_assets_project on media_assets(project_id);
create index if not exists idx_materials_project on materials(project_id);
create index if not exists idx_materials_type on materials(material_type);
create index if not exists idx_materials_reuse on materials(reuse_candidate);
create index if not exists idx_matches_request on reuse_matches(reuse_request_id);
