# Heldonica CMS — Project TODO

## Build & Deployment
- [ ] Fix TypeScript build errors (suppress implicit any in tsconfig.json)
- [ ] Pass `npm run build` without errors
- [x] Write comprehensive README (stack, env vars, dev/build/deploy Vercel)
- [ ] Create GitHub repo `farinhahelder-hue/heldonica-cms`
- [ ] Push code to GitHub
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
- [x] Create content listing page (Dashboard, PagesManager)
- [ ] Create content editor page
- [x] Implement role-based UI (show admin features only for admins)
- [x] Add authentication check and logout (via DashboardLayout)

## Environment & Secrets
- [ ] Request and set RESEND_API_KEY
- [ ] Request and set ADMIN_EMAIL
- [ ] Verify all OAuth env vars are configured
- [ ] Test database connection
