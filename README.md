# Heldonica CMS

CMS headless pour [heldonica.fr](https://heldonica.fr) — stack : Express + tRPC + Drizzle ORM + React + TipTap.

## Fonctionnalités

- **Articles** — éditeur TipTap riche (H1/H2/H3, gras, italique, lien, image, liste, blockquote, code)
- **Pages** — gestion du contenu statique
- **Destinations** — catalogue de destinations slow travel
- **Travel Planning** — CRM interne pour gérer les demandes du formulaire heldonica.fr
- **Médiathèque** — upload vers S3/Cloudflare R2 via URL présignée
- **API publique REST** — `/api/public/articles`, `/api/public/destinations`, etc.

## API Publique

```
GET /api/public/articles?limit=10&category=slow-travel
GET /api/public/articles/:slug
GET /api/public/pages?limit=10
GET /api/public/pages/:slug
GET /api/public/destinations?limit=10&country=Portugal
GET /api/public/destinations/:slug
GET /api/public/travel-requests   (x-api-key requis)
```

Consommable depuis `heldonica.fr` :

```js
// Next.js / Astro
const res = await fetch('https://cms.heldonica.fr/api/public/articles?limit=5');
const { data } = await res.json();
```

## Variables d'environnement

```env
DATABASE_URL=mysql://...
S3_BUCKET=heldonica-media
S3_REGION=auto
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_URL=https://media.heldonica.fr
PUBLIC_API_KEY=<secret pour /api/public/travel-requests>
```

## Migration DB

```bash
pnpm db:push
```
