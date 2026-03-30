import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // CMS Pages router
  pages: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(({ input }) => db.getPages(input?.limit)),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => db.getPageBySlug(input.slug)),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        content: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createPage({
          ...input,
          authorId: ctx.user.id,
          status: 'draft',
        })
      ),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().optional(),
        content: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(['draft', 'published', 'archived']).optional(),
        publishedAt: z.date().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updatePage(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deletePage(input.id)),
  }),

  // CMS Articles router
  articles: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(({ input }) => db.getArticles(input?.limit)),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => db.getArticleBySlug(input.slug)),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        category: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createArticle({
          ...input,
          authorId: ctx.user.id,
          status: 'draft',
        })
      ),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        category: z.string().optional(),
        status: z.enum(['draft', 'published', 'archived']).optional(),
        publishedAt: z.date().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateArticle(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteArticle(input.id)),
  }),

  // CMS Media router
  media: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(({ input }) => db.getMedia(input?.limit)),

    upload: protectedProcedure
      .input(z.object({
        filename: z.string(),
        url: z.string(),
        fileKey: z.string(),
        mimeType: z.string().optional(),
        size: z.number().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createMedia({
          ...input,
          uploadedBy: ctx.user.id,
        })
      ),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteMedia(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
