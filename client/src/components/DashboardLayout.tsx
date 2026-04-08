import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, FileText, Image, Settings, LogOut,
  Map, Plane, Globe, Menu, X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/pages", icon: FileText, label: "Pages" },
  { href: "/articles", icon: Globe, label: "Articles" },
  { href: "/destinations", icon: Map, label: "Destinations" },
  { href: "/travel-planning", icon: Plane, label: "Travel Planning" },
  { href: "/media", icon: Image, label: "Médiathèque" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/login"; },
    onError: () => toast({ title: "Erreur", description: "Impossible de se déconnecter", variant: "destructive" }),
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-foreground flex items-center justify-center">
            <span className="text-background text-xs font-bold">H</span>
          </div>
          <span className="font-semibold text-sm">Heldonica CMS</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = location === href || (href !== '/' && location.startsWith(href));
          return (
            <Link key={href} href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                active ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />{label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t space-y-0.5">
        <Link href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
            location === '/settings' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          <Settings className="h-4 w-4 shrink-0" />Paramètres
        </Link>
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground truncate">{user?.name || user?.email}</p>
        </div>
        <button
          onClick={() => logout.mutate()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-56 border-r bg-background shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 bg-background border-r z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <header className="flex md:hidden items-center gap-3 px-4 py-3 border-b bg-background">
          <button onClick={() => setOpen(v => !v)} className="p-1 rounded hover:bg-accent">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-semibold text-sm">Heldonica CMS</span>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}
