import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';
import { Layout } from '@/components/layout';

import Dashboard from '@/pages/dashboard';
import PropertiesList from '@/pages/properties/list';
import PropertyForm from '@/pages/properties/form';
import ImportWizard from '@/pages/import';
import ExportStudio from '@/pages/export';
import Lookups from '@/pages/lookups';
import Settings from '@/pages/settings';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/properties" component={PropertiesList} />
        <Route path="/properties/new" component={PropertyForm} />
        <Route path="/properties/:id/edit" component={PropertyForm} />
        <Route path="/import" component={ImportWizard} />
        <Route path="/export" component={ExportStudio} />
        <Route path="/lookups" component={Lookups} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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