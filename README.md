# School Website — Next.js 15 + Prisma + Neon + NextAuth + Cloudflare

Production stack: **Next.js 15 App Router · Prisma (Neon adapter) · NextAuth v5 (JWT) · TailwindCSS · Cloudflare Pages/Workers · Cloudflare R2 · Brevo SMTP**.

Target cost: **~$12/yr (domain only)** on free tiers.

---

## Quick start

```bash
# 1. Install dependencies (use pnpm for speed, npm/yarn also work)
pnpm install

# 2. Copy env template and fill in your values (see "Setup" below)
copy .env.example .env

# 3. Generate Prisma client + run first migration against Neon
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 4. Start dev server
pnpm dev
# → http://localhost:3000
# → http://localhost:3000/admin   (login with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
```

---

## Setup (one-time, free)

### 1. Neon (database)
- Sign up at https://neon.tech
- Create a new project (region: closest to your users — Singapore or Mumbai for Sri Lanka)
- Copy the **pooled** connection string (Connection Details → Pooled connection)
- Paste into `.env` as `DATABASE_URL`

### 2. Cloudflare R2 (file storage)
- Cloudflare Dashboard → R2 → Create bucket `school-media`
- Settings → Public Access → enable (or set up a custom domain)
- API tokens → Create token with R2 read+write → save Access Key ID + Secret
- Fill `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL` in `.env`
- **CORS (required for browser uploads).** In the R2 bucket → Settings → CORS Policy, paste:
  ```json
  [
    {
      "AllowedOrigins": ["http://localhost:3000", "https://yourschool.com"],
      "AllowedMethods": ["PUT", "GET", "HEAD"],
      "AllowedHeaders": ["Content-Type", "Content-Length"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
  ```
  Replace `https://yourschool.com` with your production domain. Without this, browser PUTs to the presigned URL will be blocked by CORS.

### 3. Cloudflare Turnstile (anti-spam, free)
- Cloudflare Dashboard → Turnstile → Add site → save Site Key + Secret
- Fill `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`

### 4. Brevo (email, free 300/day)
- Sign up at https://brevo.com
- SMTP & API → Generate SMTP key
- Fill `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

### 5. AUTH_SECRET
- Generate any 32-byte random string:
  - PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))`
  - Or use https://generate-secret.vercel.app/32

---

## Deploy to Cloudflare (free)

```bash
# 1. Log into Cloudflare from CLI
wrangler login

# 2. Push secrets (one-time, do for each)
wrangler secret put AUTH_SECRET
wrangler secret put DATABASE_URL
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put SMTP_USER
wrangler secret put SMTP_PASS

# 3. Set public vars in wrangler.toml or dashboard:
#    AUTH_URL, R2_BUCKET_NAME, R2_PUBLIC_URL, R2_ACCOUNT_ID,
#    NEXT_PUBLIC_TURNSTILE_SITE_KEY, SMTP_HOST, SMTP_PORT, SMTP_FROM

# 4. Build + deploy
pnpm cf:deploy
```

For auto-deploy on git push: in Cloudflare Dashboard → Workers & Pages → Create → connect GitHub repo.

---

## Project structure

```
src/
├── app/
│   ├── [lang]/            Public site (Tamil/English/Sinhala — see middleware)
│   ├── admin/             Protected admin portal (NextAuth-gated)
│   └── api/               Route handlers (auth, upload)
├── lib/                   Prisma client, auth config, permissions, i18n, R2
├── components/            UI (header, footer, language switcher, admin sidebar)
└── messages/              UI translations (ta.json, en.json, si.json)
prisma/
├── schema.prisma          User/Role/Permission/Language/News/Page/Media models
└── seed.ts                Seeds SuperAdmin role + 3 languages + first admin user
```

---

## Multi-language behavior

- URL pattern: `/ta/...`, `/en/...`, `/si/...`. Default is Tamil.
- Middleware redirects `/` → `/ta/` (or whatever the default language is).
- Admin can enable/disable/reorder languages at `/admin/languages`.
- If only **one** language is enabled, the language switcher is hidden.
- Static UI strings live in `src/messages/{lang}.json`.
- Dynamic content (news, pages) uses translation tables: e.g. `NewsTranslation(newsId, langCode, title, body)`.

---

## Roles & Permissions

Default role on first run: **SuperAdmin** (cannot be deleted, has all permissions).

Permission keys are seeded in `prisma/seed.ts`. Example:
`Dashboard.View`, `News.Create`, `News.Publish`, `Users.Manage`, `Roles.Manage`, `Languages.Manage`, `Settings.Edit`, ...

Guard a server action / route:
```ts
import { requirePermission } from "@/lib/permissions";
await requirePermission("News.Create");
```

Add new roles + assign permissions via `/admin/roles` (permission matrix UI).

---

## What's stubbed vs. complete in this scaffold

✅ Complete and working:
- Project config, Prisma schema, seed
- NextAuth credentials login (JWT) + middleware route guard
- Language detection middleware + switcher component
- Home page, About, Contact, News list (read from DB)
- Admin login + dashboard + language management
- R2 presigned-URL upload endpoint
- Tailwind theme + Tamil/Sinhala font support

🟡 Stubbed (UI scaffold in place; CRUD to be filled in):
- Admin News editor (form/WYSIWYG)
- Admin Users management (list + form)
- Admin Roles + permission matrix UI
- Admin Settings (site config)

Fill the stubs in as needed, or open another session and ask Claude to complete them.
