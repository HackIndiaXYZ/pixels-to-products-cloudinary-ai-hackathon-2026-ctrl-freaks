# CLAUDE RULES

- Read MASTER_BUILD_SPEC.md and CLOUDINARY_AI_SPEC.md first.
- Build a real full-stack app, not a static mock.
- Cloudinary AI Vision is a required core dependency for media understanding.
- Do not replace core Cloudinary AI Vision with another vision provider.
- Cloudinary is not just storage.
- Never expose CLOUDINARY_API_SECRET or SUPABASE_SERVICE_ROLE_KEY to the browser.
- Never commit secrets.
- Do not use SQLite or Render.
- Supabase is the business-data source of truth; Cloudinary owns media and media intelligence.
- Generated concepts must link back to the source material.
- Use “visual condition”, “appears reusable”, and “concept visualization”.
- No fake successful AI results when the real API fails.
- Complete the end-to-end happy path before stretch features.
- Run lint/typecheck/build before declaring complete.
