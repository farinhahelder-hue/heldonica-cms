/**
 * TravelPlanningRequests — CRM interne pour gérer les demandes de Travel Planning
 * Accessible uniquement aux admins
 */
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Mail, Phone, MapPin, Calendar, Users, Euro, MessageSquare, Clock, CheckCircle2, XCircle, RefreshCw, Inbox } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TravelRequest } from "../../../drizzle/schema";

type Status = TravelRequest['status'];

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: React.ReactNode }> = {
  new:         { label: "Nouvelle",    color: "bg-blue-100 text-blue-800",   icon: <Inbox className="h-3 w-3" /> },
  contacted:   { label: "Contacté",   color: "bg-yellow-100 text-yellow-800", icon: <Mail className="h-3 w-3" /> },
  in_progress: { label: "En cours",   color: "bg-purple-100 text-purple-800", icon: <RefreshCw className="h-3 w-3" /> },
  closed:      { label: "Clôturée",   color: "bg-gray-100 text-gray-700",     icon: <CheckCircle2 className="h-3 w-3" /> },
};

export default function TravelPlanningRequests() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<TravelRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<Status | 'all'>('all');

  const { data: requests, refetch } = trpc.travelPlanning.list.useQuery({ limit: 200 });

  const updateStatus = trpc.travelPlanning.updateStatus.useMutation({
    onSuccess: () => { toast.success("Statut mis à jour"); refetch(); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const addNotes = trpc.travelPlanning.addNotes.useMutation({
    onSuccess: () => { toast.success("Notes sauvegardées"); refetch(); setSelected(null); },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });

  if (user?.role !== 'admin') {
    return <DashboardLayout><div className="p-8 text-muted-foreground">Accès réservé aux administrateurs.</div></DashboardLayout>;
  }

  const all = requests ?? [];
  const filtered = filter === 'all' ? all : all.filter(r => r.status === filter);
  const counts: Record<Status | 'all', number> = {
    all: all.length,
    new: all.filter(r => r.status === 'new').length,
    contacted: all.filter(r => r.status === 'contacted').length,
    in_progress: all.filter(r => r.status === 'in_progress').length,
    closed: all.filter(r => r.status === 'closed').length,
  };

  const openRequest = (r: TravelRequest) => { setSelected(r); setNotes(r.notes ?? ""); };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Travel Planning</h1>
            <p className="text-muted-foreground text-sm mt-1">{all.length} demande{all.length > 1 ? "s" : ""} reçue{all.length > 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Filtres par statut */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'new', 'contacted', 'in_progress', 'closed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === s ? 'bg-foreground text-background' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {s === 'all' ? 'Toutes' : STATUS_CONFIG[s].label}
              <span className="opacity-60">{counts[s]}</span>
            </button>
          ))}
        </div>

        {/* Liste */}
        <div className="grid gap-3">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-medium">Aucune demande</h3>
              <p className="text-muted-foreground text-sm mt-1">Les demandes du formulaire heldonica.fr apparaîtront ici.</p>
            </div>
          )}
          {filtered.map((r: TravelRequest) => {
            const cfg = STATUS_CONFIG[r.status];
            return (
              <Card key={r.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openRequest(r)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{r.firstName} {r.lastName}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          {cfg.icon}{cfg.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>
                        {r.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>}
                        {r.destination && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.destination}</span>}
                        {r.travelers && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.travelers}</span>}
                        {r.budget && <span className="flex items-center gap-1"><Euro className="h-3 w-3" />{r.budget}</span>}
                        {r.departureDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{r.departureDate}{r.returnDate ? ` → ${r.returnDate}` : ''}</span>}
                      </div>
                      {r.message && <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">"{r.message}"</p>}
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modal détail */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.firstName} {selected?.lastName}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Statut */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Statut :</span>
                <Select
                  value={selected.status}
                  onValueChange={(v: Status) => updateStatus.mutate({ id: selected.id, status: v })}
                >
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Infos contact */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Contact</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><a href={`mailto:${selected.email}`} className="underline underline-offset-2">{selected.email}</a></p>
                  {selected.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{selected.phone}</p>}
                </CardContent>
              </Card>

              {/* Infos voyage */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Voyage</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {selected.destination && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{selected.destination}</p>}
                  {(selected.departureDate || selected.returnDate) && <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />{selected.departureDate} → {selected.returnDate}</p>}
                  {selected.travelers && <p className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-muted-foreground" />{selected.travelers} voyageur(s)</p>}
                  {selected.budget && <p className="flex items-center gap-2"><Euro className="h-3.5 w-3.5 text-muted-foreground" />Budget : {selected.budget}</p>}
                  {selected.travelType && <p className="text-muted-foreground text-xs">Type : {selected.travelType}</p>}
                  {selected.howDidYouFind && <p className="text-muted-foreground text-xs">Via : {selected.howDidYouFind}</p>}
                </CardContent>
              </Card>

              {/* Message */}
              {selected.message && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Message</CardTitle></CardHeader>
                  <CardContent><p className="text-sm italic text-muted-foreground">{selected.message}</p></CardContent>
                </Card>
              )}

              {/* Notes internes */}
              <div className="space-y-2">
                <label className="text-xs font-medium flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />Notes internes</label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes privées (non visibles du client)..."
                  className="resize-none text-sm"
                />
                <Button size="sm" onClick={() => addNotes.mutate({ id: selected.id, notes })} disabled={addNotes.isPending}>
                  Sauvegarder les notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
