import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PagesManager from "./pages/PagesManager";
import PageEditor from "./pages/PageEditor";
import ArticlesManager from "./pages/ArticlesManager";
import ArticleEditor from "./pages/ArticleEditor";
import Destinations from "./pages/Destinations";
import Footer from "./components/Footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      {/* Pages */}
      <Route path="/pages" component={PagesManager} />
      <Route path="/pages/new" component={PageEditor} />
      <Route path="/pages/edit/:id">
        {(params) => <PageEditor params={params} />}
      </Route>
      {/* Articles */}
      <Route path="/articles" component={ArticlesManager} />
      <Route path="/articles/new" component={ArticleEditor} />
      <Route path="/articles/edit/:id">
        {(params) => <ArticleEditor params={params} />}
      </Route>
      {/* Destinations */}
      <Route path="/destinations" component={Destinations} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <div className="flex flex-col min-h-screen">
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
