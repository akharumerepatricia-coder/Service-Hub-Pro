import { useState } from "react";
import { Link } from "wouter";
import { 
  useListLeads,
  useGetLeadStats
} from "@workspace/api-client-react";
import { 
  Plus, Search, Filter, Mail, Phone, Calendar, ArrowRight, UserPlus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LeadsListPage() {
  const [search, setSearch] = useState("");
  
  const { data: leads, isLoading } = useListLeads();
  const { data: stats } = useGetLeadStats();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'new': return 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20';
      case 'contacted': return 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20';
      case 'quoted': return 'bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20';
      case 'won': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20';
      case 'lost': return 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Leads Pipeline</h1>
          <p className="text-muted-foreground mt-1">Manage inquiries, quotes, and prospects.</p>
        </div>
        <Button className="font-semibold shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Lead Manually
        </Button>
      </div>

      {/* Stats Banner */}
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
        <div className="text-center p-2 border-r md:border-r-0 border-border">
          <p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold">Won</p>
          <p className="text-2xl font-bold font-display mt-1">{stats?.won || 0}</p>
        </div>
        <div className="text-center p-2 md:border-l border-border bg-muted/50 rounded-r-lg">
          <p className="text-xs text-foreground uppercase tracking-wider font-semibold">Conversion</p>
          <p className="text-2xl font-bold font-display mt-1 text-primary">{stats?.conversionRate || 0}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search leads by name, email, phone..." 
            className="pl-9 bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="bg-card">
          <Filter className="w-4 h-4 mr-2" /> Filter
        </Button>
      </div>

      {/* Table */}
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
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : leads?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <UserPlus className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-base font-medium text-foreground">No leads found</p>
                    <p>When someone requests a quote, it will appear here.</p>
                  </td>
                </tr>
              ) : (
                leads?.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{lead.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" /> {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                      </div>
                      {lead.estimatedValue && (
                        <div className="text-xs font-medium text-emerald-600 mt-1">
                          Est: ${lead.estimatedValue.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="capitalize font-medium">{lead.serviceType}</div>
                      {lead.cleaningType && (
                        <div className="text-xs text-muted-foreground capitalize mt-1">
                          {lead.cleaningType.replace('_', ' ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <a href={`mailto:${lead.email}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5">
                          <Mail className="w-3 h-3" /> {lead.email}
                        </a>
                        <a href={`tel:${lead.phone}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> {lead.phone}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={cn("uppercase tracking-wider text-[10px] font-bold px-2 py-0.5", getStatusColor(lead.status))}>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/crm/leads/${lead.id}`}>
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