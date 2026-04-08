import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  FileText, Image, Globe, Inbox, TrendingUp, Eye, EyeOff,
  Plus, ArrowRight, Clock, CalendarDays, Compass, PenLine,
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Article } from "../../../drizzle/schema";

/** Score SEO rapide pour le dashboard */
function seoScore(article: Article): number {
  let s = 0;
  if (article.title && article.title.length >= 30 && article.title.length <= 65) s += 20;
  else if (article.title) s += 10;
  if (article.metaDescription && article.metaDescription.length >= 120 && article.metaDescription.length <= 160) s += 20;
  else if (article.metaDescription) s += 10;
  if (article.featuredImage) s += 15;
  if (article.tags && Array.isArray(article.tags) && (article.tags as string[]).length >= 2) s += 15;
  if (article.category) s += 10;
  if (article.slug) s += 10;
  if (article.content && article.content.length > 500) s += 10;
  return Math.min(s, 100);
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: allArticles } = trpc.articles.list.useQuery({ limit: 200 });
  const { data: allPages } = trpc.pages.list.useQuery({ limit: 200 });
  const { data: allMedia } = trpc.media.list.useQuery({ limit: 200 });
  const { data: allRequests } = trpc.travelPlanning.list.useQuery({ limit: 200 });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return <DashboardLayout><div className="p-8">Non authentifié</div></DashboardLayout>;

  // KPIs articles
  const published = (allArticles ?? []).filter((a: Article) => a.status === "published");
  const drafts = (allArticles ?? []).filter((a: Article) => a.status !== "published");
  const avgSeo = allArticles && allArticles.length > 0
    ? Math.round(allArticles.reduce((acc: number, a: Article) => acc + seoScore(a), 0) / allArticles.length)
    : 0;

  // Travel planning
  const pendingRequests = (allRequests ?? []).filter((r: { status?: string }) => r.status === "pending" || !r.status);

  // Activité récente (5 derniers articles modifiés)
  const recentArticles = [...(allArticles ?? [])]
    .sort((a: Article, b: Article) =>
      new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime()
    )
    .slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const firstName = user.name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "";

  const seoColor = avgSeo >= 70 ? "text-green-600" : avgSeo >= 40 ? "text-orange-500" : "text-red-500";

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{greeting}, {firstName} 🌍</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
            </p>
          </div>
          <Button onClick={() => navigate("/articles/new")} size="sm">
            <Plus className="h-4 w-4 mr-2" />Nouvel article
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Eye className="h-4 w-4 text-green-600" />}
            label="Publiés"
            value={published.length}
            sub="articles en ligne"
            onClick={() => navigate("/articles")}
          />
          <KpiCard
            icon={<EyeOff className="h-4 w-4 text-orange-500" />}
            label="Brouillons"
            value={drafts.length}
            sub="articles en cours"
            onClick={() => navigate("/articles")}
          />
          <KpiCard
            icon={<TrendingUp className={`h-4 w-4 ${seoColor}`} />}
            label="Score SEO moyen"
            value={`${avgSeo}/100`}
            sub={avgSeo >= 70 ? "Bon niveau" : avgSeo >= 40 ? "À améliorer" : "Insuffisant"}
            valueClass={seoColor}
          />
          <KpiCard
            icon={<Inbox className="h-4 w-4 text-blue-500" />}
            label="Travel Planning"
            value={pendingRequests.length}
            sub="demandes en attente"
            onClick={() => navigate("/travel-planning")}
            highlight={pendingRequests.length > 0}
          />
        </div>

        {/* Ligne 2 : médias + pages */}
        <div className="grid grid-cols-2 gap-4">
          <KpiCard
            icon={<Image className="h-4 w-4 text-muted-foreground" />}
            label="Médias"
            value={allMedia?.length ?? 0}
            sub="fichiers uploadés"
            onClick={() => navigate("/media")}
          />
          <KpiCard
            icon={<Globe className="h-4 w-4 text-muted-foreground" />}
            label="Pages"
            value={allPages?.length ?? 0}
            sub="pages statiques"
            onClick={() => navigate("/pages")}
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: <PenLine className="h-4 w-4" />, label: "Rédiger", sub: "Nouvel article", path: "/articles/new" },
              { icon: <Compass className="h-4 w-4" />, label: "Destinations", sub: "Gérer", path: "/destinations" },
              { icon: <Image className="h-4 w-4" />, label: "Médiathèque", sub: "Ajouter médias", path: "/media" },
              { icon: <Inbox className="h-4 w-4" />, label: "Demandes", sub: "Travel Planning", path: "/travel-planning" },
            ].map(({ icon, label, sub, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex flex-col items-start gap-1 p-3 rounded-lg border hover:bg-muted/60 transition-colors text-left"
              >
                <div className="text-muted-foreground">{icon}</div>
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{sub}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Activité récente */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Activité récente</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/articles")}>
              Voir tout <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {recentArticles.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Aucun article encore</p>
                <Button size="sm" className="mt-3" onClick={() => navigate("/articles/new")}>
                  <Plus className="h-4 w-4 mr-2" />Créer le premier
                </Button>
              </div>
            ) : (
              recentArticles.map((article: Article) => {
                const isPublished = article.status === "published";
                const dateLabel = article.updatedAt ?? article.createdAt;
                const score = seoScore(article);
                const scoreColor = score >= 70 ? "text-green-600" : score >= 40 ? "text-orange-500" : "text-red-500";
                return (
                  <div
                    key={article.id}
                    onClick={() => navigate(`/articles/edit/${article.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{article.title}</p>
                        <Badge variant={isPublished ? "default" : "outline"} className="text-xs shrink-0">
                          {isPublished ? "Publié" : "Brouillon"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {article.category && (
                          <span className="text-xs text-muted-foreground">{article.category}</span>
                        )}
                        {article.readTime && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />{article.readTime} min
                          </span>
                        )}
                        {dateLabel && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <CalendarDays className="h-2.5 w-2.5" />
                            {format(new Date(dateLabel), "d MMM", { locale: fr })}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold shrink-0 ml-2 ${scoreColor}`}>
                      SEO {score}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}

function KpiCard({
  icon, label, value, sub, onClick, highlight = false, valueClass = ""
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  onClick?: () => void;
  highlight?: boolean;
  valueClass?: string;
}) {
  return (
    <Card
      className={`transition-shadow ${
        onClick ? "cursor-pointer hover:shadow-md" : ""
      } ${highlight ? "border-blue-400 ring-1 ring-blue-200" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold tabular-nums ${valueClass}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}
