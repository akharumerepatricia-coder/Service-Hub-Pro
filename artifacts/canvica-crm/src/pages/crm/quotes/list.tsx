import { useState } from "react";
import { Link } from "wouter";
import { 
  useListQuotes
} from "@workspace/api-client-react";
import { 
  Plus, Search, Filter, FileText, ArrowRight, CheckCircle2, XCircle, Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function QuotesListPage() {
  const [search, setSearch] = useState("");
  const { data: quotes, isLoading } = useListQuotes();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'sent': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'accepted': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'expired': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  // Pipeline summary calculation
  const summary = {
    total: quotes?.length || 0,
    draft: quotes?.filter(q => q.status === 'draft').length || 0,
    sent: quotes?.filter(q => q.status === 'sent').length || 0,
    accepted: quotes?.filter(q => q.status === 'accepted').length || 0,
    rejected: quotes?.filter(q => q.status === 'rejected').length || 0,
    pipelineValue: quotes?.filter(q => ['draft', 'sent'].includes(q.status)).reduce((sum, q) => sum + q.total, 0) || 0
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Quotes & Proposals</h1>
          <p className="text-muted-foreground mt-1">Manage cleaning service estimates and convert them to jobs.</p>
        </div>
        <Button className="font-semibold shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> New Quote
        </Button>
      </div>

      {/* Pipeline Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="text-center p-2 border-r border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Quotes</p>
          <p className="text-2xl font-bold font-display mt-1">{summary.total}</p>
        </div>
        <div className="text-center p-2 border-r border-border">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Drafts</p>
          <p className="text-2xl font-bold font-display mt-1">{summary.draft}</p>
        </div>
        <div className="text-center p-2 border-r border-border">
          <p className="text-xs text-blue-600 uppercase tracking-wider font-semibold">Sent (Pending)</p>
          <p className="text-2xl font-bold font-display mt-1">{summary.sent}</p>
        </div>
        <div className="text-center p-2 border-r border-border">
          <p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold">Accepted</p>
          <p className="text-2xl font-bold font-display mt-1">{summary.accepted}</p>
        </div>
        <div className="text-center p-2 border-r md:border-r-0 border-border">
          <p className="text-xs text-red-600 uppercase tracking-wider font-semibold">Rejected</p>
          <p className="text-2xl font-bold font-display mt-1">{summary.rejected}</p>
        </div>
        <div className="text-center p-2 md:border-l border-border bg-muted/50 rounded-r-lg">
          <p className="text-xs text-foreground uppercase tracking-wider font-semibold">Pipeline Value</p>
          <p className="text-2xl font-bold font-display mt-1 text-primary">${summary.pipelineValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search quotes by customer name..." 
            className="pl-9 bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="bg-card">
          <Filter className="w-4 h-4 mr-2" /> Filter Status
        </Button>
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
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : quotes?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-base font-medium text-foreground">No quotes found</p>
                    <p>Create a new quote to start proposing services.</p>
                  </td>
                </tr>
              ) : (
                quotes?.map((quote) => (
                  <tr key={quote.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">QT-{quote.id.toString().padStart(4, '0')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{quote.customerName}</div>
                      {quote.customerEmail && <div className="text-xs text-muted-foreground">{quote.customerEmail}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Created: {format(parseISO(quote.createdAt), 'MMM d')}</span>
                        {quote.validUntil && (
                          <span className="text-xs font-medium text-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Valid til: {format(parseISO(quote.validUntil), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold font-display text-base">${quote.total.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant="outline" className={cn("uppercase tracking-wider text-[10px] font-bold px-2 py-0.5", getStatusColor(quote.status))}>
                        {quote.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/crm/quotes/${quote.id}`}>
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