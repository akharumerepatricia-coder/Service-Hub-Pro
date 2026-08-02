import { useState } from "react";
import { Link } from "wouter";
import { useListInvoices, useCreateInvoice, useListCustomers } from "@workspace/api-client-react";
import { Plus, Search, FileText, CheckCircle2, AlertCircle, ArrowRight, X, Trash2 } from "lucide-react";
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

function CreateInvoiceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createInvoice = useCreateInvoice();
  const { data: customers } = useListCustomers();
  const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 14);
  const [form, setForm] = useState({
    customerId: "", taxRate: "10", notes: "",
    dueDate: dueDate.toISOString().split("T")[0],
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
    createInvoice.mutate({
      data: {
        customerId: parseFloat(form.customerId),
        lineItems,
        subtotal,
        taxRate,
        tax,
        total,
        dueDate: form.dueDate,
        notes: form.notes || undefined,
        status: "draft",
        paidAmount: 0,
      } as any,
    }, {
      onSuccess: () => {
        toast({ title: "Invoice created successfully" });
        queryClient.invalidateQueries({ queryKey: ["/invoices"] });
        onClose();
      },
      onError: () => toast({ title: "Failed to create invoice", variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-xl">Create Invoice</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3 space-y-1.5">
              <Label>Customer *</Label>
              <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.customerId} onChange={set("customerId")} required>
                <option value="">Select customer...</option>
                {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={set("dueDate")} />
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
                <span className="col-span-6">Description</span><span className="col-span-2 text-center">Qty</span><span className="col-span-3 text-right">Unit Price</span><span className="col-span-1" />
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <Input className="col-span-6 h-8 text-sm" placeholder="e.g. Standard Clean" value={item.description} onChange={e => setItem(i, "description", e.target.value)} />
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
            <Label>Notes</Label>
            <Textarea placeholder="Payment instructions, notes..." value={form.notes} onChange={set("notes")} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createInvoice.isPending}>{createInvoice.isPending ? "Creating..." : "Create Invoice"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  sent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  overdue: "bg-red-500/10 text-red-600 border-red-500/20",
  cancelled: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
};

export function InvoicesListPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { data: invoices, isLoading } = useListInvoices();

  const filtered = invoices?.filter(inv =>
    !search ||
    inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <CreateInvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Invoices & Billing</h1>
          <p className="text-muted-foreground mt-1">Manage payments, outstanding balances, and financial records.</p>
        </div>
        <Button className="font-semibold shadow-sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Invoice
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search invoice #, customer name..." className="pl-9 bg-card border-border" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {search && <Button variant="ghost" size="sm" onClick={() => setSearch("")}><X className="w-4 h-4" /></Button>}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Invoice Details</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Dates</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}><td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td><td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td><td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td><td className="px-6 py-4"><Skeleton className="h-5 w-16 ml-auto" /></td><td className="px-6 py-4"><Skeleton className="h-6 w-20 ml-auto" /></td><td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td></tr>
              )) : !filtered?.length ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-base font-medium text-foreground">{search ? "No matching invoices" : "No invoices yet"}</p>
                  {!search && <Button variant="outline" className="mt-3" onClick={() => setModalOpen(true)}>Create First Invoice</Button>}
                </td></tr>
              ) : filtered?.map(invoice => (
                <tr key={invoice.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">{invoice.invoiceNumber || `INV-${invoice.id}`}</div>
                    <div className="text-xs text-muted-foreground mt-1">{invoice.jobId ? `Job #${invoice.jobId}` : "Manual Entry"}</div>
                  </td>
                  <td className="px-6 py-4"><div className="font-medium">{invoice.customerName}</div></td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Due: <span className="font-medium text-foreground">{format(parseISO(invoice.dueDate), "MMM d, yyyy")}</span></span>
                      {invoice.status === "paid" && invoice.paymentDate && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Paid {format(parseISO(invoice.paymentDate), "MMM d")}</span>}
                      {invoice.status === "overdue" && <span className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Overdue</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right"><div className="font-bold font-display text-base">${invoice.total.toFixed(2)}</div></td>
                  <td className="px-6 py-4 text-right"><Badge variant="outline" className={cn("uppercase tracking-wider text-[10px] font-bold px-2 py-0.5", STATUS_COLORS[invoice.status] ?? "")}>{invoice.status}</Badge></td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/crm/invoices/${invoice.id}`}>View <ArrowRight className="w-4 h-4 ml-2" /></Link>
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
