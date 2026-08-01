import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { 
  useGetEmployee, getGetEmployeeQueryKey 
} from "@workspace/api-client-react";
import { 
  Phone, Mail, Calendar, Briefcase, Star, ChevronRight, ShieldCheck, UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const employeeId = Number(params.id);
  const { data: emp, isLoading } = useGetEmployee(employeeId, {
    query: { enabled: !!employeeId, queryKey: getGetEmployeeQueryKey(employeeId) }
  });

  if (isLoading) return <div className="p-6 space-y-6"><Skeleton className="h-48 w-full rounded-xl"/><div className="grid grid-cols-2 gap-6"><Skeleton className="h-64 rounded-xl"/><Skeleton className="h-64 rounded-xl"/></div></div>;
  if (!emp) return <div className="p-12 text-center text-muted-foreground">Employee not found.</div>;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link href="/crm/employees" className="hover:text-primary transition-colors">Staff</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">{emp.name}</span>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-8 py-8 border-b border-border bg-gradient-to-r from-muted/50 to-transparent">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className={cn(
              "w-24 h-24 rounded-full flex flex-col items-center justify-center font-display shadow-xl border-4",
              emp.role === 'manager' ? "bg-black text-white border-black/10 dark:bg-white dark:text-black dark:border-white/10" :
              "bg-primary text-white border-white dark:border-zinc-900"
            )}>
              <span className="font-bold text-4xl">{emp.name.split(' ').map(n=>n[0]).join('').substring(0,2)}</span>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                <h1 className="text-3xl font-display font-bold text-foreground">{emp.name}</h1>
                <Badge variant={emp.status === 'active' ? 'default' : emp.status === 'on_leave' ? 'secondary' : 'destructive'} 
                       className={cn("uppercase tracking-wider font-bold", 
                         emp.status === 'active' ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent" : "")}>
                  {emp.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-2 text-sm text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5 text-foreground capitalize">
                  {emp.role === 'manager' ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <UserCog className="w-4 h-4 text-primary" />}
                  {emp.role}
                </span>
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {emp.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {emp.phone}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline">Edit Profile</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Jobs Completed</p>
            <p className="text-3xl font-display font-bold text-foreground">{emp.jobsCompleted || 0}</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Avg Rating</p>
            <div className="flex items-center justify-center gap-2">
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              <span className="text-3xl font-display font-bold text-foreground">{emp.averageRating ? emp.averageRating.toFixed(1) : 'N/A'}</span>
            </div>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Utilization</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-display font-bold text-primary">{emp.utilizationPercent || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <h3 className="font-display font-semibold text-lg mb-5 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" /> Employment Details
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Hire Date</span>
              <span className="font-medium">{emp.hireDate ? format(parseISO(emp.hireDate), 'MMMM d, yyyy') : 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Hourly Rate</span>
              <span className="font-medium">{emp.hourlyRate ? `$${emp.hourlyRate.toFixed(2)}/hr` : 'N/A'}</span>
            </div>
            {emp.skills && emp.skills.length > 0 && (
              <div className="pt-2">
                <span className="text-muted-foreground block mb-2 text-sm">Specialized Skills</span>
                <div className="flex flex-wrap gap-2">
                  {emp.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="font-normal">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {emp.notes && (
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-display font-semibold text-lg mb-5">Manager Notes</h3>
            <div className="bg-muted/30 p-4 rounded-lg text-sm text-foreground/80 leading-relaxed border border-border/50">
              {emp.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}