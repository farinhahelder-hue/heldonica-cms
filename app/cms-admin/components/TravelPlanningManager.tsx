/**
 * TravelPlanningManager — Tableau CRM pour gérer les demandes Travel Planning
 * Avec notes inline, filtre statut, tri par date
 */
"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Mail, Calendar, MapPin, Clock, Save, Loader2 } from "lucide-react";

type Status = "new" | "contacted" | "in_progress" | "closed";

const STATUS_CONFIG: Record<Status, { label: string; color: string; variant: "outline" | "secondary" | "default" | "destructive" }> = {
  new:         { label: "Pending",    color: "text-orange-600",    variant: "outline" },
  contacted:   { label: "Pending",    color: "text-orange-600",    variant: "outline" },
  in_progress: { label: "Confirmed",  color: "text-green-600",    variant: "secondary" },
  closed:      { label: "Cancelled", color: "text-red-600",       variant: "destructive" },
};

export default function TravelPlanningManager() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState<number | null>(null);

  const { data: requests, refetch } = trpc.travelPlanning.list.useQuery({ limit: 200 });

  const addNotes = trpc.travelPlanning.addNotes.useMutation({
    onSuccess: () => {
      toast.success("Notes sauvegardées");
      setEditingNotes(null);
      setSavingNotes(null);
      refetch();
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    let filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
    // Tri par date création décroissant
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [requests, filter]);

  const handleSaveNotes = (id: number) => {
    setSavingNotes(id);
    addNotes.mutate({ id, notes: notesValue });
  };

  const startEditNotes = (id: number, currentNotes: string) => {
    setEditingNotes(id);
    setNotesValue(currentNotes || "");
  };

  if (!requests) {
    return (
      <DashboardLayout>
        <div className="p-8 text-muted-foreground">Chargement...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Travel Planning</CardTitle>
            <Select value={filter} onValueChange={(v) => setFilter(v as Status | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="new">Pending</SelectItem>
                <SelectItem value="contacted">Pending</SelectItem>
                <SelectItem value="in_progress">Confirmed</SelectItem>
                <SelectItem value="closed">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Aucune demande
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {req.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {req.destination}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {req.departureDate && req.returnDate
                            ? `${new Date(req.departureDate).toLocaleDateString("fr-FR")} - ${new Date(req.returnDate).toLocaleDateString("fr-FR")}`
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_CONFIG[req.status as Status]?.variant || "outline"}>
                          {STATUS_CONFIG[req.status as Status]?.label || req.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingNotes === req.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              placeholder="Notes..."
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveNotes(req.id)}
                                disabled={savingNotes === req.id}
                              >
                                {savingNotes === req.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Save className="h-4 w-4 mr-1" /> Sauvegarder
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingNotes(null)}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : req.notes ? (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground line-clamp-2">{req.notes}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditNotes(req.id, req.notes || "")}
                            >
                              ✏️ Modifier
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => startEditNotes(req.id, "")}>
                            + Ajouter notes
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}