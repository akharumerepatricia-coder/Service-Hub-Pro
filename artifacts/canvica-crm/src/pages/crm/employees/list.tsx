import { useState } from "react";
import { Link } from "wouter";
import { 
  useListEmployees 
} from "@workspace/api-client-react";
import { 
  Plus, Search, Filter, ShieldCheck, Mail, Phone, Calendar, Star, ChevronRight, Briefcase
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function EmployeesListPage() {
  const [search, setSearch] = useState("");
  const { data: employees, isLoading } = useListEmployees();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Staff & Employees</h1>
          <p className="text-muted-foreground mt-1">Manage your team, roles, and performance metrics.</p>
        </div>
        <Button className="font-semibold shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search staff members..." 
            className="pl-9 bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="bg-card">
          <Filter className="w-4 h-4 mr-2" /> Role Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="space-y-2 flex-1 pt-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))
        ) : employees?.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-border rounded-xl bg-card">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-base font-medium text-foreground">No employees found</p>
            <p className="text-muted-foreground">Add staff members to start assigning jobs.</p>
            <Button variant="outline" className="mt-4">Add Employee</Button>
          </div>
        ) : (
          employees?.map((emp) => (
            <Link key={emp.id} href={`/crm/employees/${emp.id}`}>
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group h-full flex flex-col relative overflow-hidden">
                {emp.role === 'manager' && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-black/5 dark:from-white/5 to-transparent rounded-bl-full -z-10" />
                )}
                
                <div className="flex items-start gap-4 mb-5">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex flex-col items-center justify-center font-display shadow-inner border-2",
                    emp.role === 'manager' ? "bg-black text-white border-black/10 dark:bg-white dark:text-black" :
                    emp.role === 'supervisor' ? "bg-zinc-800 text-white border-zinc-700 dark:bg-zinc-200 dark:text-zinc-900" :
                    "bg-primary/10 text-primary border-primary/20"
                  )}>
                    <span className="font-bold text-xl">{emp.name.split(' ').map(n=>n[0]).join('').substring(0,2)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">{emp.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      {emp.role === 'manager' && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                      <span className="capitalize font-medium">{emp.role}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-md">
                    <Phone className="w-4 h-4 shrink-0 text-primary/70" />
                    <span className="truncate">{emp.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-md">
                    <Calendar className="w-4 h-4 shrink-0 text-primary/70" />
                    <span className="truncate">{emp.hireDate ? format(parseISO(emp.hireDate), 'MMM yyyy') : 'N/A'}</span>
                  </div>
                </div>

                <div className="mt-auto pt-5 border-t border-border flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Performance</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 font-bold text-foreground">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {emp.averageRating ? emp.averageRating.toFixed(1) : 'N/A'}
                      </div>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="text-sm font-medium">{emp.jobsCompleted || 0} jobs</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <Badge variant={emp.status === 'active' ? 'default' : emp.status === 'on_leave' ? 'secondary' : 'destructive'} 
                           className={cn("uppercase text-[10px] tracking-wider font-bold mb-1", 
                             emp.status === 'active' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20" : "")}>
                      {emp.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                      View Profile <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}