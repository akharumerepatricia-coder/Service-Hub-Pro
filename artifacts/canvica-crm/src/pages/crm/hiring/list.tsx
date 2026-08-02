import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, CheckCircle2, AlertCircle, XCircle, Star, Phone, Mail,
  Calendar, Car, Wrench, ChevronDown, UserPlus, Ban, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

// ── Types ──────────────────────────────────────────────────────────────────────
interface JobApplication {
  id: number;
  name: string;
  email: string;
  phone: string;
  yearsExperience: number;
  cleaningTypes: string[];
  availability: string[];
  hasOwnSupplies: boolean;
  hasVehicle: boolean;
  message?: string;
  status: "recommended" | "review" | "not_suitable" | "hired" | "rejected";
  autoScore: number;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  recommended: { label: "Recommended", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800", icon: CheckCircle2 },
  review:       { label: "Review",       color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800", icon: AlertCircle },
  not_suitable: { label: "Not Suitable", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800", icon: XCircle },
  hired:        { label: "Hired",        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800", icon: Star },
  rejected:     { label: "Rejected",     color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700", icon: Ban },
};

const TABS = [
  { key: "all",          label: "All" },
  { key: "recommended",  label: "Recommended" },
  { key: "review",       label: "In Review" },
  { key: "not_suitable", label: "Not Suitable" },
  { key: "hired",        label: "Hired" },
  { key: "rejected",     label: "Rejected" },
];

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.review;
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", meta.color)}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

// ── Hire confirm dialog ────────────────────────────────────────────────────────
function HireDialog({
  application,
  onConfirm,
  onClose,
  loading,
}: {
  application: JobApplication;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Hire {application.name}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will create a <strong>Staff</strong> record for <strong>{application.name}</strong> with role&nbsp;<em>Cleaner</em>.
          You can update their details from the Staff tab at any time.
        </p>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={onConfirm} disabled={loading} className="gap-2">
            <UserPlus className="w-4 h-4" />
            {loading ? "Hiring…" : "Confirm & Hire"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Application detail drawer ──────────────────────────────────────────────────
function DetailDialog({
  application,
  onClose,
  onStatusChange,
  onHire,
  statusLoading,
  hireLoading,
}: {
  application: JobApplication;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onHire: () => void;
  statusLoading: boolean;
  hireLoading: boolean;
}) {
  const STATUS_OPTIONS = ["recommended", "review", "not_suitable", "rejected"];
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-3">
            {application.name}
            <StatusBadge status={application.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <a href={`mailto:${application.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="w-4 h-4 flex-shrink-0" />{application.email}
            </a>
            <a href={`tel:${application.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="w-4 h-4 flex-shrink-0" />{application.phone}
            </a>
          </div>

          <hr className="border-border" />

          {/* Experience */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Experience</p>
              <p className="font-semibold">{application.yearsExperience} yr{application.yearsExperience !== 1 ? "s" : ""}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Auto Score</p>
              <p className="font-semibold">{application.autoScore} pts</p>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              <span>{application.hasVehicle ? "Has vehicle" : "No vehicle"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              <span>{application.hasOwnSupplies ? "Own supplies" : "No own supplies"}</span>
            </div>
          </div>

          {/* Cleaning types */}
          {application.cleaningTypes.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Cleaning Types</p>
              <div className="flex flex-wrap gap-1.5">
                {application.cleaningTypes.map(t => (
                  <span key={t} className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md text-xs capitalize">
                    {t.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          {application.availability.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Availability</p>
              <div className="flex flex-wrap gap-1.5">
                {application.availability.map(a => (
                  <span key={a} className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md text-xs capitalize">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          {application.message && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Message</p>
              <p className="text-sm text-foreground leading-relaxed bg-muted/50 rounded-lg p-3 border border-border">
                {application.message}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            Applied {format(new Date(application.createdAt), "MMMM d, yyyy")}
          </div>
        </div>

        <DialogFooter className="gap-2 flex-wrap pt-2">
          {/* Manual status override */}
          {application.status !== "hired" && (
            <div className="flex items-center gap-2 flex-1">
              <select
                className="h-9 flex-1 rounded-md border border-input bg-background text-sm px-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                defaultValue={application.status}
                onChange={e => onStatusChange(e.target.value)}
                disabled={statusLoading}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>
                    {STATUS_META[s]?.label ?? s}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground -ml-8 pointer-events-none" />
            </div>
          )}

          {application.status !== "hired" && application.status !== "rejected" && application.status !== "not_suitable" && (
            <Button onClick={onHire} disabled={hireLoading} className="gap-2">
              <UserPlus className="w-4 h-4" />
              {hireLoading ? "Hiring…" : "Hire"}
            </Button>
          )}
          {application.status === "hired" && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1.5">✓ Already Hired</Badge>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function HiringHubPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [detailApp, setDetailApp] = useState<JobApplication | null>(null);
  const [hireTarget, setHireTarget] = useState<JobApplication | null>(null);

  // ── Queries ──
  const { data: applications = [], isLoading } = useQuery<JobApplication[]>({
    queryKey: ["/applications", tab],
    queryFn: async () => {
      const url = tab === "all" ? "/api/applications" : `/api/applications?status=${tab}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load applications");
      return res.json();
    },
  });

  // ── Mutations ──
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["/applications"] });
      setDetailApp(null);
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const hireApplicant = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/applications/${id}/hire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to hire");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `${data.employee.name} added to Staff!` });
      queryClient.invalidateQueries({ queryKey: ["/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/employees"] });
      setHireTarget(null);
      setDetailApp(null);
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  // ── Filtered list ──
  const filtered = applications.filter(a =>
    search === "" ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  // ── Counts per tab ──
  const { data: allApps = [] } = useQuery<JobApplication[]>({
    queryKey: ["/applications", "all"],
    queryFn: async () => {
      const res = await fetch("/api/applications");
      if (!res.ok) throw new Error();
      return res.json();
    },
  });
  const counts = TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t.key] = t.key === "all" ? allApps.length : allApps.filter(a => a.status === t.key).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Hiring Hub</h1>
          <p className="text-muted-foreground mt-0.5">Review job applications from your website</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-card border border-border rounded-lg px-4 py-2 text-center">
            <p className="text-2xl font-bold text-green-600">{counts.recommended ?? 0}</p>
            <p className="text-xs text-muted-foreground">Recommended</p>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-2 text-center">
            <p className="text-2xl font-bold text-yellow-600">{counts.review ?? 0}</p>
            <p className="text-xs text-muted-foreground">In Review</p>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-2 text-center">
            <p className="text-2xl font-bold text-blue-600">{counts.hired ?? 0}</p>
            <p className="text-xs text-muted-foreground">Hired</p>
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                tab === t.key
                  ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {(counts[t.key] ?? 0) > 0 && (
                <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] max-w-xs">
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No applications found</p>
          <p className="text-sm mt-1">Applications submitted via the website appear here.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Applicant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Experience</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Types</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Applied</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(app => (
                <tr key={app.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      className="text-left hover:text-primary transition-colors"
                      onClick={() => setDetailApp(app)}
                    >
                      <p className="font-medium text-foreground">{app.name}</p>
                      <p className="text-xs text-muted-foreground">{app.email}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="font-medium">{app.yearsExperience} yr{app.yearsExperience !== 1 ? "s" : ""}</span>
                    <div className="flex gap-2 mt-0.5">
                      {app.hasVehicle && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Car className="w-3 h-3" /> Vehicle</span>}
                      {app.hasOwnSupplies && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Wrench className="w-3 h-3" /> Supplies</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {app.cleaningTypes.slice(0, 2).map(t => (
                        <span key={t} className="text-xs bg-muted px-1.5 py-0.5 rounded capitalize">
                          {t.replace(/_/g, " ")}
                        </span>
                      ))}
                      {app.cleaningTypes.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{app.cleaningTypes.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(app.createdAt), "MMM d, yyyy")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {app.status !== "hired" && app.status !== "rejected" && app.status !== "not_suitable" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 h-7 text-xs"
                          onClick={() => setHireTarget(app)}
                        >
                          <UserPlus className="w-3 h-3" />
                          Hire
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => setDetailApp(app)}
                      >
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail dialog */}
      {detailApp && (
        <DetailDialog
          application={detailApp}
          onClose={() => setDetailApp(null)}
          onStatusChange={(status) => updateStatus.mutate({ id: detailApp.id, status })}
          onHire={() => setHireTarget(detailApp)}
          statusLoading={updateStatus.isPending}
          hireLoading={hireApplicant.isPending}
        />
      )}

      {/* Hire confirm */}
      {hireTarget && (
        <HireDialog
          application={hireTarget}
          onConfirm={() => hireApplicant.mutate(hireTarget.id)}
          onClose={() => setHireTarget(null)}
          loading={hireApplicant.isPending}
        />
      )}
    </div>
  );
}
