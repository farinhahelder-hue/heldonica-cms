import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Edit, Search, Eye, EyeOff, Clock, Tag } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ArticlesManager() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: articles, refetch } = trpc.articles.list.useQuery({ limit: 200 });

  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => {
      toast.success("Article supprimé");
      refetch();
      setDeleteId(null);
    },
    onError: (error: any) => toast.error(error.message || "Erreur lors de la suppression"),
  });

  const isAdmin = user?.role === "admin";

  const filtered = (articles || []).filter((a: any) =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase())
  );

  const published = filtered.filter((a: any) => a.status === "published");
  const drafts = filtered.filter((a: any) => a.status === "draft");

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Articles</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {articles?.length || 0} article{(articles?.length || 0) > 1 ? "s" : ""} au total
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => navigate("/articles/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel article
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: articles?.length || 0, color: "" },
            { label: "Publiés", value: (articles || []).filter((a: any) => a.status === "published").length, color: "text-green-600" },
            { label: "Brouillons", value: (articles || []).filter((a: any) => a.status === "draft").length, color: "text-orange-500" },
            { label: "Archivés", value: (articles || []).filter((a: any) => a.status === "archived").length, color: "text-muted-foreground" },
          ].map(stat => (
            <Card key={stat.label} className="p-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par titre ou catégorie..."
            className="pl-9"
          />
        </div>

        {/* Published */}
        {published.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-600" />
                Publiés ({published.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {published.map((article: any) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  isAdmin={isAdmin}
                  onEdit={() => navigate(`/articles/edit/${article.id}`)}
                  onDelete={() => setDeleteId(article.id)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Drafts */}
        {drafts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-orange-500" />
                Brouillons ({drafts.length})
              </CardTitle>
              <CardDescription className="text-xs">Non visibles sur le site public</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {drafts.map((article: any) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  isAdmin={isAdmin}
                  onEdit={() => navigate(`/articles/edit/${article.id}`)}
                  onDelete={() => setDeleteId(article.id)}
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
              {search ? `Aucun résultat pour "${search}"` : "Crée ton premier article Heldonica !"}
            </p>
            {!search && isAdmin && (
              <Button className="mt-4" onClick={() => navigate("/articles/new")}>
                <Plus className="h-4 w-4 mr-2" /> Créer un article
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete confirm dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet article ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'article sera définitivement supprimé.
            </AlertDialogDescription>
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

function ArticleRow({ article, isAdmin, onEdit, onDelete }: {
  article: any;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate">{article.title}</h3>
        </div>
        <div className="flex items-center gap-3 mt-1">
          {article.category && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" />{article.category}
            </span>
          )}
          {article.readTime && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />{article.readTime} min
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {article.slug}
          </span>
        </div>
      </div>
      {isAdmin && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
