import { useMemo } from "react";
import { Link } from "wouter";
import { 
  useGetDashboardStats, 
  useGetDashboardRevenue, 
  useGetBusinessHealth, 
  useGetTopCustomers, 
  useGetTopEmployees, 
  useGetTodayRoute 
} from "@workspace/api-client-react";
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  AlertCircle,
  FileText,
  MapPin,
  Star,
  Activity,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from "recharts";
import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useGetDashboardStats();
  const { data: revenue, isLoading: revLoading } = useGetDashboardRevenue({ period: "month" });
  const { data: health, isLoading: healthLoading } = useGetDashboardBusinessHealth();
  const { data: topCustomers, isLoading: topCustLoading } = useGetTopCustomers({ limit: 5 });
  const { data: topEmployees, isLoading: topEmpLoading } = useGetTopEmployees({ limit: 5 });
  const { data: todayRoute, isLoading: routeLoading } = useGetTodayRoute();

  // Show a visible error banner when the API is unreachable so the page is
  // never a silent blank screen.
  if (statsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold mb-2">Unable to load dashboard</h2>
          <p className="text-muted-foreground max-w-md">
            The API server could not be reached. Make sure{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">DATABASE_URL</code> and{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">SESSION_SECRET</code> are
            set in your Vercel environment variables, then redeploy.
          </p>
          <p className="text-xs text-muted-foreground mt-3 font-mono">
            {(statsError as Error)?.message ?? "Unknown error"}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time overview of operations, revenue, and performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Revenue Today" 
          value={stats ? `$${stats.revenueToday.toLocaleString()}` : ""} 
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
          loading={statsLoading}
          trend="+12%"
        />
        <StatCard 
          title="Jobs Today" 
          value={stats?.jobsToday.toString()} 
          icon={<Briefcase className="w-5 h-5 text-blue-500" />}
          loading={statsLoading}
          subtext={`${stats?.upcomingJobsCount || 0} upcoming`}
        />
        <StatCard 
          title="Staff Available" 
          value={stats?.availableStaffCount.toString()} 
          icon={<Users className="w-5 h-5 text-emerald-500" />}
          loading={statsLoading}
          subtext={`${stats?.cleanerUtilizationPercent || 0}% utilization`}
        />
        <StatCard 
          title="Outstanding Inv" 
          value={stats ? `$${stats.outstandingInvoicesAmount.toLocaleString()}` : ""} 
          icon={<FileText className="w-5 h-5 text-amber-500" />}
          loading={statsLoading}
          subtext={`${stats?.outstandingInvoicesCount || 0} invoices`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-display font-semibold text-lg">Revenue Trend</h3>
              <p className="text-sm text-muted-foreground">30-day performance</p>
            </div>
            {revenue && (
              <div className="text-right">
                <p className="text-2xl font-bold tracking-tight">${revenue.total.toLocaleString()}</p>
                <p className="text-sm text-emerald-500 font-medium flex items-center justify-end gap-1">
                  <ArrowUpRight className="w-3 h-3" /> 8.4%
                </p>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-h-[300px] w-full">
            {revLoading ? (
              <Skeleton className="w-full h-full rounded-md" />
            ) : revenue?.data ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(val) => `$${val}`}
                    dx={-10}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                    formatter={(val: number) => [`$${val.toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
            )}
          </div>
        </div>

        {/* Business Health */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col">
          <h3 className="font-display font-semibold text-lg mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> Business Health
          </h3>
          
          {healthLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          ) : health ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between p-4 bg-zinc-950 text-white rounded-xl">
                <div>
                  <p className="text-zinc-400 text-sm font-medium">Overall Score</p>
                  <p className="text-4xl font-display font-bold">{health.score}<span className="text-zinc-500 text-xl">/100</span></p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center text-2xl font-bold font-display">
                  {health.grade}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Key Indicators</p>
                {health.indicators.map((ind, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{ind.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{ind.value}</span>
                      <Badge variant={ind.status === 'good' ? 'default' : ind.status === 'warning' ? 'secondary' : 'destructive'} className={cn(
                        ind.status === 'good' && "bg-emerald-500 hover:bg-emerald-600",
                        ind.status === 'warning' && "bg-amber-500 hover:bg-amber-600"
                      )}>
                        {ind.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Route */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-0 flex flex-col overflow-hidden lg:col-span-1">
          <div className="p-5 border-b border-border">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Today's Route
            </h3>
          </div>
          <div className="p-0 flex-1 bg-zinc-100 dark:bg-zinc-900/50">
            {/* Fake Map background to simulate coordinates visual */}
            <div className="relative w-full h-[300px] overflow-hidden bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v11/static/-122.42,37.77,11,0,0/800x600?access_token=fake')] bg-cover bg-center">
              <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[2px]" />
              
              <div className="absolute inset-0 p-4 overflow-y-auto z-10 space-y-3">
                {routeLoading ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
                ) : todayRoute?.length ? (
                  todayRoute.map((job) => (
                    <div key={job.id} className="bg-card p-3 rounded-lg border border-border shadow-sm flex items-start gap-3">
                      <div className="mt-0.5 bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                        {job.scheduledTime.split(':')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{job.customerName}</p>
                        <p className="text-xs text-muted-foreground truncate">{job.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">{job.status}</Badge>
                          {job.employeeName && <span className="text-[10px] text-muted-foreground">{job.employeeName}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-card rounded-lg border border-dashed border-border p-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    <p className="font-medium text-sm text-foreground">All jobs completed!</p>
                    <p className="text-xs text-center mt-1">No more stops on the route today.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-3 border-t border-border bg-card">
            <Link href="/crm/jobs" className="text-sm text-primary font-medium hover:underline flex items-center justify-center">
              View All Jobs Schedule
            </Link>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            
            {/* Top Employees */}
            <div>
              <h3 className="font-display font-semibold text-lg mb-5 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" /> Top Staff
              </h3>
              <div className="space-y-4">
                {topEmpLoading ? (
                  Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                ) : topEmployees?.length ? (
                  topEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-semibold text-sm">
                          {emp.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{emp.name}</p>
                          <div className="flex items-center gap-1 text-xs text-yellow-500">
                            <Star className="w-3 h-3 fill-current" /> {emp.rating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{emp.jobsCompleted} jobs</p>
                        <p className="text-xs text-muted-foreground">{emp.utilizationPercent}% util.</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No data available.</p>
                )}
              </div>
            </div>

            {/* Top Customers */}
            <div>
              <h3 className="font-display font-semibold text-lg mb-5 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-500" /> Top Customers
              </h3>
              <div className="space-y-4">
                {topCustLoading ? (
                  Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                ) : topCustomers?.length ? (
                  topCustomers.map((cust) => (
                    <div key={cust.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                          {cust.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{cust.name}</p>
                          <Badge variant="outline" className="text-[10px] mt-0.5">{cust.status}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">${cust.lifetimeValue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{cust.jobsCount} total jobs</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No data available.</p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

function useGetDashboardBusinessHealth() {
  return useGetBusinessHealth(); // Wrap the hook to fix name in this file
}

function StatCard({ title, value, icon, loading, subtext, trend }: { title: string, value?: string, icon: React.ReactNode, loading: boolean, subtext?: string, trend?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full -z-10 group-hover:from-primary/10 transition-colors" />
      <div className="flex items-start justify-between mb-4">
        <p className="text-muted-foreground font-medium text-sm">{title}</p>
        <div className="p-2 bg-background rounded-lg border border-border/50 shadow-sm">{icon}</div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24 mt-2" />
      ) : (
        <div>
          <div className="flex items-end gap-3">
            <h4 className="text-3xl font-display font-bold text-foreground">{value || "0"}</h4>
            {trend && <span className="text-sm font-medium text-emerald-500 mb-1 flex items-center"><ArrowUpRight className="w-3 h-3" />{trend}</span>}
          </div>
          {subtext && <p className="text-xs text-muted-foreground mt-2">{subtext}</p>}
        </div>
      )}
    </div>
  );
}