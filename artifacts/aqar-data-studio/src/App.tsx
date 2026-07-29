import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';

import Dashboard from '@/pages/Dashboard';
import PropertiesList from '@/pages/properties/PropertiesList';
import PropertyForm from '@/pages/properties/PropertyForm';
import PropertyDetail from '@/pages/properties/PropertyDetail';
import Import from '@/pages/Import';
import Export from '@/pages/Export';
import Regions from '@/pages/Regions';
import PropertyTypes from '@/pages/PropertyTypes';
import Lookup from '@/pages/Lookup';
import Users from '@/pages/Users';
import AuditLogs from '@/pages/AuditLogs';
import Settings from '@/pages/Settings';
import Search from '@/pages/Search';

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/properties" component={PropertiesList} />
        <Route path="/properties/new" component={PropertyForm} />
        <Route path="/properties/:id/edit" component={PropertyForm} />
        <Route path="/properties/:id" component={PropertyDetail} />
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
