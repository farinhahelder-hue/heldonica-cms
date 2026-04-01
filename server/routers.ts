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

    // Public list - only published pages
    listPublished: publicProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(({ input }) => db.getPublishedPages(input?.limit)),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => db.getPageBySlug(input.slug)),

    // Public get by slug - only published
    getPublishedBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => db.getPublishedPageBySlug(input.slug)),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        content: z.string().optional(),
        description: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        ogImage: z.string().optional(),
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
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        ogImage: z.string().optional(),
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

    // Public list - only published articles
    listPublished: publicProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(({ input }) => db.getPublishedArticles(input?.limit)),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => db.getArticleBySlug(input.slug)),

    // Public get by slug - only published
    getPublishedBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => db.getPublishedArticleBySlug(input.slug)),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        category: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        ogImage: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const readTime = db.calculateReadTime(input.content);
        return db.createArticle({
          ...input,
          readTime,
          authorId: ctx.user.id,
          status: 'draft',
        });
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        category: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        ogImage: z.string().optional(),
        status: z.enum(['draft', 'published', 'archived']).optional(),
        publishedAt: z.date().optional(),
      }))
      .mutation(({ input }) => {
        const { id, content, ...data } = input;
        const updateData = { ...data };
        if (content) {
          updateData.content = content;
          updateData.readTime = db.calculateReadTime(content);
        }
        return db.updateArticle(id, updateData);
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

  // CMS Destinations router
  destinations: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(({ input }) => db.getDestinations(input?.limit)),

    // Public list - only published destinations
    listPublished: publicProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(({ input }) => db.getPublishedDestinations(input?.limit)),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => db.getDestinationBySlug(input.slug)),

    // Public get by slug - only published
    getPublishedBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => db.getPublishedDestinationBySlug(input.slug)),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        country: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        image: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        ogImage: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createDestination({
          ...input,
          authorId: ctx.user.id,
          status: 'draft',
        })
      ),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        country: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        image: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        ogImage: z.string().optional(),
        status: z.enum(['draft', 'published', 'archived']).optional(),
        publishedAt: z.date().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateDestination(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteDestination(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
