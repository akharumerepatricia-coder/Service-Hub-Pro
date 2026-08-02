import { useState } from "react";
import { Link } from "wouter";
import { useListJobs, useCreateJob, useListCustomers, useListEmployees } from "@workspace/api-client-react";
import { Plus, Search, Calendar as CalendarIcon, Clock, MapPin, User, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function ScheduleJobModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createJob = useCreateJob();
  const { data: customers } = useListCustomers();
  const { data: employees } = useListEmployees();
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    customerId: "", serviceType: "residential", cleaningType: "standard",
    scheduledDate: today, scheduledTime: "09:00", durationHours: "3",
    price: "", notes: "", isRecurring: false, recurrencePattern: "",
  });
  const [selectedEmps, setSelectedEmps] = useState<string[]>([]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleEmp = (id: string) =>
    setSelectedEmps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || !form.price) {
      toast({ title: "Customer and price are required", variant: "destructive" }); return;
    }
    createJob.mutate({
      data: {
        customerId: parseFloat(form.customerId),
        serviceType: form.serviceType,
        cleaningType: form.cleaningType,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        durationHours: form.durationHours ? parseFloat(form.durationHours) : undefined,
        price: parseFloat(form.price),
        assignedEmployeeIds: selectedEmps.map(parseFloat),
        notes: form.notes || undefined,
        isRecurring: form.isRecurring,
        recurrencePattern: form.isRecurring ? form.recurrencePattern || undefined : undefined,
        status: "scheduled",
      } as any,
    }, {
      onSuccess: () => {
        toast({ title: "Job scheduled successfully" });
        queryClient.invalidateQueries({ queryKey: ["/jobs"] });
        onClose();
      },
      onError: () => toast({ title: "Failed to schedule job", variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-xl">Schedule New Job</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Job Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Customer *</Label>
                <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.customerId} onChange={set("customerId")} required>
                  <option value="">Select customer...</option>
                  {customers?.map(c => <option key={c.id} value={c.id}>{c.name} — {c.address}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Service Type</Label>
                <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.serviceType} onChange={set("serviceType")}>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Cleaning Type</Label>
                <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.cleaningType} onChange={set("cleaningType")}>
                  <option value="Standard Clean">Standard Clean</option>
                  <option value="Deep Clean">Deep Clean</option>
                  <option value="Move In/Out Clean">Move In/Out</option>
                  <option value="Post-Construction Clean">Post-Construction</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Scheduled Date *</Label>
                <Input type="date" value={form.scheduledDate} onChange={set("scheduledDate")} min={today} required />
              </div>
              <div className="space-y-1.5">
                <Label>Scheduled Time</Label>
                <Input type="time" value={form.scheduledTime} onChange={set("scheduledTime")} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (hours)</Label>
                <Input type="number" min="0.5" max="24" step="0.5" placeholder="3" value={form.durationHours} onChange={set("durationHours")} />
              </div>
              <div className="space-y-1.5">
                <Label>Price ($) *</Label>
                <Input type="number" min="0" step="0.01" placeholder="240.00" value={form.price} onChange={set("price")} required />
              </div>
              <div className="space-y-1.5 flex items-center gap-3 pt-5">
                <input type="checkbox" id="recurring" checked={form.isRecurring} onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))} className="h-4 w-4 rounded" />
                <Label htmlFor="recurring" className="cursor-pointer">Recurring job</Label>
              </div>
              {form.isRecurring && (
                <div className="space-y-1.5">
                  <Label>Recurrence Pattern</Label>
                  <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.recurrencePattern} onChange={set("recurrencePattern")}>
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {employees && employees.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Assign Staff ({selectedEmps.length} selected)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {employees.filter(e => e.status === "active").map(emp => (
                  <button key={emp.id} type="button"
                    onClick={() => toggleEmp(String(emp.id))}
                    className={cn("flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all text-left",
                      selectedEmps.includes(String(emp.id))
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50"
                    )}>
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center font-bold text-xs shrink-0">
                      {emp.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{emp.name.split(" ")[0]}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{emp.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea placeholder="Special instructions, entry notes..." value={form.notes} onChange={set("notes")} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createJob.isPending}>{createJob.isPending ? "Scheduling..." : "Schedule Job"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  late: "bg-red-500/10 text-red-600 border-red-500/20",
  cancelled: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

export function JobsListPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { data: jobs, isLoading } = useListJobs();

  const filtered = jobs?.filter(j =>
    !search ||
    j.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    j.customerAddress?.toLowerCase().includes(search.toLowerCase()) ||
    j.cleaningType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <ScheduleJobModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Job Board</h1>
          <p className="text-muted-foreground mt-1">Schedule, assign, and track cleaning operations.</p>
        </div>
        <Button className="font-semibold shadow-sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Schedule Job
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search jobs by customer, address..." className="pl-9 bg-card border-border" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {search && <Button variant="ghost" size="sm" onClick={() => setSearch("")}><X className="w-4 h-4" /></Button>}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-lg" /><div className="space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-32" /></div></div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))
          ) : !filtered?.length ? (
            <div className="py-16 text-center text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-base font-medium text-foreground">{search ? "No matching jobs" : "No jobs scheduled"}</p>
              <p>{search ? "Try a different search." : "Click 'Schedule Job' to get started."}</p>
              {!search && <Button variant="outline" className="mt-4" onClick={() => setModalOpen(true)}>Schedule a Job</Button>}
            </div>
          ) : (
            filtered?.map(job => (
              <Link key={job.id} href={`/crm/jobs/${job.id}`}>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors cursor-pointer group">
                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                    <div className="flex flex-col items-center justify-center bg-muted/50 border border-border rounded-lg w-14 h-14 shrink-0 shadow-sm">
                      <span className="text-xs font-bold text-primary uppercase">{format(parseISO(job.scheduledDate), "MMM")}</span>
                      <span className="text-lg font-display font-black leading-none text-foreground">{format(parseISO(job.scheduledDate), "dd")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors">{job.customerName}</h4>
                        <Badge variant="outline" className={cn("text-[10px] py-0 px-1.5 uppercase font-bold", STATUS_COLORS[job.status] ?? "")}>{job.status.replace("_", " ")}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{job.scheduledTime}{job.durationHours ? ` (${job.durationHours}h)` : ""}</span>
                        <span className="flex items-center gap-1.5 truncate max-w-xs"><MapPin className="w-3.5 h-3.5" />{job.customerAddress}</span>
                        <Badge variant="secondary" className="text-[10px] py-0 px-1 font-normal capitalize">{job.cleaningType?.replace(/_/g, " ")}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-48 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                    <div className="flex flex-col sm:items-end gap-1">
                      <span className="font-bold text-foreground">${job.price.toFixed(2)}</span>
                      {job.assignedEmployeeNames && job.assignedEmployeeNames.length > 0 ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{job.assignedEmployeeNames.length > 1 ? `${job.assignedEmployeeNames.length} staff` : job.assignedEmployeeNames[0]}</span>
                      ) : <span className="text-xs text-red-500 font-medium">Unassigned</span>}
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
