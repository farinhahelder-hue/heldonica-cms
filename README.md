# Heldonica CMS

A modern B2B content management system built with React, Vite, tRPC, and Drizzle ORM. This CMS provides a dashboard interface for managing content with role-based access control and real-time authentication.

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend Framework** | React | 19.2.1 |
| **Build Tool** | Vite | 7.1.7 |
| **Backend Framework** | Express | 4.21.2 |
| **RPC Framework** | tRPC | 11.6.0 |
| **Database ORM** | Drizzle ORM | 0.44.5 |
| **Database** | MySQL/TiDB | - |
| **Styling** | Tailwind CSS | 4.1.14 |
| **UI Components** | shadcn/ui + Radix UI | Latest |
| **Authentication** | Manus OAuth | - |
| **Testing** | Vitest | 2.1.4 |

## Features

**Authentication & Authorization**
- Manus OAuth integration with automatic session management
- Role-based access control (admin and user roles)
- Protected procedures for admin-only operations
- Automatic user upsert on login

**Content Management**
- Dashboard layout with sidebar navigation
- Create, read, update, and delete (CRUD) operations for content
- Type-safe database queries via Drizzle ORM
- Real-time data synchronization with tRPC

**Developer Experience**
- End-to-end type safety from database to frontend
- Superjson serialization for automatic Date handling
- Hot module replacement (HMR) during development
- Comprehensive test suite with Vitest

## Environment Variables

The following environment variables are required for the application to function. These are automatically injected by the Manus platform:

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | MySQL/TiDB connection string | Yes | `mysql://user:pass@host/db` |
| `JWT_SECRET` | Secret key for session cookie signing | Yes | Auto-generated |
| `VITE_APP_ID` | Manus OAuth application ID | Yes | Auto-generated |
| `OAUTH_SERVER_URL` | Manus OAuth backend base URL | Yes | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL (frontend) | Yes | Auto-generated |
| `OWNER_OPEN_ID` | Owner's Manus OpenID | Yes | Auto-generated |
| `OWNER_NAME` | Owner's display name | Yes | Auto-generated |
| `BUILT_IN_FORGE_API_URL` | Manus built-in APIs base URL | Yes | Auto-generated |
| `BUILT_IN_FORGE_API_KEY` | Bearer token for server-side API access | Yes | Auto-generated |
| `VITE_FRONTEND_FORGE_API_KEY` | Bearer token for frontend API access | Yes | Auto-generated |
| `VITE_FRONTEND_FORGE_API_URL` | Manus built-in APIs URL for frontend | Yes | Auto-generated |
| `RESEND_API_KEY` | API key for email service (optional) | No | `re_...` |
| `ADMIN_EMAIL` | Administrator email address (optional) | No | `admin@example.com` |

**Note:** Do not commit `.env` files to version control. All environment variables are managed through the Manus platform and automatically injected at runtime.

## Project Structure

```
client/
  public/              ← Configuration files only (favicon.ico, robots.txt)
  src/
    pages/             ← Page-level components
    components/        ← Reusable UI components
    contexts/          ← React context providers
    hooks/             ← Custom React hooks
    lib/trpc.ts        ← tRPC client configuration
    App.tsx            ← Main routes and layout
    main.tsx           ← React providers and entry point
    index.css          ← Global styles and Tailwind configuration
drizzle/
  schema.ts            ← Database schema definitions
  migrations/          ← Generated SQL migrations
server/
  db.ts                ← Database query helpers
  routers.ts           ← tRPC procedure definitions
  storage.ts           ← S3 file storage helpers
  _core/               ← Framework-level infrastructure (do not edit)
shared/
  const.ts             ← Shared constants
  types.ts             ← Shared TypeScript types
dist/                  ← Build output (generated)
```

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm 10+
- MySQL 8.0+ or TiDB compatible database
- Manus platform account with OAuth configured

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/farinhahelder-hue/heldonica-cms.git
cd heldonica-cms
pnpm install
```

### Development

Start the development server with hot module replacement:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`. The frontend and backend run together in development mode with automatic reloading.

### Building for Production

Create an optimized production build:

```bash
pnpm build
```

This command performs two steps:

1. **Vite build** — Compiles the React frontend to static assets in `dist/public`
2. **esbuild** — Bundles the Express backend server to `dist/index.js`

### Running in Production

Start the production server:

```bash
pnpm start
```

The server will listen on the port specified by the environment or default to port 3000.

## Database Management

### Schema Definition

Database tables are defined in `drizzle/schema.ts` using Drizzle ORM's type-safe API. Each table definition automatically generates TypeScript types for use throughout the application.

### Generating Migrations

After modifying the schema, generate a migration file:

```bash
pnpm drizzle-kit generate
```

This creates a SQL migration file in `drizzle/migrations/` that describes the changes.

### Applying Migrations

Migrations are applied automatically during the build process. To manually apply migrations:

```bash
pnpm db:push
```

## API Development

### Creating tRPC Procedures

All backend logic is exposed through tRPC procedures in `server/routers.ts`. Procedures are type-safe and automatically available to the frontend via the tRPC client.

**Example: Public procedure**

```typescript
export const appRouter = router({
  content: router({
    list: publicProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      return db.select().from(content).limit(10);
    }),
  }),
});
```

**Example: Protected procedure (admin only)**

```typescript
adminOnlyProcedure: protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
  return next({ ctx });
}),

export const appRouter = router({
  content: router({
    create: adminOnlyProcedure
      .input(z.object({ title: z.string(), body: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        return db.insert(content).values({
          title: input.title,
          body: input.body,
          authorId: ctx.user.id,
        });
      }),
  }),
});
```

### Consuming Procedures from Frontend

Use the tRPC React hooks to call procedures from components:

```typescript
import { trpc } from '@/lib/trpc';

export function ContentList() {
  const { data, isLoading } = trpc.content.list.useQuery();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <ul>
      {data?.map(item => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  );
}
```

## Testing

Write tests for backend procedures using Vitest. Tests should verify both success and error paths:

```bash
pnpm test
```

Example test file (`server/content.test.ts`):

```typescript
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("content.list", () => {
  it("returns content items", async () => {
    const caller = appRouter.createCaller({ user: null });
    const result = await caller.content.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
```

## Deployment to Vercel

### Prerequisites

- GitHub repository with the code pushed
- Vercel account linked to GitHub

### Step 1: Create GitHub Repository

Create a new private repository on GitHub:

```bash
gh repo create heldonica-cms --private
git remote add origin https://github.com/farinhahelder-hue/heldonica-cms.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Select the `heldonica-cms` repository
4. Vercel will auto-detect the project as a Node.js application

### Step 3: Configure Environment Variables

In the Vercel project settings, add all required environment variables from the Manus platform:

- `DATABASE_URL`
- `JWT_SECRET`
- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `VITE_OAUTH_PORTAL_URL`
- `OWNER_OPEN_ID`
- `OWNER_NAME`
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_URL`
- `RESEND_API_KEY` (if using email)
- `ADMIN_EMAIL` (if using email)

### Step 4: Configure Build Settings

Vercel should auto-detect these settings, but verify:

| Setting | Value |
|---------|-------|
| **Build Command** | `pnpm build` |
| **Output Directory** | `dist` |
| **Install Command** | `pnpm install` |

### Step 5: Deploy

Push code to trigger automatic deployment:

```bash
git push origin main
```

Vercel will automatically build and deploy. The live URL will be `https://heldonica-cms.vercel.app`.

### Monitoring Deployments

- View deployment logs in Vercel Dashboard
- Check application health at `/api/health` (if implemented)
- Monitor database connections and performance

## Common Tasks

### Adding a New Database Table

1. Define the table in `drizzle/schema.ts`
2. Generate migration: `pnpm drizzle-kit generate`
3. Review the generated SQL in `drizzle/migrations/`
4. Create a query helper in `server/db.ts`
5. Add tRPC procedures in `server/routers.ts`
6. Create frontend components to consume the procedures

### Promoting a User to Admin

Update the user's role directly in the database:

```sql
UPDATE users SET role = 'admin' WHERE openId = 'user-open-id';
```

Or use the Manus management UI to modify the user record.

### Enabling Email Notifications

Set `RESEND_API_KEY` and `ADMIN_EMAIL` in environment variables, then use the notification helper:

```typescript
import { notifyOwner } from "./server/_core/notification";

await notifyOwner({
  title: "New Content Submitted",
  content: "A new article has been submitted for review."
});
```

## Troubleshooting

**Build fails with TypeScript errors**

Run type checking:

```bash
pnpm check
```

Fix any reported errors or suppress with `// @ts-ignore` (use sparingly).

**Database connection fails**

Verify `DATABASE_URL` is correctly set and the database is accessible. Check connection string format for your database provider.

**OAuth login redirects to wrong URL**

Ensure `VITE_OAUTH_PORTAL_URL` and `OAUTH_SERVER_URL` are correctly configured in environment variables.

**Vercel deployment fails**

1. Check build logs in Vercel Dashboard
2. Verify all environment variables are set
3. Ensure database is accessible from Vercel's servers
4. Check that `pnpm build` succeeds locally

## Contributing

When making changes to the codebase:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and test locally
3. Run tests: `pnpm test`
4. Commit with clear messages: `git commit -m "feat: add new feature"`
5. Push to GitHub: `git push origin feature/your-feature`
6. Create a pull request for review

## License

MIT

## Support

For issues or questions, please open an issue on the [GitHub repository](https://github.com/farinhahelder-hue/heldonica-cms).
