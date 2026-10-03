# CLOUDINARY AI SPEC

Cloudinary must perform meaningful media work; it is not just storage.

## Pipeline
Upload → AI Vision → structured result → Cloudinary tags/metadata → searchable inventory → transformed delivery → reference-image generation.

## AI Vision custom tag list
wooden-door, timber, window, steel-member, brick, tile, lighting-fixture, cabinet, pipe, other-material

## General analysis
Use Cloudinary Analyze / AI Vision General with a JSON Schema if the account/API supports it. Validate output server-side with TypeScript/Zod before DB insert.

## Metadata fields
project_id
material_type
visual_condition
reuse_candidate
ai_confidence
review_status
source_zone

## Search dimensions
project_id, material_type, visual_condition, reuse_candidate, review_status

## Transformations
Inventory thumbnails, detail images, optional crops. Use f_auto and q_auto for delivery.

## Generation
For a selected real material, use image-to-image/reference-image generation where enabled. Generate 3 concepts and save Cloudinary public IDs/URLs in generated_concepts.

Base prompt:
“Using this reclaimed construction material as the primary source material, visualize a plausible second-life design for: {REQUEST}. Preserve recognizable characteristics and visible texture/details of the source material where possible. Create a polished architectural/interior concept image. This is a concept visualization, not an engineering recommendation.”

## Optional only after image path works
MediaFlows: upload → AI Vision → tags → metadata → inventory-ready.
AI Video Analysis: walkthrough video → timestamped scenes/material mentions. Do not make video a critical dependency.
