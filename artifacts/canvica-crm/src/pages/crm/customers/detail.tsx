import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  useGetCustomer,
  getGetCustomerQueryKey
} from "@workspace/api-client-react";
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, Briefcase, 
  Home, Building2, ChevronRight, MessageSquare, Star, FileText,
  Bot, ShieldAlert, KeyRound, Sparkles,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";

export function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customerId = Number(params.id);
  const { data: customer, isLoading } = useGetCustomer(customerId, { 
    query: { enabled: !!customerId, queryKey: getGetCustomerQueryKey(customerId) } 
  });

  if (isLoading) {
    return <div className="space-y-6 p-6"><Skeleton className="h-48 w-full rounded-xl" /><div className="grid grid-cols-3 gap-6"><Skeleton className="col-span-2 h-96 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></div></div>;
  }

  if (!customer) {
    return <div className="py-12 text-center text-muted-foreground">Customer not found.</div>;
  }

  return (
    <div className="space-y-6 pb-12 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link href="/crm/customers" className="hover:text-primary transition-colors">Customers</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">{customer.name}</span>
      </div>

      {/* Hero Banner */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden relative">
        {customer.status === 'vip' && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-transparent rounded-bl-full -z-10" />
        )}
        <div className="px-8 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-24 h-24 rounded-full flex flex-col items-center justify-center font-display shadow-xl border-4",
              customer.status === 'vip' ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white border-white dark:border-zinc-900" :
              "bg-primary text-white border-white dark:border-zinc-900"
            )}>
              <span className="font-bold text-4xl">{customer.name.split(' ').map(n=>n[0]).join('').substring(0,2)}</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-display font-bold text-foreground">{customer.name}</h1>
                {customer.status === 'vip' && <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent"><Star className="w-3 h-3 mr-1 fill-white" /> VIP</Badge>}
                {customer.isRecurring && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Recurring</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-muted-foreground">
                <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Mail className="w-4 h-4" /> {customer.email}
                </a>
                <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Phone className="w-4 h-4" /> {customer.phone}
                </a>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {customer.address}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-4 min-w-[200px]">
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Lifetime Value</p>
              <p className="text-3xl font-display font-bold text-primary">${customer.lifetimeValue?.toLocaleString() || '0'}</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button className="flex-1 shadow-sm"><Plus className="w-4 h-4 mr-2" /> New Job</Button>
              <Button variant="outline" className="flex-1"><FileText className="w-4 h-4 mr-2" /> Quote</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Col: Property & AI */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* AI Summary */}
          {customer.aiSummary && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-white p-2 rounded-bl-xl">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-lg text-primary mb-3">AI Intelligence Summary</h3>
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                {customer.aiSummary}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property Details */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-6">
              <h3 className="font-display font-semibold text-lg mb-5 flex items-center gap-2">
                {customer.serviceType === 'commercial' ? <Building2 className="w-5 h-5 text-blue-500" /> : <Home className="w-5 h-5 text-blue-500" />}
                Property Details
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Type</p>
                    <p className="font-bold text-foreground">{customer.propertyType || 'N/A'}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Size</p>
                    <p className="font-bold text-foreground">{customer.squareFootage ? `${customer.squareFootage} sq ft` : 'N/A'}</p>
                  </div>
                </div>

                {customer.serviceType === 'residential' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Bedrooms</span>
                      <span className="font-semibold">{customer.bedrooms ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">Bathrooms</span>
                      <span className="font-semibold">{customer.bathrooms ?? 'N/A'}</span>
                    </div>
                  </div>
                )}
                
                {customer.pets && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm font-medium text-amber-600 mb-1 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" /> Pets on Property</p>
                    <p className="text-sm">{customer.pets}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Access & Preferences */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-6">
              <h3 className="font-display font-semibold text-lg mb-5 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-500" /> Access & Prefs
              </h3>
              
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Entry Instructions</p>
                  <p className="text-sm font-medium bg-muted/50 p-3 rounded-lg border border-border/50">{customer.entryInstructions || 'None provided. Contact customer upon arrival.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Alarm Code</p>
                    <div className="font-mono font-bold tracking-widest text-lg px-3 py-1 bg-zinc-900 text-emerald-400 rounded-md inline-block">
                      {customer.alarmCode || '----'}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Gate Code</p>
                    <div className="font-mono font-bold tracking-widest text-lg px-3 py-1 bg-zinc-900 text-emerald-400 rounded-md inline-block">
                      {customer.gateCode || '----'}
                    </div>
                  </div>
                </div>

                {customer.preferredProducts && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-primary" /> Required Products</p>
                    <p className="text-sm font-medium">{customer.preferredProducts}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Jobs Table */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/10">
              <h3 className="font-display font-semibold text-lg">Recent Service History</h3>
              <Button variant="ghost" size="sm" asChild><Link href="/crm/jobs">View All</Link></Button>
            </div>
            <div className="p-0">
              {customer.recentJobs && customer.recentJobs.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Service</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customer.recentJobs.map(job => (
                      <tr key={job.id} className="hover:bg-muted/30">
                        <td className="px-6 py-3 font-medium">{format(parseISO(job.scheduledDate), 'MMM d, yyyy')}</td>
                        <td className="px-6 py-3 capitalize">{job.cleaningType.replace('_', ' ')}</td>
                        <td className="px-6 py-3"><Badge variant="outline" className="text-[10px] py-0 px-1">{job.status}</Badge></td>
                        <td className="px-6 py-3 text-right font-bold">${job.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">No jobs recorded yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Timeline & Finances */}
        <div className="space-y-6">
          
          {/* Outstanding Financials */}
          {customer.openInvoices && customer.openInvoices.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl shadow-sm p-6">
              <h3 className="font-display font-semibold text-lg text-red-600 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Outstanding Invoices
              </h3>
              <div className="space-y-3">
                {customer.openInvoices.map(inv => (
                  <Link key={inv.id} href={`/crm/invoices/${inv.id}`}>
                    <div className="flex items-center justify-between p-3 bg-card border border-red-500/30 rounded-lg hover:border-red-500/60 transition-colors cursor-pointer group">
                      <div>
                        <p className="font-bold text-sm text-foreground group-hover:text-red-600 transition-colors">{inv.invoiceNumber || `INV-${inv.id}`}</p>
                        <p className="text-xs text-red-600/80 font-medium">Due: {format(parseISO(inv.dueDate), 'MMM d')}</p>
                      </div>
                      <span className="font-display font-bold text-lg text-red-600">${inv.total.toFixed(2)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col h-[600px]">
            <h3 className="font-display font-semibold text-lg mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Activity Timeline
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {customer.recentCommunications && customer.recentCommunications.length > 0 ? (
                customer.recentCommunications.map((comm, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border border-card bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      {comm.type === 'email' ? <Mail className="w-4 h-4" /> : 
                       comm.type === 'phone' ? <Phone className="w-4 h-4" /> : 
                       <FileText className="w-4 h-4" />}
                    </div>
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-muted/30 p-4 rounded-xl border border-border/50 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">{comm.type}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{format(parseISO(comm.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                      <p className="font-medium text-sm text-foreground mb-1">{comm.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{comm.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="relative z-10 p-8 text-center bg-card">
                  <p className="text-sm text-muted-foreground">No recent activity.</p>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-border mt-4">
              <Button variant="outline" className="w-full"><Plus className="w-4 h-4 mr-2" /> Log Note or Call</Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Need to import cn and AlertCircle at top, wait I did. Add AlertCircle to lucide-react import
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";