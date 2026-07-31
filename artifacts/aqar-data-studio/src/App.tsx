import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ShortcutsDialog } from '@/components/ui/shortcuts-dialog';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect, useLocation } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider } from '@/lib/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Component, ErrorInfo, ReactNode } from 'react';

// ── Error Boundary ─────────────────────────────────────────────────────────────

interface ErrorBoundaryState { hasError: boolean; }

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6 text-center" dir="rtl">
          <AlertTriangle size={40} className="text-destructive" />
          <h1 className="text-xl font-bold text-foreground">حدث خطأ غير متوقع</h1>
          <p className="text-muted-foreground text-sm max-w-sm">
            حاول تحديث الصفحة. إذا استمرت المشكلة، تواصل مع الدعم الفني.
          </p>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
          >
            إعادة التحميل
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
import Customers from '@/pages/Customers';
import { RoleGuard } from '@/components/RoleGuard';

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

  return (
    <AppErrorBoundary>
      <AuthenticatedApp />
    </AppErrorBoundary>
  );
}

function AuthenticatedApp() {
  useKeyboardShortcuts();

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/properties" component={PropertiesList} />
        <Route path="/properties/new"><RoleGuard roles={["admin", "agent"]}><PropertyForm /></RoleGuard></Route>
        <Route path="/properties/:id/edit"><RoleGuard roles={["admin", "agent"]}><PropertyForm /></RoleGuard></Route>
        <Route path="/properties/:id" component={PropertyDetail} />
        <Route path="/compare" component={Compare} />
        <Route path="/import"><RoleGuard roles={["admin", "agent"]}><Import /></RoleGuard></Route>
        <Route path="/export" component={Export} />
        <Route path="/regions"><RoleGuard roles={["admin", "agent"]}><Regions /></RoleGuard></Route>
        <Route path="/property-types"><RoleGuard roles={["admin", "agent"]}><PropertyTypes /></RoleGuard></Route>
        <Route path="/lookup"><RoleGuard roles={["admin", "agent"]}><Lookup /></RoleGuard></Route>
        <Route path="/users"><RoleGuard roles={["admin"]}><Users /></RoleGuard></Route>
        <Route path="/audit-logs"><RoleGuard roles={["admin", "agent"]}><AuditLogs /></RoleGuard></Route>
        <Route path="/settings"><RoleGuard roles={["admin"]}><Settings /></RoleGuard></Route>
        <Route path="/search" component={Search} />
        <Route path="/customers" component={Customers} />
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
              <LanguageProvider>
                <Switch>
                  <Route path="/login" component={Login} />
                  <Route>
                    <ProtectedRouter />
                  </Route>
                </Switch>
              </LanguageProvider>
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
