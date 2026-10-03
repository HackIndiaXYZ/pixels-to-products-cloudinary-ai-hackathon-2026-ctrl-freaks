# RAW → REUSE — MASTER BUILD SPEC

## Mission
Build a real, deployed full-stack MVP for Track 3 (Your Media-Savvy Startup).
Tagline: **Discover what a construction site can save before it becomes waste.**

Product: construction/demolition photos and videos → Cloudinary AI discovers potentially reusable materials → searchable material inventory → user creates reuse request → matching engine → Cloudinary reference-image generation creates second-life concept visualizations → shareable opportunity page.

## Positioning
Pitch as: **a visual intelligence layer that discovers recoverable materials from ordinary construction media and turns those real materials into reuse opportunities.**
Do NOT position as a marketplace, generic material-passport system, object detector, structural inspector, or generic image generator.

## Users
- demolition/renovation contractors
- architects/interior designers
- material recovery teams
- circular-construction/sustainability teams

## Required happy path
1. Create project.
2. Upload site image(s), optional video.
3. Upload to Cloudinary.
4. Analyze with Cloudinary AI Vision.
5. Extract material candidates + visual condition/context as structured JSON.
6. Persist business records in Supabase Postgres and link them to Cloudinary assets.
7. Browse/search/filter inventory.
8. Open a material.
9. Create a reuse request such as “modern office room divider”.
10. Match compatible materials using transparent scoring.
11. Select a real material and generate 3 second-life concepts using that real source asset as reference.
12. Save/share the opportunity.

## Screens
/ landing
/projects
/projects/new
/projects/[id]
/projects/[id]/upload
/projects/[id]/inventory
/materials/[id]
/projects/[id]/reuse
/materials/[id]/concept
/opportunities/[id]

## UI
Premium industrial/editorial SaaS. Dark charcoal + warm neutrals, restrained accent, strong typography, large media, subtle motion, polished loading/error/empty states. Do not make a generic admin dashboard. Prioritize inventory and the “Find a Second Life” interaction.

## Stack
Next.js App Router + TypeScript strict + Tailwind + shadcn/ui (or equivalent) + Supabase Postgres/Auth + Cloudinary + Vercel.
No SQLite. No Render.

## DB
projects: id, name, location, project_type, description, created_at, updated_at
media_assets: id, project_id, cloudinary_public_id, cloudinary_asset_id, resource_type, secure_url, original_filename, mime_type, status, analysis_status, created_at, updated_at
materials: id, project_id, media_asset_id, material_type, visual_condition, visible_damage, context_description, reuse_candidate, ai_confidence, review_status, quantity_estimate, created_at, updated_at
reuse_requests: id, project_id, title, description, style, target_dimensions, budget_text, created_at, updated_at
reuse_matches: id, material_id, reuse_request_id, match_score, reason, created_at
generated_concepts: id, material_id, reuse_request_id, prompt, concept_type, cloudinary_public_id, secure_url, created_at

## Backend
Server-side only: signed Cloudinary upload signature, Cloudinary AI Vision, Cloudinary tags/metadata where needed, Cloudinary Search where useful, Cloudinary generation, Supabase service-role DB operations, business matching, validation.
Never expose CLOUDINARY_API_SECRET or SUPABASE_SERVICE_ROLE_KEY.

## Cloudinary is CORE
Use: Upload API; AI Vision custom tagging; AI Vision General/Analyze with JSON Schema if available; structured metadata; Search API; transformations; f_auto/q_auto; Image Generation with source/reference image; MediaFlows after core path works; AI Video Analysis only as optional bonus.

## Material taxonomy
wooden-door, timber, window, steel-member, brick, tile, lighting-fixture, cabinet, pipe, other-material

## Visual condition vocabulary
appears-intact, appears-reusable, minor-surface-wear, visible-damage, broken, rust/corrosion, obstructed, uncertain

## AI rules
Visual estimates only. Never claim structural integrity, load-bearing capacity, exact dimensions, hidden defects, code compliance, or safety certification.
Generated images must be labeled **Concept visualization**.

## AI JSON target
{
  "materials": [{
    "type": "wooden-door",
    "confidence": 0.91,
    "visual_condition": "appears-reusable",
    "visible_damage": ["minor-surface-wear"],
    "context": "interior doorway",
    "reuse_candidate": true,
    "quantity_estimate": 1
  }],
  "scene_summary": "..."
}

## AI Vision prompt
Analyze this construction or demolition site media for potentially recoverable materials. Identify visible construction materials or installed elements that may be reusable. For each candidate: classify using the supplied taxonomy; give confidence 0..1; describe only visually observable condition; list visible damage/wear; describe surrounding context; decide whether it appears potentially reusable from visual evidence only. Do not infer structural integrity, hidden defects, exact dimensions, load-bearing capacity, engineering safety, or code compliance. Return strict JSON matching the supplied schema.

## Generation prompt
Using this reclaimed construction material as the primary source material, visualize a plausible second-life design for: {REQUEST}. Preserve recognizable characteristics, visible texture/details and proportions of the source material where possible. Create a polished architectural/interior concept image. This is a concept visualization, not an engineering recommendation.

## Matching
Transparent weighted scoring based on material compatibility, condition, requested use compatibility, optional style, and availability. Return score + explanation.

## Demo
Seed a Demo Project with 6–10 strong construction/demolition photos and optionally one short walkthrough video. Do not fake AI results when the real Cloudinary flow is available. A clearly marked fallback may exist only for API outage.

## Delivery
Run lint, typecheck, build; fix errors. Provide .env.example and README. Verify deployed happy path on Vercel.
