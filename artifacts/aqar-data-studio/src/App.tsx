import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ShortcutsDialog } from '@/components/ui/shortcuts-dialog';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect, useLocation } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider } from '@/lib/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { Loader2 } from 'lucide-react';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import PropertiesList from '@/pages/properties/PropertiesList';
import PropertyForm from '@/pages/properties/PropertyForm';
import PropertyDetail from '@/pages/properties/PropertyDetail';
import Compare from '@/pages/Compare';
import Import from '@/pages/Import';
import Export from '@/pages/Export';
import Regions from '@/pages/Regions';
import PropertyTypes from '@/pages/PropertyTypes';
import Lookup from '@/pages/Lookup';
import Users from '@/pages/Users';
import AuditLogs from '@/pages/AuditLogs';
import Settings from '@/pages/Settings';
import Search from '@/pages/Search';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// ── Auth guard ────────────────────────────────────────────────────────────────

function ProtectedRouter() {
  const { session, loading } = useAuth();
  const [location] = useLocation();

  // Full-screen loading spinner while resolving session
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#567C8D]" />
      </div>
    );
  }

  // Unauthenticated — redirect everything except /login to /login
  if (!session) {
    if (location !== '/login') {
      return <Redirect to="/login" />;
    }
    return <Login />;
  }

  // Already logged in, trying to visit /login → go home
  if (location === '/login') {
    return <Redirect to="/" />;
  }

  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  useKeyboardShortcuts();

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/properties" component={PropertiesList} />
        <Route path="/properties/new" component={PropertyForm} />
        <Route path="/properties/:id/edit" component={PropertyForm} />
        <Route path="/properties/:id" component={PropertyDetail} />
        <Route path="/compare" component={Compare} />
        <Route path="/import" component={Import} />
        <Route path="/export" component={Export} />
        <Route path="/regions" component={Regions} />
        <Route path="/property-types" component={PropertyTypes} />
        <Route path="/lookup" component={Lookup} />
        <Route path="/users" component={Users} />
        <Route path="/audit-logs" component={AuditLogs} />
        <Route path="/settings" component={Settings} />
        <Route path="/search" component={Search} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Switch>
                <Route path="/login" component={Login} />
                <Route>
                  <ProtectedRouter />
                </Route>
              </Switch>
            </WouterRouter>
            <Toaster />
            <ShortcutsDialog />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
