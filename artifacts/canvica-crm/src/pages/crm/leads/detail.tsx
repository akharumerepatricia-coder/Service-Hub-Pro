import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  useGetLead,
  useConvertLead,
  useUpdateLead,
  getGetLeadQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, Briefcase, 
  Home, Building2, ChevronRight, UserPlus, FileEdit, Trash2, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function LeadDetailPage({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const leadId = Number(params.id);
  
  const { data: lead, isLoading } = useGetLead(leadId, { 
    query: { enabled: !!leadId, queryKey: getGetLeadQueryKey(leadId) } 
  });
  
  const convertLead = useConvertLead();
  const updateLead = useUpdateLead();

  const [notes, setNotes] = useState("");

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'new': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'contacted': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'quoted': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'won': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'lost': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const handleConvert = () => {
    convertLead.mutate({ leadId }, {
      onSuccess: (customer) => {
        toast({ title: "Lead Converted Successfully", description: "Customer profile created." });
        setLocation(`/crm/customers/${customer.id}`);
      },
      onError: () => {
        toast({ title: "Conversion Failed", variant: "destructive" });
      }
    });
  };

  const handleStatusUpdate = (status: any) => {
    updateLead.mutate({ leadId, data: { status } }, {
      onSuccess: (updated) => {
        toast({ title: "Status Updated" });
        queryClient.setQueryData(getGetLeadQueryKey(leadId), updated);
      }
    });
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full rounded-xl" /><Skeleton className="h-64 w-full rounded-xl" /></div>;
  }

  if (!lead) {
    return <div className="py-12 text-center">Lead not found.</div>;
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link href="/crm/leads" className="hover:text-primary transition-colors">Leads</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">{lead.name}</span>
      </div>

      {/* Header Profile */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-black/5 dark:bg-white/5 px-6 py-8 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-primary text-white flex flex-col items-center justify-center font-display shadow-lg border-4 border-card">
              <span className="font-bold text-3xl">{lead.name.split(' ').map(n=>n[0]).join('').substring(0,2)}</span>
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-1">{lead.name}</h1>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn("uppercase tracking-wider text-[10px] font-bold px-2.5 py-0.5", getStatusColor(lead.status))}>
                  {lead.status}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Added {format(parseISO(lead.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {lead.status !== 'won' && (
              <Button onClick={handleConvert} className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Convert to Customer
              </Button>
            )}
            <Button variant="outline">
              <FileEdit className="w-4 h-4 mr-2" /> Edit Details
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
          <a href={`mailto:${lead.email}`} className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Email</p>
              <p className="font-medium truncate">{lead.email}</p>
            </div>
          </a>
          <a href={`tel:${lead.phone}`} className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Phone</p>
              <p className="font-medium truncate">{lead.phone}</p>
            </div>
          </a>
          <div className="p-4 flex items-center gap-3 col-span-1 md:col-span-2">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Location</p>
              <p className="font-medium truncate">{lead.address || 'Address not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Lead Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-display font-semibold text-lg mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> Request Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Service Type</p>
                <div className="flex items-center gap-2 font-medium text-foreground capitalize">
                  {lead.serviceType === 'commercial' ? <Building2 className="w-4 h-4 text-primary" /> : <Home className="w-4 h-4 text-primary" />}
                  {lead.serviceType}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Property Type</p>
                <p className="font-medium text-foreground">{lead.propertyType || 'Not specified'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Cleaning Package</p>
                <p className="font-medium text-foreground capitalize">{lead.cleaningType?.replace('_', ' ') || 'Not specified'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Frequency</p>
                <p className="font-medium text-foreground capitalize">{lead.frequency?.replace('_', ' ') || 'One-time'}</p>
              </div>

              <div className="sm:col-span-2 pt-4 border-t border-border flex gap-8">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Property Size</p>
                  <p className="font-bold text-lg text-foreground">{lead.squareFootage ? `${lead.squareFootage} sq ft` : '--'}</p>
                </div>
                {lead.serviceType === 'residential' && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Bedrooms</p>
                      <p className="font-bold text-lg text-foreground">{lead.bedrooms ?? '--'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Bathrooms</p>
                      <p className="font-bold text-lg text-foreground">{lead.bathrooms ?? '--'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {lead.message && (
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground mb-3">Customer Message</p>
                <div className="bg-muted/50 p-4 rounded-lg text-sm italic text-foreground border border-border/50">
                  "{lead.message}"
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Actions & Pipeline */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Pipeline Status</h3>
            <div className="flex flex-col gap-2">
              {['new', 'contacted', 'quoted', 'won', 'lost'].map(status => (
                <Button 
                  key={status}
                  variant={lead.status === status ? "default" : "outline"} 
                  className={cn("justify-start capitalize w-full", lead.status === status && "pointer-events-none")}
                  onClick={() => lead.status !== status && handleStatusUpdate(status)}
                >
                  {status === lead.status && <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {status}
                </Button>
              ))}
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-foreground">Estimated Value</h4>
              {lead.estimatedValue ? (
                <div className="text-3xl font-display font-bold text-primary">${lead.estimatedValue.toLocaleString()}</div>
              ) : (
                <Button variant="secondary" className="w-full">Calculate Estimate</Button>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Internal Notes</h3>
            <Textarea 
              placeholder="Add details about conversations, quotes sent, etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="min-h-[120px] mb-3 resize-none bg-muted/30"
            />
            <Button className="w-full">Save Note</Button>
          </div>
        </div>

      </div>
    </div>
  );
}