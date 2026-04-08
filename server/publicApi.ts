/**
 * API publique REST — consommable par heldonica.fr (Next.js, Astro…)
 * Toutes les routes sont en lecture seule et ne retournent que du contenu publié.
 *
 * GET /api/public/articles          ?limit=10&category=slow-travel
 * GET /api/public/articles/:slug
 * GET /api/public/pages             ?limit=10
 * GET /api/public/pages/:slug
 * GET /api/public/destinations      ?limit=10&country=Portugal
 * GET /api/public/destinations/:slug
 * GET /api/public/travel-requests   (admin only — secured by x-api-key header)
 */
import { Router, Request, Response } from "express";
import * as db from "./db";

const router = Router();

// CORS — autorise heldonica.fr + localhost en dev
router.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
  next();
});

router.options("*", (_req, res) => res.sendStatus(204));

// --- Articles ---
router.get("/articles", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 10, 100);
  const category = req.query.category as string | undefined;
  let data = await db.getPublishedArticles(limit);
  if (category) data = data.filter(a => a.category === category);
  res.json({ data, count: data.length });
});

router.get("/articles/:slug", async (req: Request, res: Response) => {
  const article = await db.getPublishedArticleBySlug(req.params.slug);
  if (!article) return res.status(404).json({ error: "Not found" });
  res.json({ data: article });
});

// --- Pages ---
router.get("/pages", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 10, 100);
  const data = await db.getPublishedPages(limit);
  res.json({ data, count: data.length });
});

router.get("/pages/:slug", async (req: Request, res: Response) => {
  const page = await db.getPublishedPageBySlug(req.params.slug);
  if (!page) return res.status(404).json({ error: "Not found" });
  res.json({ data: page });
});

// --- Destinations ---
router.get("/destinations", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 10, 100);
  const country = req.query.country as string | undefined;
  let data = await db.getPublishedDestinations(limit);
  if (country) data = data.filter(d => d.country?.toLowerCase() === country.toLowerCase());
  res.json({ data, count: data.length });
});

router.get("/destinations/:slug", async (req: Request, res: Response) => {
  const dest = await db.getPublishedDestinationBySlug(req.params.slug);
  if (!dest) return res.status(404).json({ error: "Not found" });
  res.json({ data: dest });
});

// --- Travel requests (admin) ---
router.get("/travel-requests", async (req: Request, res: Response) => {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.PUBLIC_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const data = await db.getTravelRequests(100);
  res.json({ data, count: data.length });
});

export default router;
