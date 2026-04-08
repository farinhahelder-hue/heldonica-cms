import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Edit, Search, Eye, EyeOff, Clock, CalendarDays, ArrowUpDown } from "lucide-react";
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

export default function ArticlesManager() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: articles, refetch } = trpc.articles.list.useQuery({ limit: 200 });

  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => { toast.success("Article supprimé"); refetch(); setDeleteId(null); },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Erreur lors de la suppression";
      toast.error(msg);
    },
  });

  const updateStatusMutation = trpc.articles.update.useMutation({
    onSuccess: () => { toast.success("Statut mis à jour"); refetch(); },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Erreur lors de la mise à jour";
      toast.error(msg);
    },
  });

  const isAdmin = user?.role === "admin";

  // Liste des catégories uniques
  const categories = useMemo(() => {
    const cats = (articles ?? []).map((a: Article) => a.category).filter(Boolean) as string[];
    return Array.from(new Set(cats)).sort();
  }, [articles]);

  // Filtrage
  const filtered = useMemo(() => {
    let list = (articles ?? []).filter((a: Article) =>
      (a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.slug?.toLowerCase().includes(search.toLowerCase()) ||
      (a.category ?? "").toLowerCase().includes(search.toLowerCase())) &&
      (categoryFilter === "all" || a.category === categoryFilter)
    );
    // Tri
    if (sortOrder === "newest") {
      list = [...list].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    } else if (sortOrder === "oldest") {
      list = [...list].sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
    } else if (sortOrder === "alpha") {
      list = [...list].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? "", "fr"));
    }
    return list;
  }, [articles, search, categoryFilter, sortOrder]);

  const published = filtered.filter((a: Article) => a.status === "published");
  const drafts = filtered.filter((a: Article) => a.status !== "published");

  const toggleStatus = (article: Article) => {
    const newStatus = article.status === "published" ? "draft" : "published";
    updateStatusMutation.mutate({ id: article.id, status: newStatus });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Articles</h1>
            <p className="text-muted-foreground text-sm mt-1">{articles?.length ?? 0} article{(articles?.length ?? 0) > 1 ? "s" : ""}</p>
          </div>
          {isAdmin && (
            <Button onClick={() => navigate("/articles/new")}>
              <Plus className="h-4 w-4 mr-2" />Nouvel article
            </Button>
          )}
        </div>

        {/* Barre de filtres */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
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
        </div>

        {published.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-600" />Publiés ({published.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {published.map((article: Article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  isAdmin={isAdmin}
                  onEdit={() => navigate(`/articles/edit/${article.id}`)}
                  onDelete={() => setDeleteId(article.id)}
                  onToggleStatus={() => toggleStatus(article)}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {drafts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-orange-500" />Brouillons ({drafts.length})
              </CardTitle>
              <CardDescription className="text-xs">Non visibles sur le site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {drafts.map((article: Article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  isAdmin={isAdmin}
                  onEdit={() => navigate(`/articles/edit/${article.id}`)}
                  onDelete={() => setDeleteId(article.id)}
                  onToggleStatus={() => toggleStatus(article)}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-medium">Aucun article trouvé</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {search || categoryFilter !== "all" ? "Aucun résultat pour ces filtres" : "Écris ton premier article !"}
            </p>
            {!search && categoryFilter === "all" && isAdmin && (
              <Button className="mt-4" onClick={() => navigate("/articles/new")}>
                <Plus className="h-4 w-4 mr-2" />Créer un article
              </Button>
            )}
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

function ArticleRow({ article, isAdmin, onEdit, onDelete, onToggleStatus, isUpdating }: {
  article: Article;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  isUpdating: boolean;
}) {
  const isPublished = article.status === "published";
  const dateLabel = article.publishedAt ?? article.createdAt;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate">{article.title}</h3>
          {article.category && (
            <Badge variant="outline" className="text-xs shrink-0">{article.category}</Badge>
          )}
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
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${ isPublished ? "text-green-600 hover:text-orange-500" : "text-orange-500 hover:text-green-600" }`}
            onClick={onToggleStatus}
            disabled={isUpdating}
            title={isPublished ? "Dépublier" : "Publier"}
          >
            {isPublished ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
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
