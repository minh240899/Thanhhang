# Thanh Hằng Birthday V16 — deployment & source backup

## Architecture
- Static website: `index.html`, `app.js`, `styles.css`, `particle_show.html`, `particle_engine.js`
- Secure Admin: `/admin` (frontend) -> `/api/admin/*` (PBKDF2 hashed credential + HttpOnly signed session)
- Persistent state: Vercel Blob (`secure/birthday-state-v15.enc`), AES-256-GCM encrypted at rest; Vercel public Blob store contains ciphertext only.
- Admin uploads: images and small files up to 3.5 MB; video larger files: use a stable HTTPS URL or extend to signed direct uploads.
- Guest text wishes/comments and likes: `/api/guest` (immediate publication; Admin can hide/delete later; best-effort rate limit). Guest media submissions remain disabled until safe upload controls, quotas and abuse protection are implemented.
- HTML/CSS/JS source: best stored in a private GitHub repository; do not commit `.env*` or any secret. GitHub pushes can trigger Vercel deployments when Git is connected.

## Critical configuration
Vercel project `thanh-hang-birthday` -> Settings -> Environment Variables:
- `ADMIN_SALT` (random hex)
- `ADMIN_PASSWORD_HASH` (PBKDF2-SHA256)
- `SESSION_SECRET` (random)
- `DATA_ENC_KEY` (random 32-byte hex)
- `BLOB_READ_WRITE_TOKEN` (managed by Vercel Blob integration)

Never store raw password in JS/HTML or commit secrets to Git. Rotate credentials after disclosure.

## Key URLs
- Public: `https://thanh-hang-birthday.vercel.app`
- Admin: `https://thanh-hang-birthday.vercel.app/admin`
- Vercel project: `https://vercel.com/levanminh240899-3669/thanh-hang-birthday`
- Project env: `https://vercel.com/levanminh240899-3669/thanh-hang-birthday/settings/environment-variables`
- Storage: `https://vercel.com/levanminh240899-3669/thanh-hang-birthday/stores`
- Source: store locally or in a private GitHub repository; link the Git repo in Vercel Settings > Git for automatic deploy on push.

## Limitations
- V16 Blob JSON with optimistic ETag locking is intended for small private birthday sites, not high-traffic social networks.
- Guest rate limiting is best-effort per function instance; configure persistent anti-spam/CAPTCHA before widespread public distribution.
- Admin login is a single account, not email-based password recovery.
- For multiple uploads, concurrency, robust permissions, audit trails, and moderation, migrate to PostgreSQL/Supabase with RLS.

## V16.1 storage conflict and multi-photo update (2026-11-16)
- Admin trip editor accepts up to 12 JPG/PNG/WebP photos. Uploaded files are compressed client-side and saved to Vercel Blob; the first uploaded image becomes the cover for a new trip. Existing single-image trips are backward compatible.
- The public Journeys section offers a photo-carousel button for each trip, separate from the linked album.
- Reads of the encrypted state object check the current Blob metadata and use an uncached, versioned public URL. This is necessary because `get(..., {access:'public', useCache:false})` does **not** bypass Vercel Blob's public CDN cache.
- Writes retain `ifMatch` optimistic concurrency. A concurrent update returns HTTP 409 instead of an unhandled HTTP 500; guest changes retry using a fresh state.
- Admin image source limit: 8 MiB before compression, upload payload limited to 3.5 MB; server-side upload of MP4/WebM remains limited to 3.5 MB. Larger videos require a direct HTTPS URL or a separately developed signed-client-upload flow.
- Deployment verification: check `GET /api/content`, sign into `/admin`, create/edit a test trip with 2 images, refresh the public site and confirm the carousel. Preserve an Admin JSON export before manual data migrations.
- Concurrent writes with repeated conflicts, network failures, and unsupported file formats remain visible to users. This is still a small-site Blob-backed application, not a transactional multi-user database.
