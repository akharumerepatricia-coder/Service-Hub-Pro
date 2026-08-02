import { useState } from "react";
import { Link } from "wouter";
import { useListEmployees, useCreateEmployee } from "@workspace/api-client-react";
import { Plus, Search, ShieldCheck, Mail, Phone, Calendar, Star, ChevronRight, Briefcase, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const SKILL_OPTIONS = [
  { id: "residential", label: "Residential" },
  { id: "commercial", label: "Commercial" },
  { id: "deep_clean", label: "Deep Clean" },
  { id: "move_in_out", label: "Move In/Out" },
  { id: "post_construction", label: "Post-Construction" },
  { id: "carpet_steam", label: "Carpet Steam" },
];

function AddEmployeeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createEmployee = useCreateEmployee();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", role: "cleaner",
    status: "active", hireDate: new Date().toISOString().split("T")[0],
    hourlyRate: "", emergencyContact: "", notes: "",
  });
  const [skills, setSkills] = useState<string[]>(["residential"]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleSkill = (skill: string) =>
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast({ title: "Name, email and phone are required", variant: "destructive" }); return;
    }
    createEmployee.mutate({
      data: {
        ...form,
        hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
        skills,
        jobsCompleted: 0,
      } as any,
    }, {
      onSuccess: () => {
        toast({ title: "Employee added successfully" });
        queryClient.invalidateQueries({ queryKey: ["/employees"] });
        onClose();
      },
      onError: () => toast({ title: "Failed to add employee", variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-xl">Add Employee</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Personal Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5"><Label>Full Name *</Label><Input placeholder="Sarah Mitchell" value={form.name} onChange={set("name")} required /></div>
              <div className="space-y-1.5"><Label>Email *</Label><Input type="email" placeholder="sarah@canvica.com.au" value={form.email} onChange={set("email")} required /></div>
              <div className="space-y-1.5"><Label>Phone *</Label><Input placeholder="0412 555 001" value={form.phone} onChange={set("phone")} required /></div>
              <div className="space-y-1.5"><Label>Emergency Contact</Label><Input placeholder="Name – 0400 000 000" value={form.emergencyContact} onChange={set("emergencyContact")} /></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Employment Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.role} onChange={set("role")}>
                  <option value="cleaner">Cleaner</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.status} onChange={set("status")}>
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="space-y-1.5"><Label>Hire Date</Label><Input type="date" value={form.hireDate} onChange={set("hireDate")} /></div>
              <div className="space-y-1.5"><Label>Hourly Rate ($)</Label><Input type="number" min="0" step="0.5" placeholder="28.00" value={form.hourlyRate} onChange={set("hourlyRate")} /></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Skills & Certifications</p>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(s => (
                <button key={s.id} type="button" onClick={() => toggleSkill(s.id)}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    skills.includes(s.id) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  )}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createEmployee.isPending}>{createEmployee.isPending ? "Saving..." : "Add Employee"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EmployeesListPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { data: employees, isLoading } = useListEmployees();

  const filtered = employees?.filter(e =>
    !search ||
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AddEmployeeModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Staff & Employees</h1>
          <p className="text-muted-foreground mt-1">Manage your team, roles, and performance metrics.</p>
        </div>
        <Button className="font-semibold shadow-sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search staff members..." className="pl-9 bg-card border-border" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {search && <Button variant="ghost" size="sm" onClick={() => setSearch("")}><X className="w-4 h-4" /></Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex gap-4"><Skeleton className="w-16 h-16 rounded-full" /><div className="space-y-2 flex-1 pt-1"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div></div>
              <Skeleton className="h-10 w-full" />
            </div>
          ))
        ) : !filtered?.length ? (
          <div className="col-span-full py-16 text-center border border-dashed border-border rounded-xl bg-card">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-base font-medium text-foreground">{search ? "No matching staff" : "No employees found"}</p>
            <p className="text-muted-foreground">{search ? "Try a different search." : "Add staff members to start assigning jobs."}</p>
            {!search && <Button variant="outline" className="mt-4" onClick={() => setModalOpen(true)}>Add Employee</Button>}
          </div>
        ) : (
          filtered?.map(emp => (
            <div key={emp.id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all relative overflow-hidden">
              {emp.role === "manager" && <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-black/5 dark:from-white/5 to-transparent rounded-bl-full -z-10" />}
              <div className="flex items-start gap-4 mb-5">
                <div className={cn("w-16 h-16 rounded-full flex flex-col items-center justify-center font-display shadow-inner border-2",
                  emp.role === "manager" ? "bg-black text-white border-black/10 dark:bg-white dark:text-black" :
                  emp.role === "supervisor" ? "bg-zinc-800 text-white border-zinc-700" : "bg-primary/10 text-primary border-primary/20"
                )}>
                  <span className="font-bold text-xl">{emp.name.split(" ").map(n => n[0]).join("").substring(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <Link href={`/crm/employees/${emp.id}`}>
                    <h3 className="font-bold text-lg text-foreground hover:text-primary transition-colors truncate cursor-pointer">{emp.name}</h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    {emp.role === "manager" && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                    <span className="capitalize font-medium">{emp.role}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-md"><Phone className="w-4 h-4 shrink-0 text-primary/70" /><span className="truncate">{emp.phone}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-md"><Calendar className="w-4 h-4 shrink-0 text-primary/70" /><span className="truncate">{emp.hireDate ? format(parseISO(emp.hireDate), "MMM yyyy") : "N/A"}</span></div>
              </div>
              <div className="mt-auto pt-5 border-t border-border flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Performance</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 font-bold text-foreground"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />{emp.averageRating ? emp.averageRating.toFixed(1) : "N/A"}</div>
                    <span className="text-muted-foreground/30">|</span>
                    <span className="text-sm font-medium">{emp.jobsCompleted || 0} jobs</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Badge variant={emp.status === "active" ? "default" : "secondary"} className={cn("uppercase text-[10px] tracking-wider font-bold mb-1", emp.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "")}>
                    {emp.status.replace("_", " ")}
                  </Badge>
                  <Link href={`/crm/employees/${emp.id}`}>
                    <span className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">View Profile <ChevronRight className="w-3 h-3" /></span>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
