import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Edit, Search, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PagesManager() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: pages, refetch } = trpc.pages.list.useQuery({ limit: 200 });

  const deleteMutation = trpc.pages.delete.useMutation({
    onSuccess: () => { toast.success("Page supprimée"); refetch(); setDeleteId(null); },
    onError: (error: any) => toast.error(error.message || "Erreur lors de la suppression"),
  });

  const isAdmin = user?.role === "admin";
  const filtered = (pages || []).filter((p: any) =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.slug?.toLowerCase().includes(search.toLowerCase())
  );
  const published = filtered.filter((p: any) => p.status === "published");
  const drafts = filtered.filter((p: any) => p.status !== "published");

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pages</h1>
            <p className="text-muted-foreground text-sm mt-1">{pages?.length || 0} page{(pages?.length || 0) > 1 ? "s" : ""}</p>
          </div>
          {isAdmin && (
            <Button onClick={() => navigate("/pages/new")}>
              <Plus className="h-4 w-4 mr-2" />Nouvelle page
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9" />
        </div>

        {published.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4 text-green-600" />Publiées ({published.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {published.map((page: any) => (
                <PageRow key={page.id} page={page} isAdmin={isAdmin}
                  onEdit={() => navigate(`/pages/edit/${page.id}`)}
                  onDelete={() => setDeleteId(page.id)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {drafts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><EyeOff className="h-4 w-4 text-orange-500" />Brouillons ({drafts.length})</CardTitle>
              <CardDescription className="text-xs">Non visibles sur le site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {drafts.map((page: any) => (
                <PageRow key={page.id} page={page} isAdmin={isAdmin}
                  onEdit={() => navigate(`/pages/edit/${page.id}`)}
                  onDelete={() => setDeleteId(page.id)}
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
            <h3 className="font-medium">Aucune page trouvée</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {search ? `Aucun résultat pour "${search}"` : "Crée ta première page !"}
            </p>
            {!search && isAdmin && (
              <Button className="mt-4" onClick={() => navigate("/pages/new")}>
                <Plus className="h-4 w-4 mr-2" />Créer une page
              </Button>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette page ?</AlertDialogTitle>
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

function PageRow({ page, isAdmin, onEdit, onDelete }: {
  page: any; isAdmin: boolean; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{page.title}</h3>
        <p className="text-xs text-muted-foreground truncate">/{page.slug}</p>
      </div>
      {isAdmin && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit}><Edit className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      )}
    </div>
  );
}
