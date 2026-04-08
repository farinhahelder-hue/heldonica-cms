import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Edit, Search, Eye, EyeOff, MapPin, Globe, X, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import type { Destination } from "../../../drizzle/schema";

type ContentStatus = "draft" | "published" | "archived";

interface DestinationForm {
  name: string;
  slug: string;
  description: string;
  country: string;
  latitude: string;
  longitude: string;
  image: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  status: ContentStatus;
}

const emptyForm: DestinationForm = {
  name: "", slug: "", description: "", country: "",
  latitude: "", longitude: "", image: "",
  metaTitle: "", metaDescription: "", ogImage: "", status: "draft",
};

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function Destinations() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<DestinationForm>(emptyForm);
  const [slugManual, setSlugManual] = useState(false);

  const { data: destinations, refetch } = trpc.destinations.list.useQuery({ limit: 200 });

  const createMutation = trpc.destinations.create.useMutation({
    onSuccess: () => { toast.success("Destination créée !"); refetch(); setIsCreating(false); setForm(emptyForm); },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Erreur";
      toast.error(msg);
    },
  });

  const updateMutation = trpc.destinations.update.useMutation({
    onSuccess: () => { toast.success("Destination mise à jour !"); refetch(); setEditingId(null); },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Erreur";
      toast.error(msg);
    },
  });

  const deleteMutation = trpc.destinations.delete.useMutation({
    onSuccess: () => { toast.success("Destination supprimée"); refetch(); setDeleteId(null); },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Erreur";
      toast.error(msg);
    },
  });

  const isAdmin = user?.role === "admin";

  const filtered = (destinations ?? []).filter((d: Destination) =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.slug?.toLowerCase().includes(search.toLowerCase()) ||
    (d.country ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const published = filtered.filter((d: Destination) => d.status === "published");
  const drafts = filtered.filter((d: Destination) => d.status !== "published");

  const openCreate = () => { setForm(emptyForm); setSlugManual(false); setIsCreating(true); };
  const openEdit = (dest: Destination) => {
    setForm({
      name: dest.name ?? "",
      slug: dest.slug ?? "",
      description: dest.description ?? "",
      country: dest.country ?? "",
      latitude: dest.latitude ?? "",
      longitude: dest.longitude ?? "",
      image: dest.image ?? "",
      metaTitle: dest.metaTitle ?? "",
      metaDescription: dest.metaDescription ?? "",
      ogImage: dest.ogImage ?? "",
      status: (dest.status as ContentStatus) ?? "draft",
    });
    setSlugManual(true);
    setEditingId(dest.id);
  };

  const updateForm = (key: keyof DestinationForm, value: string) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugManual) next.slug = slugify(value);
      return next;
    });
  };

  const handleSave = (status: ContentStatus = form.status) => {
    if (!form.name.trim()) { toast.error("Le nom est obligatoire"); return; }
    if (!form.slug.trim()) { toast.error("Le slug est obligatoire"); return; }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form, status });
    } else {
      createMutation.mutate({ ...form, status });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const DestForm = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Nom *</Label>
          <Input value={form.name} onChange={e => updateForm("name", e.target.value)} placeholder="Portugal - Alentejo" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Slug *</Label>
          <Input value={form.slug} onChange={e => { setSlugManual(true); updateForm("slug", e.target.value); }} placeholder="portugal-alentejo" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Pays</Label>
          <Input value={form.country} onChange={e => updateForm("country", e.target.value)} placeholder="Portugal" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Latitude</Label>
          <Input value={form.latitude} onChange={e => updateForm("latitude", e.target.value)} placeholder="38.5667" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Longitude</Label>
          <Input value={form.longitude} onChange={e => updateForm("longitude", e.target.value)} placeholder="-7.9167" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Description</Label>
          <Textarea value={form.description} onChange={e => updateForm("description", e.target.value)} rows={3} placeholder="Description de la destination..." className="resize-none" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Image URL</Label>
          <Input value={form.image} onChange={e => updateForm("image", e.target.value)} placeholder="https://..." />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Meta Title</Label>
          <Input value={form.metaTitle} onChange={e => updateForm("metaTitle", e.target.value)} placeholder={form.name} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Meta Description</Label>
          <Textarea value={form.metaDescription} onChange={e => updateForm("metaDescription", e.target.value)} rows={2} placeholder={form.description} className="resize-none" />
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Destinations</h1>
            <p className="text-muted-foreground text-sm mt-1">{destinations?.length ?? 0} destination{(destinations?.length ?? 0) > 1 ? "s" : ""}</p>
          </div>
          {isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />Nouvelle destination
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, slug ou pays..." className="pl-9" />
        </div>

        {published.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4 text-green-600" />Publiées ({published.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {published.map((dest: Destination) => (
                <DestRow key={dest.id} dest={dest} isAdmin={isAdmin}
                  onEdit={() => openEdit(dest)}
                  onDelete={() => setDeleteId(dest.id)}
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
              {drafts.map((dest: Destination) => (
                <DestRow key={dest.id} dest={dest} isAdmin={isAdmin}
                  onEdit={() => openEdit(dest)}
                  onDelete={() => setDeleteId(dest.id)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-medium">Aucune destination trouvée</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {search ? `Aucun résultat pour "${search}"` : "Ajoute ta première destination !"}
            </p>
            {!search && isAdmin && (
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />Créer une destination
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={isCreating || editingId !== null} onOpenChange={open => {
        if (!open) { setIsCreating(false); setEditingId(null); }
      }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {editingId ? "Modifier la destination" : "Nouvelle destination"}
            </DialogTitle>
          </DialogHeader>
          {DestForm}
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={() => { setIsCreating(false); setEditingId(null); }}>
              <X className="h-4 w-4 mr-1" />Annuler
            </Button>
            <Button variant="outline" onClick={() => handleSave("draft")} disabled={isPending}>
              <Save className="h-4 w-4 mr-1" />Brouillon
            </Button>
            <Button onClick={() => handleSave("published")} disabled={isPending}>
              <Globe className="h-4 w-4 mr-1" />Publier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette destination ?</AlertDialogTitle>
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

function DestRow({ dest, isAdmin, onEdit, onDelete }: {
  dest: Destination; isAdmin: boolean; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate">{dest.name}</h3>
          {dest.country && <Badge variant="outline" className="text-xs shrink-0">{dest.country}</Badge>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground truncate">/{dest.slug}</p>
          {dest.latitude && dest.longitude && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5 shrink-0">
              <MapPin className="h-2.5 w-2.5" />{dest.latitude}, {dest.longitude}
            </span>
          )}
        </div>
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
