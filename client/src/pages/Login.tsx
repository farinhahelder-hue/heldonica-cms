import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Login() {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleLogin = () => {
    // Demo: auto-login as admin for development
    login({ id: 1, email: "admin@heldonica.fr", role: "admin", name: "Admin" });
    setLocation("/");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">Connexion</h1>
        <p className="text-muted-foreground">Connectez-vous pour accéder au CMS</p>
        <Button onClick={handleLogin}>Se connecter (Demo)</Button>
      </div>
    </DashboardLayout>
  );
}