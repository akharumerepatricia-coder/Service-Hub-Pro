import { useState } from "react";
import { Link } from "wouter";
import { 
  useListInvoices
} from "@workspace/api-client-react";
import { 
  Plus, Search, Filter, FileText, CheckCircle2, AlertCircle, ArrowRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function InvoicesListPage() {
  const [search, setSearch] = useState("");
  const { data: invoices, isLoading } = useListInvoices();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'sent': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'paid': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'overdue': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'cancelled': return 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20 text-decoration-line-through';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Invoices & Billing</h1>
          <p className="text-muted-foreground mt-1">Manage payments, outstanding balances, and financial records.</p>
        </div>
        <Button className="font-semibold shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Create Invoice
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search invoice #, customer name..." 
            className="pl-9 bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="bg-card">
          <Filter className="w-4 h-4 mr-2" /> Filter
        </Button>
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
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : invoices?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-base font-medium text-foreground">No invoices found</p>
                    <p>Create an invoice from a completed job.</p>
                  </td>
                </tr>
              ) : (
                invoices?.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{invoice.invoiceNumber || `INV-${invoice.id}`}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {invoice.jobId ? `Job #${invoice.jobId}` : 'Manual Entry'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{invoice.customerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Due: <span className="font-medium text-foreground">{format(parseISO(invoice.dueDate), 'MMM d, yyyy')}</span></span>
                        {invoice.status === 'paid' && invoice.paymentDate && (
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Paid {format(parseISO(invoice.paymentDate), 'MMM d')}
                          </span>
                        )}
                        {invoice.status === 'overdue' && (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold font-display text-base">${invoice.total.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant="outline" className={cn("uppercase tracking-wider text-[10px] font-bold px-2 py-0.5", getStatusColor(invoice.status))}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/crm/invoices/${invoice.id}`}>
                          View <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
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