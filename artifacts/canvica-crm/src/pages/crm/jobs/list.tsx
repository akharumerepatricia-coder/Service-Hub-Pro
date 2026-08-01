import { useState } from "react";
import { Link } from "wouter";
import { 
  useListJobs
} from "@workspace/api-client-react";
import { 
  Plus, Search, Filter, Calendar as CalendarIcon, Clock, MapPin, User, ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function JobsListPage() {
  const [search, setSearch] = useState("");
  const { data: jobs, isLoading } = useListJobs();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'scheduled': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'in_progress': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'late': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'cancelled': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Job Board</h1>
          <p className="text-muted-foreground mt-1">Schedule, assign, and track cleaning operations.</p>
        </div>
        <Button className="font-semibold shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Schedule Job
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search jobs by customer, address..." 
            className="pl-9 bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-card">
            <CalendarIcon className="w-4 h-4 mr-2" /> Date
          </Button>
          <Button variant="outline" className="bg-card">
            <Filter className="w-4 h-4 mr-2" /> Status
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))
          ) : jobs?.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-base font-medium text-foreground">No jobs scheduled</p>
              <p>Create a new job to start tracking.</p>
            </div>
          ) : (
            jobs?.map((job) => (
              <Link key={job.id} href={`/crm/jobs/${job.id}`}>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors cursor-pointer group">
                  
                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                    {/* Date Block */}
                    <div className="flex flex-col items-center justify-center bg-muted/50 border border-border rounded-lg w-14 h-14 shrink-0 shadow-sm">
                      <span className="text-xs font-bold text-primary uppercase">{format(parseISO(job.scheduledDate), 'MMM')}</span>
                      <span className="text-lg font-display font-black leading-none text-foreground">{format(parseISO(job.scheduledDate), 'dd')}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors">
                          {job.customerName}
                        </h4>
                        <Badge variant="outline" className={cn("text-[10px] py-0 px-1.5 uppercase font-bold", getStatusColor(job.status))}>
                          {job.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {job.scheduledTime} {job.durationHours && `(${job.durationHours}h)`}
                        </span>
                        <span className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-xs">
                          <MapPin className="w-3.5 h-3.5" /> {job.customerAddress}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px] py-0 px-1 font-normal capitalize">
                            {job.cleaningType.replace('_', ' ')}
                          </Badge>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-48 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                    <div className="flex flex-col sm:items-end gap-1">
                      <span className="font-bold text-foreground">${job.price.toFixed(2)}</span>
                      {job.assignedEmployeeNames && job.assignedEmployeeNames.length > 0 ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" /> {job.assignedEmployeeNames.length > 1 ? `${job.assignedEmployeeNames.length} staff` : job.assignedEmployeeNames[0]}
                        </span>
                      ) : (
                        <span className="text-xs text-red-500 font-medium">Unassigned</span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>

                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}