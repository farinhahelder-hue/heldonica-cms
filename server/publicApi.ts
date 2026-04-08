/**
 * API publique REST — consommable par heldonica.fr (Next.js, Astro…)
 * Toutes les routes sont en lecture seule et ne retournent que du contenu publié.
 *
 * GET /api/public/articles          ?limit=10&category=slow-travel&tag=portugal
 * GET /api/public/articles/:slug
 * GET /api/public/pages             ?limit=10
 * GET /api/public/pages/:slug
 * GET /api/public/destinations      ?limit=10&country=Portugal
 * GET /api/public/destinations/:slug
 * GET /api/public/sitemap.xml       — Sitemap XML dynamique
 * GET /api/public/rss.xml           — Flux RSS articles
 * GET /api/public/travel-requests   (admin only — secured by x-api-key header)
 */
import { Router, Request, Response } from "express";
import * as db from "./db";

const router = Router();
const SITE_URL = process.env.SITE_URL || "https://heldonica.fr";
const SITE_NAME = "Heldonica — Slow Travel en couple";

// CORS — autorise heldonica.fr + localhost en dev
router.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
  next();
});

router.options("*", (_req, res) => res.sendStatus(204));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeXml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function buildJsonLdArticle(article: any): object {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.metaDescription || article.excerpt || "",
    image: article.ogImage ? [article.ogImage] : [],
    datePublished: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
    dateModified: article.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
    author: {
      "@type": "Person",
      name: "Heldonica",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${article.slug}`,
    },
    keywords: Array.isArray(article.tags)
      ? article.tags.join(", ")
      : article.tags || "",
    articleSection: article.category || "",
    wordCount: article.content ? stripHtml(article.content).split(/\s+/).filter(Boolean).length : 0,
  };
}

function buildJsonLdDestination(dest: any): object {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: dest.name || dest.title,
    description: dest.excerpt || dest.metaDescription || "",
    image: dest.ogImage ? [dest.ogImage] : [],
    url: `${SITE_URL}/destinations/${dest.slug}`,
    touristType: [
      { "@type": "Audience", audienceType: "Couple" },
      { "@type": "Audience", audienceType: "Slow Traveler" },
    ],
  };
}

// ─── Articles ─────────────────────────────────────────────────────────────────

router.get("/articles", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 10, 100);
  const category = req.query.category as string | undefined;
  const tag = req.query.tag as string | undefined;
  let data = await db.getPublishedArticles(limit);
  if (category) data = data.filter(a => a.category === category);
  if (tag) {
    data = data.filter(a => {
      const tags = Array.isArray(a.tags) ? a.tags : (a.tags ? String(a.tags).split(",").map(t => t.trim()) : []);
      return tags.includes(tag);
    });
  }
  const enriched = data.map(a => ({ ...a, jsonLd: buildJsonLdArticle(a) }));
  res.json({ data: enriched, count: enriched.length });
});

router.get("/articles/:slug", async (req: Request, res: Response) => {
  const article = await db.getPublishedArticleBySlug(req.params.slug);
  if (!article) return res.status(404).json({ error: "Not found" });
  res.json({ data: { ...article, jsonLd: buildJsonLdArticle(article) } });
});

// ─── Pages ────────────────────────────────────────────────────────────────────

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

// ─── Destinations ─────────────────────────────────────────────────────────────

router.get("/destinations", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 10, 100);
  const country = req.query.country as string | undefined;
  let data = await db.getPublishedDestinations(limit);
  if (country) data = data.filter(d => d.country?.toLowerCase() === country.toLowerCase());
  const enriched = data.map(d => ({ ...d, jsonLd: buildJsonLdDestination(d) }));
  res.json({ data: enriched, count: enriched.length });
});

router.get("/destinations/:slug", async (req: Request, res: Response) => {
  const dest = await db.getPublishedDestinationBySlug(req.params.slug);
  if (!dest) return res.status(404).json({ error: "Not found" });
  res.json({ data: { ...dest, jsonLd: buildJsonLdDestination(dest) } });
});

// ─── Sitemap XML ──────────────────────────────────────────────────────────────

router.get("/sitemap.xml", async (_req: Request, res: Response) => {
  try {
    const [articlesList, destinationsList, pagesList] = await Promise.all([
      db.getPublishedArticles(1000),
      db.getPublishedDestinations(1000),
      db.getPublishedPages(1000),
    ]);

    const staticUrls = [
      { loc: SITE_URL, priority: "1.0", changefreq: "weekly" },
      { loc: `${SITE_URL}/blog`, priority: "0.9", changefreq: "daily" },
      { loc: `${SITE_URL}/destinations`, priority: "0.8", changefreq: "weekly" },
      { loc: `${SITE_URL}/travel-planning`, priority: "0.8", changefreq: "monthly" },
      { loc: `${SITE_URL}/a-propos`, priority: "0.6", changefreq: "monthly" },
      { loc: `${SITE_URL}/contact`, priority: "0.5", changefreq: "yearly" },
    ];

    const articleUrls = articlesList.map(a => ({
      loc: `${SITE_URL}/blog/${a.slug}`,
      lastmod: a.updatedAt ? new Date(a.updatedAt).toISOString().split("T")[0] : undefined,
      priority: "0.8",
      changefreq: "monthly",
    }));

    const destUrls = destinationsList.map(d => ({
      loc: `${SITE_URL}/destinations/${d.slug}`,
      lastmod: d.updatedAt ? new Date(d.updatedAt).toISOString().split("T")[0] : undefined,
      priority: "0.7",
      changefreq: "monthly",
    }));

    const pageUrls = pagesList.map(p => ({
      loc: `${SITE_URL}/${p.slug}`,
      lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split("T")[0] : undefined,
      priority: "0.6",
      changefreq: "monthly",
    }));

    const allUrls = [...staticUrls, ...articleUrls, ...destUrls, ...pageUrls];

    const xml = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...allUrls.map(u => [
        `  <url>`,
        `    <loc>${escapeXml(u.loc)}</loc>`,
        u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : "",
        `    <changefreq>${u.changefreq}</changefreq>`,
        `    <priority>${u.priority}</priority>`,
        `  </url>`,
      ].filter(Boolean).join("\n")),
      `</urlset>`,
    ].join("\n");

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    console.error("[sitemap] error", err);
    res.status(500).send("Internal Server Error");
  }
});

// ─── RSS Feed ─────────────────────────────────────────────────────────────────

router.get("/rss.xml", async (_req: Request, res: Response) => {
  try {
    const articlesList = await db.getPublishedArticles(50);

    const items = articlesList.map(a => {
      const excerpt = escapeXml(a.metaDescription || a.excerpt || stripHtml(a.content).slice(0, 160));
      const pubDate = a.publishedAt ? new Date(a.publishedAt).toUTCString() : new Date().toUTCString();
      const link = `${SITE_URL}/blog/${a.slug}`;
      const tags = Array.isArray(a.tags) ? a.tags : (a.tags ? String(a.tags).split(",").map(t => t.trim()) : []);
      return [
        `    <item>`,
        `      <title>${escapeXml(a.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <description>${excerpt}</description>`,
        `      <pubDate>${pubDate}</pubDate>`,
        a.category ? `      <category>${escapeXml(a.category)}</category>` : "",
        ...tags.map(t => `      <category>${escapeXml(t)}</category>`),
        a.ogImage ? `      <enclosure url="${escapeXml(a.ogImage)}" type="image/jpeg" length="0" />` : "",
        `    </item>`,
      ].filter(Boolean).join("\n");
    });

    const rss = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">`,
      `  <channel>`,
      `    <title>${escapeXml(SITE_NAME)}</title>`,
      `    <link>${SITE_URL}</link>`,
      `    <description>Blog Slow Travel en couple — pépites dénichées, carnets de voyage et conseils hôteliers par Heldonica.</description>`,
      `    <language>fr</language>`,
      `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `    <atom:link href="${SITE_URL}/api/public/rss.xml" rel="self" type="application/rss+xml" />`,
      `    <image>`,
      `      <url>${SITE_URL}/logo.png</url>`,
      `      <title>${escapeXml(SITE_NAME)}</title>`,
      `      <link>${SITE_URL}</link>`,
      `    </image>`,
      ...items,
      `  </channel>`,
      `</rss>`,
    ].join("\n");

    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=1800");
    res.send(rss);
  } catch (err) {
    console.error("[rss] error", err);
    res.status(500).send("Internal Server Error");
  }
});

// ─── Travel requests (admin) ───────────────────────────────────────────────────

router.get("/travel-requests", async (req: Request, res: Response) => {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.PUBLIC_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const data = await db.getTravelRequests(100);
  res.json({ data, count: data.length });
});

export default router;
