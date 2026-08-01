import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { 
  useGetJob, getGetJobQueryKey, useUpdateJobStatus 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Calendar, Clock, MapPin, User, ChevronRight, CheckCircle2, 
  PlayCircle, AlertTriangle, FileText, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export function JobDetailPage({ params }: { params: { id: string } }) {
  const jobId = Number(params.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: job, isLoading } = useGetJob(jobId, {
    query: { enabled: !!jobId, queryKey: getGetJobQueryKey(jobId) }
  });

  const updateStatus = useUpdateJobStatus();

  const handleStatusChange = (status: any) => {
    updateStatus.mutate({ jobId, data: { status } }, {
      onSuccess: (updated) => {
        toast({ title: "Job Status Updated" });
        queryClient.setQueryData(getGetJobQueryKey(jobId), updated);
      }
    });
  };

  if (isLoading) return <div className="p-6 space-y-6"><Skeleton className="h-48 w-full rounded-xl"/><Skeleton className="h-96 w-full rounded-xl"/></div>;
  if (!job) return <div className="p-12 text-center text-muted-foreground">Job not found.</div>;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link href="/crm/jobs" className="hover:text-primary transition-colors">Jobs</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Job #{job.id}</span>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-8 border-b border-border bg-muted/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary" className="uppercase tracking-wider px-2 py-0.5 font-bold">
                  {job.status.replace('_', ' ')}
                </Badge>
                {job.isRecurring && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Recurring</Badge>}
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                <Link href={`/crm/customers/${job.customerId}`} className="hover:text-primary transition-colors">
                  {job.customerName}
                </Link>
              </h1>
              <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {format(parseISO(job.scheduledDate), 'EEEE, MMMM d, yyyy')}</span>
                <span className="flex items-center gap-1.5 text-foreground bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/20"><Clock className="w-4 h-4" /> {job.scheduledTime} ({job.durationHours}h)</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {job.status === 'scheduled' && (
                <Button onClick={() => handleStatusChange('in_progress')} className="bg-blue-600 hover:bg-blue-700">
                  <PlayCircle className="w-4 h-4 mr-2" /> Start Job
                </Button>
              )}
              {job.status === 'in_progress' && (
                <Button onClick={() => handleStatusChange('completed')} className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Completed
                </Button>
              )}
              {['scheduled', 'late'].includes(job.status) && (
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleStatusChange('cancelled')}>
                  <XCircle className="w-4 h-4 mr-2" /> Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Service Details</h3>
              <div className="bg-muted/30 p-4 rounded-lg border border-border/50 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-semibold capitalize">{job.cleaningType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Environment</span>
                  <span className="font-semibold capitalize">{job.serviceType}</span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-3 mt-1">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-display font-bold text-lg text-primary">${job.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Location</h3>
              <div className="flex items-start gap-3 bg-muted/30 p-4 rounded-lg border border-border/50">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="font-medium text-foreground">{job.customerAddress}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Assigned Staff</h3>
              {job.assignedEmployeeNames && job.assignedEmployeeNames.length > 0 ? (
                <div className="space-y-2">
                  {job.assignedEmployeeNames.map((name, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <span className="font-medium">{name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg bg-muted/20">
                  <User className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-medium">No staff assigned</p>
                  <Button variant="link" size="sm" className="mt-1">Assign Staff</Button>
                </div>
              )}
            </div>

            {job.notes && (
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Notes</h3>
                <div className="bg-amber-500/5 text-amber-900 dark:text-amber-200 p-4 rounded-lg border border-amber-500/20 text-sm">
                  {job.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}