import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Star, Shield, Clock } from "lucide-react";

export function LandingPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative bg-black text-white overflow-hidden py-24 lg:py-32">
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
            
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Customer" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <span className="text-sm text-gray-400 font-medium mt-1">4.9/5 from 500+ reviews</span>
              </div>
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