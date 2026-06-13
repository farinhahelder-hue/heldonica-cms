import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RouteIcon } from "lucide-react";

export default function MapsManager() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <RouteIcon className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold">Cartes & Parcours</h1>
            <p className="text-sm text-muted-foreground">
              Gestion des cartes interactives et itinéraires slow travel.
            </p>
          </div>
          <Badge variant="outline" className="ml-auto">
            Bientôt disponible
          </Badge>
        </div>

        {/* Placeholder section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MapManagerSection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cette section accueillera la gestion des cartes Leaflet / Mapbox,
              des points d'intérêt (POI) et des parcours GPX associés aux articles
              Heldonica. Migration Supabase <code>cms_maps</code> à brancher ici.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
