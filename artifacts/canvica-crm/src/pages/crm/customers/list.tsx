import { useState } from "react";
import { Link } from "wouter";
import { 
  useListCustomers 
} from "@workspace/api-client-react";
import { 
  Plus, Search, Filter, MapPin, Building2, Home, Star, ArrowRight, UserSquare, Phone, Mail
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function CustomersListPage() {
  const [search, setSearch] = useState("");
  const { data: customers, isLoading } = useListCustomers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your active client base and their properties.</p>
        </div>
        <Button className="font-semibold shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Customer
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search customers, addresses..." 
            className="pl-9 bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="bg-card">
          <Filter className="w-4 h-4 mr-2" /> Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))
        ) : customers?.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl bg-card">
            <UserSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-base font-medium text-foreground">No customers found</p>
            <p className="text-muted-foreground">Convert a lead or add a customer manually to see them here.</p>
            <Button variant="outline" className="mt-4">Add Customer</Button>
          </div>
        ) : (
          customers?.map((customer) => (
            <Link key={customer.id} href={`/crm/customers/${customer.id}`}>
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group h-full flex flex-col relative overflow-hidden">
                {customer.status === 'vip' && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-transparent rounded-bl-full -z-10" />
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-lg",
                      customer.status === 'vip' ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                      customer.status === 'inactive' ? "bg-gray-100 text-gray-500" :
                      "bg-primary/10 text-primary border border-primary/10"
                    )}>
                      {customer.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{customer.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 uppercase">
                          {customer.serviceType}
                        </Badge>
                        {customer.isRecurring && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            Recurring
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm flex-1">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{customer.address || 'No address provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {customer.serviceType === 'commercial' ? <Building2 className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                    <span>{customer.propertyType || 'Standard Property'}</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <a href={`tel:${customer.phone}`} onClick={e => e.stopPropagation()} className="p-1.5 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors">
                      <Phone className="w-4 h-4" />
                    </a>
                    <a href={`mailto:${customer.email}`} onClick={e => e.stopPropagation()} className="p-1.5 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors">
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    {customer.lifetimeValue ? (
                      <span className="font-bold text-foreground">${customer.lifetimeValue.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">LTV</span></span>
                    ) : (
                      <span className="text-xs text-muted-foreground">New Customer</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}