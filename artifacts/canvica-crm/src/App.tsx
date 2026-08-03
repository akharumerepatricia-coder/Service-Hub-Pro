import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from './components/error-boundary';
import { AuthProvider } from './contexts/auth-context';
import { ProtectedRoute } from './components/protected-route';

// Layouts
import { PublicLayout } from './components/layout/public-layout';
import { CrmLayout } from './components/layout/crm-layout';

// Pages
import { LandingPage } from './pages/public/landing';
import { BookingPage } from './pages/public/booking';
import { CrmLoginPage } from './pages/crm/login';
import NotFound from '@/pages/not-found';
import { useEffect, lazy, Suspense } from 'react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function ScrollToTop() {
  const [pathname] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function CrmRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <CrmLayout>{children}</CrmLayout>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground">Loading…</div>}>
    <Switch>
      {/* Public */}
      <Route path="/"><PublicLayout><LandingPage /></PublicLayout></Route>
      <Route path="/book"><PublicLayout><BookingPage /></PublicLayout></Route>

      {/* CRM login (public) */}
      <Route path="/crm/login"><CrmLoginPage /></Route>

      {/* CRM (protected) */}
      <Route path="/crm">{() => { window.location.replace("/crm/dashboard"); return null; }}</Route>
      <Route path="/crm/dashboard"><CrmRoute><DashboardPage /></CrmRoute></Route>
      
      <Route path="/crm/leads"><CrmRoute><LeadsListPage /></CrmRoute></Route>
      <Route path="/crm/leads/:id">{(params) => <CrmRoute><LeadDetailPage params={params} /></CrmRoute>}</Route>
      
      <Route path="/crm/customers"><CrmRoute><CustomersListPage /></CrmRoute></Route>
      <Route path="/crm/customers/:id">{(params) => <CrmRoute><CustomerDetailPage params={params} /></CrmRoute>}</Route>

      <Route path="/crm/jobs"><CrmRoute><JobsListPage /></CrmRoute></Route>
      <Route path="/crm/jobs/:id">{(params) => !params.id || params.id === 'new' ? <CrmRoute><div className="p-12 text-center text-muted-foreground">New Job Form (Coming Soon)</div></CrmRoute> : <CrmRoute><JobDetailPage params={params} /></CrmRoute>}</Route>
      
      <Route path="/crm/quotes"><CrmRoute><QuotesListPage /></CrmRoute></Route>
      <Route path="/crm/invoices"><CrmRoute><InvoicesListPage /></CrmRoute></Route>
      
      <Route path="/crm/employees"><CrmRoute><EmployeesListPage /></CrmRoute></Route>
      <Route path="/crm/employees/:id">{(params) => <CrmRoute><EmployeeDetailPage params={params} /></CrmRoute>}</Route>

      <Route path="/crm/pricing"><CrmRoute><PricingPage /></CrmRoute></Route>
      <Route path="/crm/hiring"><CrmRoute><HiringHubPage /></CrmRoute></Route>

      <Route><NotFound /></Route>
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AuthProvider>
              <ScrollToTop />
              <Router />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

const DashboardPage = lazy(() => import('./pages/crm/dashboard').then((m) => ({ default: m.DashboardPage })));

const CustomerDetailPage = lazy(() => import('./pages/crm/customers/detail').then((m) => ({ default: m.CustomerDetailPage })));

const LeadDetailPage = lazy(() => import('./pages/crm/leads/detail').then((m) => ({ default: m.LeadDetailPage })));

const LeadsListPage = lazy(() => import('./pages/crm/leads/list').then((m) => ({ default: m.LeadsListPage })));

const EmployeeDetailPage = lazy(() => import('./pages/crm/employees/detail').then((m) => ({ default: m.EmployeeDetailPage })));

const PricingPage = lazy(() => import('./pages/crm/pricing').then((m) => ({ default: m.PricingPage })));

const QuotesListPage = lazy(() => import('./pages/crm/quotes/list').then((m) => ({ default: m.QuotesListPage })));

const JobsListPage = lazy(() => import('./pages/crm/jobs/list').then((m) => ({ default: m.JobsListPage })));

const HiringHubPage = lazy(() => import('./pages/crm/hiring/list').then((m) => ({ default: m.HiringHubPage })));

const CustomersListPage = lazy(() => import('./pages/crm/customers/list').then((m) => ({ default: m.CustomersListPage })));

const EmployeesListPage = lazy(() => import('./pages/crm/employees/list').then((m) => ({ default: m.EmployeesListPage })));

const JobDetailPage = lazy(() => import('./pages/crm/jobs/detail').then((m) => ({ default: m.JobDetailPage })));

const InvoicesListPage = lazy(() => import('./pages/crm/invoices/list').then((m) => ({ default: m.InvoicesListPage })));
