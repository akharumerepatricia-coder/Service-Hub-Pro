import { useState } from "react";
import { Link } from "wouter";
import { useListQuotes, useCreateQuote, useListCustomers } from "@workspace/api-client-react";
import { Plus, Search, FileText, ArrowRight, Clock, X, Trash2 } from "lucide-react";
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

interface LineItem { description: string; quantity: number; unitPrice: number; }

function NewQuoteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createQuote = useCreateQuote();
  const { data: customers } = useListCustomers();
  const futureDate = new Date(); futureDate.setDate(futureDate.getDate() + 30);
  const [form, setForm] = useState({
    customerId: "", notes: "", taxRate: "10",
    validUntil: futureDate.toISOString().split("T")[0],
  });
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const setItem = (i: number, k: keyof LineItem, v: string) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: k === "description" ? v : parseFloat(v) || 0 } : item));

  const addItem = () => setItems(prev => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const taxRate = parseFloat(form.taxRate) || 10;
  const lineItems = items.map(li => ({ ...li, total: li.quantity * li.unitPrice }));
  const subtotal = lineItems.reduce((s, li) => s + li.total, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId) { toast({ title: "Please select a customer", variant: "destructive" }); return; }
    if (items.some(li => !li.description)) { toast({ title: "All line items need a description", variant: "destructive" }); return; }
    createQuote.mutate({
      data: {
        customerId: parseFloat(form.customerId),
        lineItems,
        subtotal,
        taxRate,
        tax,
        total,
        notes: form.notes || undefined,
        validUntil: form.validUntil,
        status: "draft",
      } as any,
    }, {
      onSuccess: () => {
        toast({ title: "Quote created successfully" });
        queryClient.invalidateQueries({ queryKey: ["/quotes"] });
        onClose();
      },
      onError: () => toast({ title: "Failed to create quote", variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-xl">New Quote</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Customer *</Label>
              <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.customerId} onChange={set("customerId")} required>
                <option value="">Select customer...</option>
                {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Valid Until</Label>
              <Input type="date" value={form.validUntil} onChange={set("validUntil")} />
            </div>
            <div className="space-y-1.5">
              <Label>Tax Rate (%)</Label>
              <Input type="number" min="0" max="100" step="0.5" value={form.taxRate} onChange={set("taxRate")} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Line Items</p>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-3.5 h-3.5 mr-1" />Add Item</Button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                <span className="col-span-6">Description</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-3 text-right">Unit Price</span>
                <span className="col-span-1" />
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <Input className="col-span-6 h-8 text-sm" placeholder="e.g. Deep Clean – 3BR House" value={item.description} onChange={e => setItem(i, "description", e.target.value)} />
                  <Input className="col-span-2 h-8 text-sm text-center" type="number" min="1" value={item.quantity} onChange={e => setItem(i, "quantity", e.target.value)} />
                  <Input className="col-span-3 h-8 text-sm text-right" type="number" min="0" step="0.01" placeholder="0.00" value={item.unitPrice || ""} onChange={e => setItem(i, "unitPrice", e.target.value)} />
                  <Button type="button" variant="ghost" size="sm" className="col-span-1 h-8 w-8 p-0" onClick={() => items.length > 1 && removeItem(i)} disabled={items.length === 1}>
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm space-y-1">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>GST ({taxRate}%)</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-foreground border-t border-border pt-1 mt-1"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes / Terms</Label>
            <Textarea placeholder="Any notes, inclusions, exclusions or terms..." value={form.notes} onChange={set("notes")} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createQuote.isPending}>{createQuote.isPending ? "Creating..." : "Create Quote"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  sent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  accepted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  expired: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export function QuotesListPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { data: quotes, isLoading } = useListQuotes();

  const filtered = quotes?.filter(q =>
    !search || q.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  const summary = {
    total: quotes?.length || 0,
    draft: quotes?.filter(q => q.status === "draft").length || 0,
    sent: quotes?.filter(q => q.status === "sent").length || 0,
    accepted: quotes?.filter(q => q.status === "accepted").length || 0,
    rejected: quotes?.filter(q => q.status === "rejected").length || 0,
    pipelineValue: quotes?.filter(q => ["draft","sent"].includes(q.status)).reduce((s, q) => s + q.total, 0) || 0,
  };

  return (
    <div className="space-y-6">
      <NewQuoteModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Quotes & Proposals</h1>
          <p className="text-muted-foreground mt-1">Manage cleaning service estimates and convert them to jobs.</p>
        </div>
        <Button className="font-semibold shadow-sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Quote
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="text-center p-2 border-r border-border"><p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total</p><p className="text-2xl font-bold font-display mt-1">{summary.total}</p></div>
        <div className="text-center p-2 border-r border-border"><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Drafts</p><p className="text-2xl font-bold font-display mt-1">{summary.draft}</p></div>
        <div className="text-center p-2 border-r border-border"><p className="text-xs text-blue-600 uppercase tracking-wider font-semibold">Sent</p><p className="text-2xl font-bold font-display mt-1">{summary.sent}</p></div>
        <div className="text-center p-2 border-r border-border"><p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold">Accepted</p><p className="text-2xl font-bold font-display mt-1">{summary.accepted}</p></div>
        <div className="text-center p-2 border-r border-border"><p className="text-xs text-red-600 uppercase tracking-wider font-semibold">Rejected</p><p className="text-2xl font-bold font-display mt-1">{summary.rejected}</p></div>
        <div className="text-center p-2 bg-muted/50 rounded-r-lg"><p className="text-xs text-foreground uppercase tracking-wider font-semibold">Pipeline</p><p className="text-2xl font-bold font-display mt-1 text-primary">${summary.pipelineValue.toLocaleString()}</p></div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search quotes by customer name..." className="pl-9 bg-card border-border" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {search && <Button variant="ghost" size="sm" onClick={() => setSearch("")}><X className="w-4 h-4" /></Button>}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Quote ID</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Created / Expiry</th>
                <th className="px-6 py-4 font-semibold text-right">Value</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}><td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td><td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td><td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td><td className="px-6 py-4"><Skeleton className="h-5 w-16 ml-auto" /></td><td className="px-6 py-4"><Skeleton className="h-6 w-20 ml-auto" /></td><td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td></tr>
              )) : !filtered?.length ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-base font-medium text-foreground">{search ? "No matching quotes" : "No quotes yet"}</p>
                  {!search && <Button variant="outline" className="mt-3" onClick={() => setModalOpen(true)}>Create First Quote</Button>}
                </td></tr>
              ) : filtered?.map(quote => (
                <tr key={quote.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4"><div className="font-bold text-foreground">QT-{String(quote.id).padStart(4, "0")}</div></td>
                  <td className="px-6 py-4"><div className="font-medium">{quote.customerName}</div>{quote.customerEmail && <div className="text-xs text-muted-foreground">{quote.customerEmail}</div>}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Created: {format(parseISO(quote.createdAt), "MMM d")}</span>
                      {quote.validUntil && <span className="text-xs font-medium text-foreground flex items-center gap-1"><Clock className="w-3 h-3" />Valid til: {format(parseISO(quote.validUntil), "MMM d")}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right"><div className="font-bold font-display text-base">${quote.total.toFixed(2)}</div></td>
                  <td className="px-6 py-4 text-right"><Badge variant="outline" className={cn("uppercase tracking-wider text-[10px] font-bold px-2 py-0.5", STATUS_COLORS[quote.status] ?? "")}>{quote.status}</Badge></td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/crm/quotes/${quote.id}`}>View <ArrowRight className="w-4 h-4 ml-2" /></Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
