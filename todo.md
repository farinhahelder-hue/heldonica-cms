# Heldonica CMS — Project TODO

## Build & Deployment
- [ ] Fix TypeScript build errors (suppress implicit any in tsconfig.json)
- [ ] Pass `npm run build` without errors
- [x] Write comprehensive README (stack, env vars, dev/build/deploy Vercel)
- [x] Create GitHub repo `farinhahelder-hue/heldonica-cms`
- [x] Push code to GitHub
- [ ] Deploy to Vercel as `heldonica-cms.vercel.app`
- [ ] Configure Vercel env vars (RESEND_API_KEY, ADMIN_EMAIL, DATABASE_URL, JWT_SECRET, OAuth vars)
- [ ] Verify live Vercel URL

## Database & Schema
- [x] Design CMS content schema (pages, articles, media)
- [x] Create Drizzle schema tables
- [x] Generate and apply migrations

## Backend (tRPC)
- [x] Create tRPC procedures for content CRUD
- [x] Implement role-based access control (admin/user)
- [x] Add protected procedures for admin-only operations
- [ ] Write vitest tests for CRUD operations

## Frontend UI
- [x] Set up DashboardLayout for CMS interface
- [x] Create content listing page (Dashboard, PagesManager, ArticlesManager)
- [x] Create content editor page (ArticleEditor, PageEditor)
- [x] Implement role-based UI (show admin features only for admins)
- [x] Add authentication check and logout (via DashboardLayout)
- [x] SEO fields + SERP preview in editors
- [x] Markdown toolbar (H2, H3, Bold, Italic, Code, Lists, Quote, Link)
- [x] Write / Preview toggle
- [x] Auto-slug generation from title
- [x] Word count + reading time
- [x] Publish / Draft / Depublish workflow

## Environment & Secrets
- [ ] Request and set RESEND_API_KEY
- [ ] Request and set ADMIN_EMAIL
- [ ] Verify all OAuth env vars are configured
- [ ] Test database connection

## Prochaines étapes
- [ ] Lot 2 — Gestionnaire de médias (upload d'images)
- [ ] Lot 3 — Tableau de bord avancé (stats, derniers articles)
- [ ] Fix TypeScript strict mode pour build Vercel propre
