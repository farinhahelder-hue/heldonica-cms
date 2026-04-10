import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";

export default function MediaManager() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Accès réservé aux administrateurs.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Médiathèque</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Gestion des médias - à implémenter.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}