import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useEffect } from 'react';

// Layouts
import { PublicLayout } from './components/layout/public-layout';
import { CrmLayout } from './components/layout/crm-layout';

// Pages
import { LandingPage } from './pages/public/landing';
import { BookingPage } from './pages/public/booking';
import { DashboardPage } from './pages/crm/dashboard';
import { LeadsListPage } from './pages/crm/leads/list';
import { LeadDetailPage } from './pages/crm/leads/detail';
import { CustomersListPage } from './pages/crm/customers/list';
import { CustomerDetailPage } from './pages/crm/customers/detail';
import { JobsListPage } from './pages/crm/jobs/list';
import { JobDetailPage } from './pages/crm/jobs/detail';
import { QuotesListPage } from './pages/crm/quotes/list';
import { InvoicesListPage } from './pages/crm/invoices/list';
import { EmployeesListPage } from './pages/crm/employees/list';
import { EmployeeDetailPage } from './pages/crm/employees/detail';
import { PricingPage } from './pages/crm/pricing';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function ScrollToTop() {
  const [pathname] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/"><PublicLayout><LandingPage /></PublicLayout></Route>
      <Route path="/book"><PublicLayout><BookingPage /></PublicLayout></Route>

      {/* CRM */}
      <Route path="/crm">{() => { window.location.replace("/crm/dashboard"); return null; }}</Route>
      <Route path="/crm/dashboard"><CrmLayout><DashboardPage /></CrmLayout></Route>
      
      <Route path="/crm/leads"><CrmLayout><LeadsListPage /></CrmLayout></Route>
      <Route path="/crm/leads/:id">{(params) => <CrmLayout><LeadDetailPage params={params} /></CrmLayout>}</Route>
      
      <Route path="/crm/customers"><CrmLayout><CustomersListPage /></CrmLayout></Route>
      <Route path="/crm/customers/:id">{(params) => <CrmLayout><CustomerDetailPage params={params} /></CrmLayout>}</Route>

      <Route path="/crm/jobs"><CrmLayout><JobsListPage /></CrmLayout></Route>
      <Route path="/crm/jobs/:id">{(params) => !params.id || params.id === 'new' ? <CrmLayout><div className="p-12 text-center text-muted-foreground">New Job Form (Coming Soon)</div></CrmLayout> : <CrmLayout><JobDetailPage params={params} /></CrmLayout>}</Route>
      
      <Route path="/crm/quotes"><CrmLayout><QuotesListPage /></CrmLayout></Route>
      <Route path="/crm/invoices"><CrmLayout><InvoicesListPage /></CrmLayout></Route>
      
      <Route path="/crm/employees"><CrmLayout><EmployeesListPage /></CrmLayout></Route>
      <Route path="/crm/employees/:id">{(params) => <CrmLayout><EmployeeDetailPage params={params} /></CrmLayout>}</Route>

      <Route path="/crm/pricing"><CrmLayout><PricingPage /></CrmLayout></Route>

      <Route><NotFound /></Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ScrollToTop />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;