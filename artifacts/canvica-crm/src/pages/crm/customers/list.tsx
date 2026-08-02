import { useState } from "react";
import { Link } from "wouter";
import { useListCustomers, useCreateCustomer } from "@workspace/api-client-react";
import { Plus, Search, MapPin, Building2, Home, ArrowRight, UserSquare, Phone, Mail, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function AddCustomerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createCustomer = useCreateCustomer();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "",
    serviceType: "residential", propertyType: "house",
    bedrooms: "", bathrooms: "", squareFootage: "",
    entryInstructions: "", alarmCode: "", pets: "",
    preferredProducts: "", cleaningPreferences: "", specialInstructions: "",
    recurringSchedule: "", notes: "", referralSource: "", status: "active",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast({ title: "Name, email and phone are required", variant: "destructive" }); return;
    }
    createCustomer.mutate({
      data: {
        ...form,
        bedrooms: form.bedrooms ? parseFloat(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : undefined,
        squareFootage: form.squareFootage ? parseFloat(form.squareFootage) : undefined,
        isRecurring: !!form.recurringSchedule,
        lifetimeValue: 0,
      } as any,
    }, {
      onSuccess: () => {
        toast({ title: "Customer added successfully" });
        queryClient.invalidateQueries({ queryKey: ["/customers"] });
        onClose();
      },
      onError: () => toast({ title: "Failed to add customer", variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Full Name *</Label><Input placeholder="Jennifer Walsh" value={form.name} onChange={set("name")} required /></div>
              <div className="space-y-1.5"><Label>Email *</Label><Input type="email" placeholder="jennifer@example.com" value={form.email} onChange={set("email")} required /></div>
              <div className="space-y-1.5"><Label>Phone *</Label><Input placeholder="0411 100 001" value={form.phone} onChange={set("phone")} required /></div>
              <div className="space-y-1.5">
                <Label>Referral Source</Label>
                <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.referralSource} onChange={set("referralSource")}>
                  <option value="">Select source</option>
                  {["Google","Facebook","Instagram","Referral","Website","Word of mouth","Other"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 space-y-1.5"><Label>Address</Label><Input placeholder="12 Acacia Drive, Mosman NSW 2088" value={form.address} onChange={set("address")} /></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Property Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Service Type</Label>
                <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.serviceType} onChange={set("serviceType")}>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Property Type</Label>
                <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.propertyType} onChange={set("propertyType")}>
                  {["house","apartment","unit","townhouse","office","retail","warehouse","other"].map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.status} onChange={set("status")}>
                  <option value="active">Active</option>
                  <option value="vip">VIP</option>
                  <option value="prospect">Prospect</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="space-y-1.5"><Label>Bedrooms</Label><Input type="number" min="0" max="20" placeholder="3" value={form.bedrooms} onChange={set("bedrooms")} /></div>
              <div className="space-y-1.5"><Label>Bathrooms</Label><Input type="number" min="0" max="20" placeholder="2" value={form.bathrooms} onChange={set("bathrooms")} /></div>
              <div className="space-y-1.5"><Label>Sqft</Label><Input type="number" min="0" placeholder="250" value={form.squareFootage} onChange={set("squareFootage")} /></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Access & Preferences</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Entry Instructions</Label><Input placeholder="Key under mat" value={form.entryInstructions} onChange={set("entryInstructions")} /></div>
              <div className="space-y-1.5"><Label>Alarm/Gate Code</Label><Input placeholder="1234" value={form.alarmCode} onChange={set("alarmCode")} /></div>
              <div className="space-y-1.5"><Label>Pets</Label><Input placeholder="One golden retriever" value={form.pets} onChange={set("pets")} /></div>
              <div className="space-y-1.5"><Label>Preferred Products</Label><Input placeholder="Eco-friendly only" value={form.preferredProducts} onChange={set("preferredProducts")} /></div>
              <div className="space-y-1.5"><Label>Recurring Schedule</Label>
                <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.recurringSchedule} onChange={set("recurringSchedule")}>
                  <option value="">One-off / Not recurring</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Fortnightly">Fortnightly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div className="space-y-1.5"><Label>Cleaning Preferences</Label><Input placeholder="Focus on kitchen and bathrooms" value={form.cleaningPreferences} onChange={set("cleaningPreferences")} /></div>
              <div className="sm:col-span-2 space-y-1.5"><Label>Special Instructions / Notes</Label><Textarea placeholder="Any additional notes..." value={form.notes} onChange={set("notes")} rows={2} /></div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createCustomer.isPending}>{createCustomer.isPending ? "Saving..." : "Add Customer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CustomersListPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { data: customers, isLoading } = useListCustomers();

  const filtered = customers?.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AddCustomerModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your active client base and their properties.</p>
        </div>
        <Button className="font-semibold shadow-sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Customer
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search customers, addresses..." className="pl-9 bg-card border-border" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {search && <Button variant="ghost" size="sm" onClick={() => setSearch("")}><X className="w-4 h-4" /></Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex gap-4"><Skeleton className="w-12 h-12 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div></div>
              <div className="mt-4 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
            </div>
          ))
        ) : !filtered?.length ? (
          <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl bg-card">
            <UserSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-base font-medium text-foreground">{search ? "No matching customers" : "No customers found"}</p>
            <p className="text-muted-foreground">{search ? "Try a different search." : "Convert a lead or add a customer manually."}</p>
            {!search && <Button variant="outline" className="mt-4" onClick={() => setModalOpen(true)}>Add Customer</Button>}
          </div>
        ) : (
          filtered?.map(customer => (
            <div key={customer.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all relative overflow-hidden">
              {customer.status === "vip" && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-transparent rounded-bl-full -z-10" />}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-lg",
                    customer.status === "vip" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                    customer.status === "inactive" ? "bg-gray-100 text-gray-500" : "bg-primary/10 text-primary border border-primary/10"
                  )}>
                    {customer.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                  </div>
                  <div>
                    <Link href={`/crm/customers/${customer.id}`}>
                      <h3 className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">{customer.name}</h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 uppercase">{customer.serviceType}</Badge>
                      {customer.isRecurring && <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Recurring</Badge>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5 text-sm flex-1">
                <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="w-4 h-4 shrink-0 mt-0.5" /><span className="line-clamp-2">{customer.address || "No address"}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground">{customer.serviceType === "commercial" ? <Building2 className="w-4 h-4" /> : <Home className="w-4 h-4" />}<span>{customer.propertyType || "Standard Property"}</span></div>
              </div>
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <a href={`tel:${customer.phone}`} className="p-1.5 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"><Phone className="w-4 h-4" /></a>
                  <a href={`mailto:${customer.email}`} className="p-1.5 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"><Mail className="w-4 h-4" /></a>
                </div>
                <div className="flex items-center gap-2">
                  {customer.lifetimeValue ? <span className="font-bold text-foreground">${customer.lifetimeValue.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">LTV</span></span> : <span className="text-xs text-muted-foreground">New</span>}
                  <Link href={`/crm/customers/${customer.id}`}><Button variant="ghost" size="sm" className="h-7 px-2"><ArrowRight className="w-3.5 h-3.5" /></Button></Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
