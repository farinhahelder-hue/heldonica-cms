import { Switch, Route } from "wouter";
import { useAuth } from "./_core/hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PagesManager from "./pages/PagesManager";
import PageEditor from "./pages/PageEditor";
import ArticlesManager from "./pages/ArticlesManager";
import ArticleEditor from "./pages/ArticleEditor";
import Destinations from "./pages/Destinations";
import MediaManager from "./pages/MediaManager";
import TravelPlanningRequests from "./pages/TravelPlanningRequests";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" /></div>;
  if (!user) { window.location.href = "/login"; return null; }
  return <Component />;
}

export default function App() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/pages" component={() => <ProtectedRoute component={PagesManager} />} />
      <Route path="/pages/new" component={() => <ProtectedRoute component={PageEditor} />} />
      <Route path="/pages/edit/:id" component={() => <ProtectedRoute component={PageEditor} />} />
      <Route path="/articles" component={() => <ProtectedRoute component={ArticlesManager} />} />
      <Route path="/articles/new" component={() => <ProtectedRoute component={ArticleEditor} />} />
      <Route path="/articles/edit/:id" component={() => <ProtectedRoute component={ArticleEditor} />} />
      <Route path="/destinations" component={() => <ProtectedRoute component={Destinations} />} />
      <Route path="/media" component={() => <ProtectedRoute component={MediaManager} />} />
      <Route path="/travel-planning" component={() => <ProtectedRoute component={TravelPlanningRequests} />} />
      <Route component={() => <ProtectedRoute component={Dashboard} />} />
    </Switch>
  );
}
