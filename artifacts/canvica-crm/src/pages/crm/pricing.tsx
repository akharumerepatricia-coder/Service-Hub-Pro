import { useState, useEffect } from "react";
import { Tag, Save, RefreshCw, DollarSign, Percent, Home, Building2, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface PricingSettings {
  priceStandard: number;
  priceDeep: number;
  priceMoveInOut: number;
  pricePostConstruction: number;
  priceRecurring: number;
  ratePerBedroom: number;
  ratePerBathroom: number;
  rateSqftOver500: number;
  extraOven: number;
  extraFridge: number;
  extraWindows: number;
  extraLaundry: number;
  extraBlinds: number;
  extraGarage: number;
  extraCarpetSteam: number;
  extraUpholstery: number;
  discountWeeklyPercent: number;
  discountBiweeklyPercent: number;
  discountMonthlyPercent: number;
  taxRatePercent: number;
}

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function PriceField({
  label,
  value,
  onChange,
  prefix = "$",
  suffix,
  description,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-muted-foreground text-sm font-medium select-none">{prefix}</span>
        )}
        <Input
          type="number"
          min={0}
          step={prefix === "$" ? 1 : 0.01}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={prefix ? "pl-7" : suffix ? "pr-8" : ""}
        />
        {suffix && (
          <span className="absolute right-3 text-muted-foreground text-sm font-medium select-none">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, badge, children }: { title: string; icon: React.ElementType; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-base">{title}</h3>
        </div>
        {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {children}
      </div>
    </div>
  );
}

export function PricingPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState<PricingSettings>({
    priceStandard: 120,
    priceDeep: 220,
    priceMoveInOut: 350,
    pricePostConstruction: 450,
    priceRecurring: 100,
    ratePerBedroom: 25,
    ratePerBathroom: 20,
    rateSqftOver500: 0.08,
    extraOven: 40,
    extraFridge: 35,
    extraWindows: 60,
    extraLaundry: 30,
    extraBlinds: 45,
    extraGarage: 80,
    extraCarpetSteam: 120,
    extraUpholstery: 90,
    discountWeeklyPercent: 20,
    discountBiweeklyPercent: 15,
    discountMonthlyPercent: 10,
    taxRatePercent: 10,
  });

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/pricing`);
      if (!res.ok) throw new Error("Failed to load pricing");
      const data = await res.json();
      setForm({
        priceStandard: data.priceStandard,
        priceDeep: data.priceDeep,
        priceMoveInOut: data.priceMoveInOut,
        pricePostConstruction: data.pricePostConstruction,
        priceRecurring: data.priceRecurring,
        ratePerBedroom: data.ratePerBedroom,
        ratePerBathroom: data.ratePerBathroom,
        rateSqftOver500: data.rateSqftOver500,
        extraOven: data.extraOven,
        extraFridge: data.extraFridge,
        extraWindows: data.extraWindows,
        extraLaundry: data.extraLaundry,
        extraBlinds: data.extraBlinds,
        extraGarage: data.extraGarage,
        extraCarpetSteam: data.extraCarpetSteam,
        extraUpholstery: data.extraUpholstery,
        discountWeeklyPercent: data.discountWeeklyPercent,
        discountBiweeklyPercent: data.discountBiweeklyPercent,
        discountMonthlyPercent: data.discountMonthlyPercent,
        taxRatePercent: data.taxRatePercent,
      });
      setDirty(false);
    } catch {
      toast({ title: "Failed to load pricing", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPricing(); }, []);

  const set = (key: keyof PricingSettings) => (v: number) => {
    setForm(f => ({ ...f, [key]: v }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      setDirty(false);
      toast({ title: "Pricing saved", description: "Changes will reflect on the booking calculator immediately." });
    } catch {
      toast({ title: "Failed to save pricing", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Live preview calculation
  const previewTotal = (() => {
    const base = form.priceStandard + 3 * form.ratePerBedroom + 2 * form.ratePerBathroom;
    const subtotal = base * (1 - form.discountMonthlyPercent / 100);
    return subtotal * (1 + form.taxRatePercent / 100);
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight flex items-center gap-3">
            <Tag className="w-7 h-7 text-primary" /> Pricing Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Adjust service prices, add-ons, and discounts. Changes reflect on the public booking calculator instantly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">Unsaved changes</Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchPricing} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Reset
          </Button>
          <Button onClick={handleSave} disabled={saving || !dirty} className="gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Live preview banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="font-medium text-sm text-foreground">Live Quote Preview</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Based on a standard clean, 3 bed / 2 bath, monthly recurring (GST inclusive)
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-display font-bold text-primary">${previewTotal.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">estimated total</p>
        </div>
      </div>

      {/* Base Prices */}
      <SectionCard title="Base Service Prices" icon={Home} badge="Reflects on calculator">
        <PriceField label="Standard Clean" value={form.priceStandard} onChange={set("priceStandard")} description="Routine maintenance clean" />
        <PriceField label="Deep Clean" value={form.priceDeep} onChange={set("priceDeep")} description="Thorough top-to-bottom clean" />
        <PriceField label="Move In / Move Out" value={form.priceMoveInOut} onChange={set("priceMoveInOut")} description="Full property clean for moving" />
        <PriceField label="Post-Construction" value={form.pricePostConstruction} onChange={set("pricePostConstruction")} description="After renovation / build" />
        <PriceField label="Recurring Base" value={form.priceRecurring} onChange={set("priceRecurring")} description="Starting price for recurring plans" />
      </SectionCard>

      {/* Per-Unit Rates */}
      <SectionCard title="Per-Unit Rates" icon={Building2} badge="Added to base price">
        <PriceField label="Per Bedroom" value={form.ratePerBedroom} onChange={set("ratePerBedroom")} description="Added per bedroom" />
        <PriceField label="Per Bathroom" value={form.ratePerBathroom} onChange={set("ratePerBathroom")} description="Added per bathroom" />
        <PriceField label="Per sqft over 500" value={form.rateSqftOver500} onChange={set("rateSqftOver500")} description="Rate applied to sqft above 500" />
      </SectionCard>

      {/* Extras */}
      <SectionCard title="Optional Extras" icon={Wrench} badge="Customer add-ons">
        <PriceField label="Oven Clean" value={form.extraOven} onChange={set("extraOven")} />
        <PriceField label="Fridge Clean" value={form.extraFridge} onChange={set("extraFridge")} />
        <PriceField label="Window Clean" value={form.extraWindows} onChange={set("extraWindows")} />
        <PriceField label="Laundry" value={form.extraLaundry} onChange={set("extraLaundry")} />
        <PriceField label="Blinds Clean" value={form.extraBlinds} onChange={set("extraBlinds")} />
        <PriceField label="Garage Clean" value={form.extraGarage} onChange={set("extraGarage")} />
        <PriceField label="Carpet Steam Clean" value={form.extraCarpetSteam} onChange={set("extraCarpetSteam")} />
        <PriceField label="Upholstery Clean" value={form.extraUpholstery} onChange={set("extraUpholstery")} />
      </SectionCard>

      {/* Discounts & Tax */}
      <SectionCard title="Recurring Discounts & Tax" icon={Percent} badge="Applied at checkout">
        <PriceField label="Weekly Discount" value={form.discountWeeklyPercent} onChange={set("discountWeeklyPercent")} prefix="" suffix="%" description="Discount for weekly recurring" />
        <PriceField label="Fortnightly Discount" value={form.discountBiweeklyPercent} onChange={set("discountBiweeklyPercent")} prefix="" suffix="%" description="Discount for fortnightly recurring" />
        <PriceField label="Monthly Discount" value={form.discountMonthlyPercent} onChange={set("discountMonthlyPercent")} prefix="" suffix="%" description="Discount for monthly recurring" />
        <PriceField label="Tax Rate (GST)" value={form.taxRatePercent} onChange={set("taxRatePercent")} prefix="" suffix="%" description="Applied to all quotes" />
      </SectionCard>
    </div>
  );
}
