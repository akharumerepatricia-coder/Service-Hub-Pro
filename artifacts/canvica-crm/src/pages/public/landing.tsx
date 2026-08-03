import { Link } from "wouter";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Shield, Clock, Car, Wrench, X } from "lucide-react";

// ── Types & constants ──────────────────────────────────────────────────────────
const CLEANING_TYPE_OPTIONS = [
  { id: "residential",       label: "Residential" },
  { id: "commercial",        label: "Commercial" },
  { id: "airbnb",            label: "Airbnb / Short-term" },
  { id: "move_in_out",       label: "Move-in / Move-out" },
  { id: "post_construction", label: "Post-Construction" },
  { id: "deep_clean",        label: "Deep Clean" },
];

const AVAILABILITY_OPTIONS = [
  { id: "weekdays", label: "Weekdays" },
  { id: "weekends", label: "Weekends" },
  { id: "mornings", label: "Mornings" },
  { id: "evenings", label: "Evenings" },
  { id: "flexible", label: "Flexible" },
];

// ── Application Modal ──────────────────────────────────────────────────────────
function ApplyModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    yearsExperience: 0,
    hasVehicle: false,
    hasOwnSupplies: false,
    message: "",
  });
  const [cleaningTypes, setCleaningTypes] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value }));

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) { setError("Name, email, and phone are required."); return; }
    if (cleaningTypes.length === 0) { setError("Please select at least one cleaning type."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, cleaningTypes, availability }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setStep("success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white text-gray-900 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold font-display text-gray-900">Join Our Team</h2>
            <p className="text-sm text-gray-500 mt-0.5">Takes 2 minutes — we review every application</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === "success" ? (
          <div className="px-6 py-14 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold font-display mb-3">Application Received!</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              Thank you for applying to Canvica Cleaning Services. Our team will review your application and be in touch within 2–3 business days.
            </p>
            <button onClick={onClose} className="bg-black text-white px-8 py-3 rounded-md font-semibold hover:bg-black/90 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Personal info */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Personal Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" value={form.name} onChange={set("name")} placeholder="Jane Smith" required
                    className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={set("email")} placeholder="jane@email.com" required
                    className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" value={form.phone} onChange={set("phone")} placeholder="780-555-0100" required
                    className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
                </div>
              </div>
            </div>

            {/* Experience */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Experience</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <select value={form.yearsExperience} onChange={set("yearsExperience")}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/20">
                    {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                      <option key={n} value={n}>{n === 0 ? "Less than 1 year" : n === 10 ? "10+ years" : `${n} year${n > 1 ? "s" : ""}`}</option>
                    ))}
                  </select>
                </div>
                <div
                  onClick={() => setForm(f => ({ ...f, hasVehicle: !f.hasVehicle }))}
                  className={`flex items-center gap-3 border rounded-md px-4 h-10 cursor-pointer select-none transition-all ${form.hasVehicle ? "border-black bg-black text-white" : "border-gray-200 hover:border-gray-400"}`}
                >
                  <Car className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Own Vehicle</span>
                </div>
                <div
                  onClick={() => setForm(f => ({ ...f, hasOwnSupplies: !f.hasOwnSupplies }))}
                  className={`flex items-center gap-3 border rounded-md px-4 h-10 cursor-pointer select-none transition-all ${form.hasOwnSupplies ? "border-black bg-black text-white" : "border-gray-200 hover:border-gray-400"}`}
                >
                  <Wrench className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Own Supplies</span>
                </div>
              </div>
            </div>

            {/* Cleaning types */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cleaning Types You've Done *</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CLEANING_TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle(cleaningTypes, setCleaningTypes, opt.id)}
                    className={`px-3 py-2 rounded-md border text-sm font-medium text-left transition-all ${cleaningTypes.includes(opt.id) ? "border-black bg-black text-white" : "border-gray-200 hover:border-gray-400 text-gray-700"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Availability</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle(availability, setAvailability, opt.id)}
                    className={`px-3 py-2 rounded-md border text-sm font-medium transition-all ${availability.includes(opt.id) ? "border-black bg-black text-white" : "border-gray-200 hover:border-gray-400 text-gray-700"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tell us about yourself <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea value={form.message} onChange={set("message")} rows={3}
                placeholder="Why do you want to join Canvica? Any relevant experience or certifications?"
                className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 resize-none" />
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 rounded-md px-3 py-2">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 h-11 rounded-md border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 h-11 rounded-md bg-black text-white text-sm font-semibold hover:bg-black/90 transition-colors disabled:opacity-60">
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function LandingPage() {
  const [applyOpen, setApplyOpen] = useState(false);
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative bg-black text-white overflow-hidden py-24 lg:py-32 min-h-[560px] flex items-center">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2940&auto=format&fit=crop" 
            alt="Clean modern living room" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight mb-6">
              Precision Cleaning.<br />
              <span className="text-primary">Unmatched Trust.</span>
            </h1>
            <p className="text-lg lg:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
              We deliver premium residential and commercial cleaning services tailored to your exact needs. Experience the difference of true professional care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/book" className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-md font-medium text-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95">
                Get an Instant Quote <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#services" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-4 rounded-md font-medium text-lg hover:bg-white/20 transition-colors backdrop-blur-sm">
                Explore Services
              </a>
            </div>
            
            <div className="mt-12 flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /><span>Fully insured</span></div>
              <span className="text-white/20">|</span>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /><span>Background-checked staff</span></div>
              <span className="text-white/20">|</span>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /><span>Edmonton, AB</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-12 bg-zinc-50 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-200">
            <div className="flex flex-col items-center p-4">
              <Shield className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-display font-semibold text-xl mb-2">Fully Insured & Bonded</h3>
              <p className="text-muted-foreground">Your property is protected. We carry comprehensive liability insurance.</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <CheckCircle2 className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-display font-semibold text-xl mb-2">Vetted Professionals</h3>
              <p className="text-muted-foreground">Every team member undergoes strict background checks and rigorous training.</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <Clock className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-display font-semibold text-xl mb-2">Punctual & Reliable</h3>
              <p className="text-muted-foreground">We respect your time. Our scheduling is precise and our communication clear.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section id="services" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Cleaning Solutions for Every Need</h2>
            <p className="text-lg text-muted-foreground">From weekly home maintenance to large-scale commercial contracts, Canvica delivers unparalleled cleanliness.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Residential */}
            <div className="group relative overflow-hidden rounded-2xl bg-gray-100 flex flex-col h-[500px]">
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=2874&auto=format&fit=crop" 
                  alt="Residential Cleaning" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              </div>
              <div className="relative z-10 p-8 flex flex-col h-full justify-end text-white">
                <div className="bg-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-4">Residential</div>
                <h3 className="text-3xl font-display font-bold mb-3">Home Cleaning</h3>
                <p className="text-gray-200 mb-6 max-w-md">Standard cleaning, deep cleaning, and move-in/move-out services designed to make your home a sanctuary.</p>
                <ul className="space-y-2 mb-8 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Regular Maintenance</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Deep Spring Cleaning</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Move-in / Move-out Prep</li>
                </ul>
                <Link href="/book?service=residential" className="inline-flex items-center gap-2 font-medium hover:text-primary transition-colors">
                  Book Residential <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Commercial */}
            <div className="group relative overflow-hidden rounded-2xl bg-gray-100 flex flex-col h-[500px]">
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1613665813446-82a78c468a1d?q=80&w=2916&auto=format&fit=crop" 
                  alt="Commercial Cleaning" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              </div>
              <div className="relative z-10 p-8 flex flex-col h-full justify-end text-white">
                <div className="bg-black text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-4 border border-white/20">Commercial</div>
                <h3 className="text-3xl font-display font-bold mb-3">Office & Retail</h3>
                <p className="text-gray-200 mb-6 max-w-md">Professional environments demand professional standards. We keep your business looking its absolute best.</p>
                <ul className="space-y-2 mb-8 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Daily Office Cleaning</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Retail Floor Maintenance</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Post-Construction Cleanup</li>
                </ul>
                <Link href="/book?service=commercial" className="inline-flex items-center gap-2 font-medium hover:text-primary transition-colors">
                  Request Commercial Quote <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* About Section */}
      <section id="about" className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-primary font-semibold uppercase tracking-widest text-sm mb-4">About Canvica</p>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight mb-6">
                Edmonton&apos;s Most Trusted Cleaning Professionals
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Founded right here in Edmonton, Canvica Cleaning Services has spent years perfecting the art of residential and commercial cleaning. We believe a clean space isn&apos;t a luxury — it&apos;s the foundation of a healthy, productive life.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                Every member of our team is background-checked, fully insured, and trained to our exact standards. We use only eco-friendly, safe products — gentle on your family, pets, and the environment.
              </p>
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border">
                {[
                  { value: "500+", label: "Happy Clients" },
                  { value: "98%", label: "Satisfaction Rate" },
                  { value: "6 yrs", label: "In Business" },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <p className="text-3xl font-display font-black text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "🏡", title: "Residential Specialists", desc: "Houses, apartments, and units cleaned to hotel standards." },
                { icon: "🏢", title: "Commercial Ready", desc: "Offices, retail, and industrial spaces — we handle it all." },
                { icon: "🌿", title: "Eco-Friendly", desc: "Non-toxic, biodegradable products safe for kids and pets." },
                { icon: "🔒", title: "Fully Insured", desc: "Background-checked staff and comprehensive liability insurance." },
              ].map(item => (
                <div key={item.title} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h4 className="font-bold text-foreground mb-1 text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="testimonials" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-primary font-semibold uppercase tracking-widest text-sm mb-4">Client Reviews</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">What Our Clients Say</h2>
            <p className="text-muted-foreground text-xl mt-4 max-w-2xl mx-auto">
              We&apos;re proud of every clean we deliver. If you&apos;ve used our services, we&apos;d love to hear from you.
            </p>
          </div>

          {/* Empty-state review cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 min-h-[200px]">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className="text-2xl text-border">★</span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground/60 italic">Your review could be here.</p>
              </div>
            ))}
          </div>

          {/* CTA to leave a real review */}
          <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => <span key={s} className="text-3xl text-yellow-400">★</span>)}
              </div>
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground mb-3">Had a great experience?</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Let others in Edmonton know. Leaving a review takes less than a minute and helps local families find a cleaner they can trust.
            </p>
            <a
              href="https://g.page/r/review"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-md font-semibold text-base hover:opacity-90 transition-opacity shadow-md"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Leave a Google Review
            </a>
            <p className="text-xs text-muted-foreground mt-4">Opens Google Reviews in a new tab</p>
          </div>
        </div>
      </section>

      {/* Careers / Join Us Section */}
      <section id="careers" className="py-24 bg-black text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <div>
              <p className="text-primary font-semibold uppercase tracking-widest text-sm mb-4">Join Our Team</p>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white leading-tight mb-6">
                Build a Career You're<br />Proud Of
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                We're growing and looking for dedicated cleaners to join the Canvica family in Edmonton. Competitive pay, flexible scheduling, and a team that values your work.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  "Flexible hours — mornings, evenings, weekdays, weekends",
                  "Competitive pay with performance bonuses",
                  "Supplied with equipment and products",
                  "Supportive, professional team environment",
                  "Room to grow into supervisor and management roles",
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setApplyOpen(true)}
                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-md font-semibold text-base hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
              >
                Apply Now <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Right: quick-stats cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Clock, title: "Flexible Hours", desc: "Choose shifts that fit your life — full-time or part-time available" },
                { icon: Shield, title: "Fully Insured", desc: "All team members are covered while on the job, every time" },
                { icon: CheckCircle2, title: "Paid Training", desc: "Onboarding and ongoing training provided at no cost to you" },
                { icon: ArrowRight, title: "Room to Grow", desc: "Many supervisors started exactly where you are right now" },
              ].map(card => (
                <div key={card.title} className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <card.icon className="w-7 h-7 text-primary mb-3" />
                  <h3 className="font-semibold text-white mb-1">{card.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Apply modal */}
      {applyOpen && <ApplyModal onClose={() => setApplyOpen(false)} />}

      {/* CTA Section */}
      <section className="py-24 bg-black text-white text-center">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Ready for a Cleaner Space?</h2>
          <p className="text-xl text-gray-400 mb-10">Get an instant quote online in under 60 seconds and book your first clean today.</p>
          <Link href="/book" className="inline-flex items-center justify-center gap-2 bg-primary text-white px-10 py-5 rounded-md font-bold text-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20">
            Start Your Quote
          </Link>
        </div>
      </section>
    </div>
  );
}