import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { InsertArticle } from "../drizzle/schema";
import * as db from "./db";
import { sendTravelRequestEmails } from "./emailService";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  return next({ ctx });
});

function getS3Client() {
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Upload — génère une URL présignée S3/R2
  upload: router({
    presign: protectedProcedure
      .input(z.object({
        filename: z.string(),
        contentType: z.string(),
        folder: z.string().optional().default("media"),
      }))
      .mutation(async ({ input }) => {
        const bucket = process.env.S3_BUCKET;
        if (!bucket) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'S3_BUCKET not configured' });
        const ext = input.filename.split('.').pop() ?? '';
        const key = `${input.folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const s3 = getS3Client();
        const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: input.contentType });
        const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
        const publicUrl = process.env.S3_PUBLIC_URL
          ? `${process.env.S3_PUBLIC_URL.replace(/\/$/, '')}/${key}`
          : uploadUrl.split('?')[0];
        return { uploadUrl, publicUrl, key };
      }),
  }),

  pages: router({
    list: publicProcedure.input(z.object({ limit: z.number().default(10) }).optional()).query(({ input }) => db.getPages(input?.limit)),
    listPublished: publicProcedure.input(z.object({ limit: z.number().default(10) }).optional()).query(({ input }) => db.getPublishedPages(input?.limit)),
    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => db.getPageBySlug(input.slug)),
    getPublishedBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => db.getPublishedPageBySlug(input.slug)),
    create: adminProcedure
      .input(z.object({ title: z.string().min(1), slug: z.string().min(1), content: z.string().optional(), description: z.string().optional(), metaTitle: z.string().optional(), metaDescription: z.string().optional(), ogImage: z.string().optional(), status: z.enum(['draft', 'published', 'archived']).optional() }))
      .mutation(({ ctx, input }) => db.createPage({ ...input, authorId: ctx.user.id, status: input.status ?? 'draft' })),
    update: adminProcedure
      .input(z.object({ id: z.number(), title: z.string().optional(), slug: z.string().optional(), content: z.string().optional(), description: z.string().optional(), metaTitle: z.string().optional(), metaDescription: z.string().optional(), ogImage: z.string().optional(), status: z.enum(['draft', 'published', 'archived']).optional(), publishedAt: z.date().optional() }))
      .mutation(({ input }) => { const { id, ...data } = input; return db.updatePage(id, data); }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deletePage(input.id)),
  }),

  articles: router({
    list: publicProcedure.input(z.object({ limit: z.number().default(10) }).optional()).query(({ input }) => db.getArticles(input?.limit)),
    listPublished: publicProcedure.input(z.object({ limit: z.number().default(10) }).optional()).query(({ input }) => db.getPublishedArticles(input?.limit)),
    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => db.getArticleBySlug(input.slug)),
    getPublishedBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => db.getPublishedArticleBySlug(input.slug)),
    create: adminProcedure
      .input(z.object({ title: z.string().min(1), slug: z.string().min(1), content: z.string().optional(), excerpt: z.string().optional(), category: z.string().optional(), metaTitle: z.string().optional(), metaDescription: z.string().optional(), ogImage: z.string().optional(), status: z.enum(['draft', 'published', 'archived']).optional() }))
      .mutation(({ ctx, input }) => {
        const readTime = db.calculateReadTime(input.content);
        return db.createArticle({ ...input, readTime, authorId: ctx.user.id, status: input.status ?? 'draft' });
      }),
    update: adminProcedure
      .input(z.object({ id: z.number(), title: z.string().optional(), slug: z.string().optional(), content: z.string().optional(), excerpt: z.string().optional(), category: z.string().optional(), metaTitle: z.string().optional(), metaDescription: z.string().optional(), ogImage: z.string().optional(), status: z.enum(['draft', 'published', 'archived']).optional(), publishedAt: z.date().optional() }))
      .mutation(({ input }) => {
        const { id, content, ...rest } = input;
        const updateData: Partial<InsertArticle> = { ...rest };
        if (content !== undefined) { updateData.content = content; updateData.readTime = db.calculateReadTime(content); }
        return db.updateArticle(id, updateData);
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteArticle(input.id)),
  }),

  media: router({
    list: publicProcedure.input(z.object({ limit: z.number().default(20) }).optional()).query(({ input }) => db.getMedia(input?.limit)),
    upload: protectedProcedure
      .input(z.object({ filename: z.string(), url: z.string(), fileKey: z.string(), mimeType: z.string().optional(), size: z.number().optional() }))
      .mutation(({ ctx, input }) => db.createMedia({ ...input, uploadedBy: ctx.user.id })),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteMedia(input.id)),
  }),

  destinations: router({
    list: publicProcedure.input(z.object({ limit: z.number().default(10) }).optional()).query(({ input }) => db.getDestinations(input?.limit)),
    listPublished: publicProcedure.input(z.object({ limit: z.number().default(10) }).optional()).query(({ input }) => db.getPublishedDestinations(input?.limit)),
    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => db.getDestinationBySlug(input.slug)),
    getPublishedBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => db.getPublishedDestinationBySlug(input.slug)),
    create: adminProcedure
      .input(z.object({ name: z.string().min(1), slug: z.string().min(1), description: z.string().optional(), country: z.string().optional(), latitude: z.string().optional(), longitude: z.string().optional(), image: z.string().optional(), metaTitle: z.string().optional(), metaDescription: z.string().optional(), ogImage: z.string().optional(), status: z.enum(['draft', 'published', 'archived']).optional() }))
      .mutation(({ ctx, input }) => db.createDestination({ ...input, authorId: ctx.user.id, status: input.status ?? 'draft' })),
    update: adminProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), slug: z.string().optional(), description: z.string().optional(), country: z.string().optional(), latitude: z.string().optional(), longitude: z.string().optional(), image: z.string().optional(), metaTitle: z.string().optional(), metaDescription: z.string().optional(), ogImage: z.string().optional(), status: z.enum(['draft', 'published', 'archived']).optional(), publishedAt: z.date().optional() }))
      .mutation(({ input }) => { const { id, ...data } = input; return db.updateDestination(id, data); }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteDestination(input.id)),
  }),

  travelPlanning: router({
    list: adminProcedure
      .input(z.object({ limit: z.number().default(50) }).optional())
      .query(({ input }) => db.getTravelRequests(input?.limit ?? 50)),
    create: publicProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        destination: z.string().optional(),
        departureDate: z.string().optional(),
        returnDate: z.string().optional(),
        duration: z.string().optional(),
        travelers: z.string().optional(),
        travelType: z.string().optional(),
        budget: z.string().optional(),
        message: z.string().optional(),
        howDidYouFind: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // 1. Sauvegarder en base
        const result = await db.createTravelRequest({ ...input, status: 'new' });
        // 2. Envoyer les emails Resend (non bloquant en cas d'erreur)
        sendTravelRequestEmails(input).catch(err =>
          console.error("[Email] Erreur envoi emails Travel Planning:", err)
        );
        return result;
      }),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(['new', 'contacted', 'in_progress', 'closed']) }))
      .mutation(({ input }) => db.updateTravelRequestStatus(input.id, input.status)),
    addNotes: adminProcedure
      .input(z.object({ id: z.number(), notes: z.string() }))
      .mutation(({ input }) => db.updateTravelRequest(input.id, { notes: input.notes })),
  }),
});

export type AppRouter = typeof appRouter;
