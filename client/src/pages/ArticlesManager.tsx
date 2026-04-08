import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Plus, Trash2, Edit, Search, Eye, EyeOff, Clock, CalendarDays,
  ArrowUpDown, LayoutGrid, List, Copy, FileText, TrendingUp,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Article } from "../../../drizzle/schema";

type SortOrder = "newest" | "oldest" | "alpha";
type StatusFilter = "all" | "published" | "draft";
type ViewMode = "list" | "grid";

/** Score SEO simplifié basé sur les métadonnées disponibles */
function computeSeoScore(article: Article): number {
  let score = 0;
  if (article.title && article.title.length >= 30 && article.title.length <= 65) score += 20;
  else if (article.title && article.title.length > 0) score += 10;
  if (article.metaDescription && article.metaDescription.length >= 120 && article.metaDescription.length <= 160) score += 20;
  else if (article.metaDescription && article.metaDescription.length > 0) score += 10;
  if (article.featuredImage) score += 15;
  if (article.tags && Array.isArray(article.tags) && (article.tags as string[]).length >= 2) score += 15;
  if (article.category) score += 10;
  if (article.slug && article.slug.length > 0) score += 10;
  if (article.content && article.content.length > 500) score += 10;
  return Math.min(score, 100);
}

function SeoScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "text-green-600 bg-green-50 border-green-200"
    : score >= 40 ? "text-orange-500 bg-orange-50 border-orange-200"
    : "text-red-500 bg-red-50 border-red-200";
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded border ${color}`}>
      <TrendingUp className="h-2.5 w-2.5" />{score}
    </span>
  );
}

export default function ArticlesManager() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: articles, refetch } = trpc.articles.list.useQuery({ limit: 200 });

  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => { toast.success("Article supprimé"); refetch(); setDeleteId(null); },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    },
  });

  const updateStatusMutation = trpc.articles.update.useMutation({
    onSuccess: () => { toast.success("Statut mis à jour"); refetch(); },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour");
    },
  });

  const duplicateMutation = trpc.articles.create.useMutation({
    onSuccess: (newArticle: Article) => {
      toast.success("Article dupliqué");
      refetch();
      navigate(`/articles/edit/${newArticle.id}`);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la duplication");
    },
  });

  const isAdmin = user?.role === "admin";

  const categories = useMemo(() => {
    const cats = (articles ?? []).map((a: Article) => a.category).filter(Boolean) as string[];
    return Array.from(new Set(cats)).sort();
  }, [articles]);

  const filtered = useMemo(() => {
    let list = (articles ?? []).filter((a: Article) => {
      const matchSearch =
        (a.title?.toLowerCase().includes(search.toLowerCase()) ||
        a.slug?.toLowerCase().includes(search.toLowerCase()) ||
        (a.category ?? "").toLowerCase().includes(search.toLowerCase()));
      const matchCat = categoryFilter === "all" || a.category === categoryFilter;
      const matchStatus = statusFilter === "all" ||
        (statusFilter === "published" ? a.status === "published" : a.status !== "published");
      return matchSearch && matchCat && matchStatus;
    });
    if (sortOrder === "newest") list = [...list].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    else if (sortOrder === "oldest") list = [...list].sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
    else if (sortOrder === "alpha") list = [...list].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? "", "fr"));
    return list;
  }, [articles, search, categoryFilter, statusFilter, sortOrder]);

  const totalPublished = (articles ?? []).filter((a: Article) => a.status === "published").length;
  const totalDrafts = (articles ?? []).filter((a: Article) => a.status !== "published").length;

  const toggleStatus = (article: Article) => {
    updateStatusMutation.mutate({ id: article.id, status: article.status === "published" ? "draft" : "published" });
  };

  const duplicateArticle = (article: Article) => {
    duplicateMutation.mutate({
      title: `${article.title} (copie)`,
      slug: `${article.slug}-copie-${Date.now()}`,
      content: article.content ?? "",
      status: "draft",
      category: article.category ?? undefined,
      metaDescription: article.metaDescription ?? undefined,
      featuredImage: article.featuredImage ?? undefined,
      tags: (article.tags as string[]) ?? [],
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Articles</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {totalPublished} publié{totalPublished > 1 ? "s" : ""} · {totalDrafts} brouillon{totalDrafts > 1 ? "s" : ""}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => navigate("/articles/new")}>
              <Plus className="h-4 w-4 mr-2" />Nouvel article
            </Button>
          )}
        </div>

        {/* KPI chips */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Tous", value: "all", count: articles?.length ?? 0 },
            { label: "Publiés", value: "published", count: totalPublished },
            { label: "Brouillons", value: "draft", count: totalDrafts },
          ].map(({ label, value, count }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value as StatusFilter)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              {label} <span className="ml-1 opacity-70">{count}</span>
            </button>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par titre, slug ou catégorie..."
              className="pl-9"
            />
          </div>
          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={sortOrder} onValueChange={v => setSortOrder(v as SortOrder)}>
            <SelectTrigger className="w-full sm:w-40">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Plus récents</SelectItem>
              <SelectItem value="oldest">Plus anciens</SelectItem>
              <SelectItem value="alpha">Alphabétique</SelectItem>
            </SelectContent>
          </Select>
          {/* Toggle vue */}
          <div className="flex border rounded-md overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              title="Vue liste"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              title="Vue grille"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Résultats */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-medium">Aucun article trouvé</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {search || categoryFilter !== "all" || statusFilter !== "all"
                ? "Aucun résultat pour ces filtres"
                : "Écris ton premier article !"}
            </p>
            {!search && categoryFilter === "all" && statusFilter === "all" && isAdmin && (
              <Button className="mt-4" onClick={() => navigate("/articles/new")}>
                <Plus className="h-4 w-4 mr-2" />Créer un article
              </Button>
            )}
          </div>
        ) : viewMode === "list" ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {filtered.map((article: Article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  isAdmin={isAdmin}
                  onEdit={() => navigate(`/articles/edit/${article.id}`)}
                  onDelete={() => setDeleteId(article.id)}
                  onToggleStatus={() => toggleStatus(article)}
                  onDuplicate={() => duplicateArticle(article)}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((article: Article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isAdmin={isAdmin}
                onEdit={() => navigate(`/articles/edit/${article.id}`)}
                onDelete={() => setDeleteId(article.id)}
                onToggleStatus={() => toggleStatus(article)}
                onDuplicate={() => duplicateArticle(article)}
                isUpdating={updateStatusMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet article ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

/* ─── Vue liste ─── */
function ArticleRow({ article, isAdmin, onEdit, onDelete, onToggleStatus, onDuplicate, isUpdating }: {
  article: Article; isAdmin: boolean;
  onEdit: () => void; onDelete: () => void; onToggleStatus: () => void; onDuplicate: () => void;
  isUpdating: boolean;
}) {
  const isPublished = article.status === "published";
  const dateLabel = article.publishedAt ?? article.createdAt;
  const seoScore = computeSeoScore(article);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium text-sm truncate">{article.title}</h3>
          <Badge variant={isPublished ? "default" : "outline"} className="text-xs shrink-0">
            {isPublished ? "Publié" : "Brouillon"}
          </Badge>
          {article.category && (
            <Badge variant="outline" className="text-xs shrink-0">{article.category}</Badge>
          )}
          <SeoScoreBadge score={seoScore} />
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <p className="text-xs text-muted-foreground truncate">/{article.slug}</p>
          {article.readTime && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5 shrink-0">
              <Clock className="h-2.5 w-2.5" />{article.readTime} min
            </span>
          )}
          {dateLabel && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5 shrink-0">
              <CalendarDays className="h-2.5 w-2.5" />
              {format(new Date(dateLabel), "d MMM yyyy", { locale: fr })}
            </span>
          )}
        </div>
      </div>
      {isAdmin && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost" size="sm"
            className={`h-7 w-7 p-0 ${isPublished ? "text-green-600 hover:text-orange-500" : "text-orange-500 hover:text-green-600"}`}
            onClick={onToggleStatus} disabled={isUpdating}
            title={isPublished ? "Dépublier" : "Publier"}
          >
            {isPublished ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onDuplicate} title="Dupliquer">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Vue grille ─── */
function ArticleCard({ article, isAdmin, onEdit, onDelete, onToggleStatus, onDuplicate, isUpdating }: {
  article: Article; isAdmin: boolean;
  onEdit: () => void; onDelete: () => void; onToggleStatus: () => void; onDuplicate: () => void;
  isUpdating: boolean;
}) {
  const isPublished = article.status === "published";
  const dateLabel = article.publishedAt ?? article.createdAt;
  const seoScore = computeSeoScore(article);

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow group">
      {/* Image */}
      <div className="aspect-video bg-muted relative overflow-hidden">
        {article.featuredImage ? (
          <img src={article.featuredImage} alt={article.title ?? ""} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant={isPublished ? "default" : "outline"} className="text-xs bg-background/90">
            {isPublished ? "Publié" : "Brouillon"}
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          <SeoScoreBadge score={seoScore} />
        </div>
      </div>

      <CardContent className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">{article.title}</h3>
          {article.metaDescription && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.metaDescription}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-auto">
          {article.category && (
            <Badge variant="outline" className="text-xs">{article.category}</Badge>
          )}
          {article.readTime && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />{article.readTime} min
            </span>
          )}
          {dateLabel && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5 ml-auto">
              <CalendarDays className="h-2.5 w-2.5" />
              {format(new Date(dateLabel), "d MMM yyyy", { locale: fr })}
            </span>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-1 pt-2 border-t">
            <Button
              variant="ghost" size="sm"
              className={`h-7 w-7 p-0 ${isPublished ? "text-green-600 hover:text-orange-500" : "text-orange-500 hover:text-green-600"}`}
              onClick={onToggleStatus} disabled={isUpdating}
              title={isPublished ? "Dépublier" : "Publier"}
            >
              {isPublished ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onDuplicate} title="Dupliquer">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 ml-auto" onClick={onEdit}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
