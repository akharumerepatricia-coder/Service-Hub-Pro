import { useState } from "react";
import { Link } from "wouter";
import {
  useListLeads,
  useGetLeadStats,
  useCreateLead,
} from "@workspace/api-client-react";
import {
  Plus, Search, Filter, Mail, Phone, Calendar, ArrowRight, UserPlus, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function AddLeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createLead = useCreateLead();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "",
    serviceType: "residential", cleaningType: "standard",
    frequency: "one_time", propertyType: "", bedrooms: "", bathrooms: "",
    squareFootage: "", estimatedValue: "", message: "", referralSource: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast({ title: "Name, email and phone are required", variant: "destructive" }); return;
    }
    createLead.mutate({
      data: {
        ...form,
        bedrooms: form.bedrooms ? parseFloat(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : undefined,
        squareFootage: form.squareFootage ? parseFloat(form.squareFootage) : undefined,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : undefined,
        status: "new",
      } as any,
    }, {
      onSuccess: () => {
        toast({ title: "Lead added successfully" });
        queryClient.invalidateQueries({ queryKey: ["/leads"] });
        onClose();
      },
      onError: () => toast({ title: "Failed to add lead", variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add Lead Manually</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input placeholder="Jane Smith" value={form.name} onChange={set("name")} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" placeholder="jane@example.com" value={form.email} onChange={set("email")} required />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input placeholder="0412 345 678" value={form.phone} onChange={set("phone")} required />
            </div>
            <div className="space-y-1.5">
              <Label>Referral Source</Label>
              <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.referralSource} onChange={set("referralSource")}>
                <option value="">Select source</option>
                {["Google","Facebook","Instagram","Referral","Website","Word of mouth","Other"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Input placeholder="123 Main St, Sydney NSW 2000" value={form.address} onChange={set("address")} />
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
                <option value="standard">Standard Clean</option>
                <option value="deep">Deep Clean</option>
                <option value="move_in_out">Move In/Out</option>
                <option value="post_construction">Post-Construction</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.frequency} onChange={set("frequency")}>
                <option value="one_time">One Time</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Fortnightly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Est. Value ($)</Label>
              <Input type="number" min="0" placeholder="350" value={form.estimatedValue} onChange={set("estimatedValue")} />
            </div>
            <div className="space-y-1.5">
              <Label>Bedrooms</Label>
              <Input type="number" min="0" max="20" placeholder="3" value={form.bedrooms} onChange={set("bedrooms")} />
            </div>
            <div className="space-y-1.5">
              <Label>Bathrooms</Label>
              <Input type="number" min="0" max="20" placeholder="2" value={form.bathrooms} onChange={set("bathrooms")} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Message / Notes</Label>
              <Textarea placeholder="Any additional notes from the client..." value={form.message} onChange={set("message")} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending ? "Saving..." : "Add Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  contacted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  quoted: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  won: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  lost: "bg-red-500/10 text-red-600 border-red-500/20",
};

export function LeadsListPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { data: leads, isLoading } = useListLeads();
  const { data: stats } = useGetLeadStats();

  const filtered = leads?.filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <AddLeadModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Leads Pipeline</h1>
          <p className="text-muted-foreground mt-1">Manage inquiries, quotes, and prospects.</p>
        </div>
        <Button className="font-semibold shadow-sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Lead Manually
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="text-center p-2 border-r border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total</p>
          <p className="text-2xl font-bold font-display mt-1">{stats?.total || 0}</p>
        </div>
        <div className="text-center p-2 border-r border-border">
          <p className="text-xs text-blue-600 uppercase tracking-wider font-semibold">New</p>
          <p className="text-2xl font-bold font-display mt-1">{stats?.new || 0}</p>
        </div>
        <div className="text-center p-2 border-r border-border">
          <p className="text-xs text-amber-600 uppercase tracking-wider font-semibold">Contacted</p>
          <p className="text-2xl font-bold font-display mt-1">{stats?.contacted || 0}</p>
        </div>
        <div className="text-center p-2 border-r border-border">
          <p className="text-xs text-purple-600 uppercase tracking-wider font-semibold">Quoted</p>
          <p className="text-2xl font-bold font-display mt-1">{stats?.quoted || 0}</p>
        </div>
        <div className="text-center p-2 border-r border-border">
          <p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold">Won</p>
          <p className="text-2xl font-bold font-display mt-1">{stats?.won || 0}</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded-r-lg">
          <p className="text-xs text-foreground uppercase tracking-wider font-semibold">Conversion</p>
          <p className="text-2xl font-bold font-display mt-1 text-primary">{stats ? Math.round(stats.conversionRate) : 0}%</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search leads by name, email, phone..." className="pl-9 bg-card border-border" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {search && <Button variant="ghost" size="sm" onClick={() => setSearch("")}><X className="w-4 h-4" /></Button>}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Lead Details</th>
                <th className="px-6 py-4 font-semibold">Service Request</th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td><td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td><td className="px-6 py-4"><Skeleton className="h-8 w-32" /></td><td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td><td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td></tr>
                ))
              ) : !filtered?.length ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  <UserPlus className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-base font-medium text-foreground">{search ? "No matching leads" : "No leads found"}</p>
                  <p>{search ? "Try a different search term." : "Click 'Add Lead Manually' to get started."}</p>
                </td></tr>
              ) : (
                filtered?.map(lead => (
                  <tr key={lead.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{lead.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" />{format(new Date(lead.createdAt), "MMM d, yyyy")}</div>
                      {lead.estimatedValue && <div className="text-xs font-medium text-emerald-600 mt-1">Est: ${lead.estimatedValue.toLocaleString()}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="capitalize font-medium">{lead.serviceType}</div>
                      {lead.cleaningType && <div className="text-xs text-muted-foreground capitalize mt-1">{lead.cleaningType.replace(/_/g, " ")}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="w-3 h-3" />{lead.email}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="w-3 h-3" />{lead.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={cn("uppercase tracking-wider text-[10px] font-bold px-2 py-0.5", STATUS_COLORS[lead.status] ?? "")}>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/crm/leads/${lead.id}`}>View <ArrowRight className="w-4 h-4 ml-2" /></Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
