import { ReactNode, useState } from "react";
import { Link } from "wouter";
import { Phone, Mail, MapPin, Menu, X, Lock } from "lucide-react";
import logoUrl from "@assets/PHOTO-2026-07-30-13-52-03_1785624211974.jpg";
import { cn } from "@/lib/utils";

export function PublicLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black text-white">
        <div className="container mx-auto px-4 h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <img src={logoUrl} alt="Canvica Cleaning Services" className="h-20 w-auto object-contain mix-blend-screen" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="/#services" className="hover:text-primary transition-colors">Services</a>
            <a href="/#about" className="hover:text-primary transition-colors">About</a>
            <Link href="/book" className="bg-primary text-white px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors">
              Get a Quote
            </Link>
            <Link href="/crm/dashboard" className="flex items-center gap-1.5 text-white/60 hover:text-white border border-white/20 px-4 py-2 rounded-md text-xs hover:border-white/50 transition-all">
              <Lock className="w-3 h-3" /> Staff Login
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu drawer */}
        <div className={cn(
          "md:hidden absolute top-full left-0 right-0 bg-black border-b border-white/10 transition-all duration-200 overflow-hidden",
          mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        )}>
          <nav className="flex flex-col px-4 py-4 gap-1">
            <a href="/#services" className="px-3 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-md transition-colors" onClick={() => setMobileOpen(false)}>Services</a>
            <a href="/#about" className="px-3 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-md transition-colors" onClick={() => setMobileOpen(false)}>About</a>
            <div className="border-t border-white/10 my-2" />
            <Link href="/book" className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-md font-medium text-sm" onClick={() => setMobileOpen(false)}>
              Get an Instant Quote
            </Link>
            <Link href="/crm/dashboard" className="flex items-center justify-center gap-2 border border-white/20 text-white/70 px-5 py-3 rounded-md font-medium text-sm mt-1" onClick={() => setMobileOpen(false)}>
              <Lock className="w-3.5 h-3.5" /> Staff Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-black text-white py-16 border-t border-white/10">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <img src={logoUrl} alt="Canvica Cleaning Services" className="h-16 w-auto object-contain mix-blend-screen mb-6" />
            <p className="text-gray-400 max-w-sm mb-6 leading-relaxed">
              Precision, trust, and excellence in every clean. Top-tier residential and commercial cleaning services tailored to your exact needs.
            </p>
            <div className="flex flex-col gap-3 text-gray-400">
              <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-primary" /><span>1-613-861-5413</span></div>
              <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-primary" /><span>hello@canvicacleaning.com</span></div>
              <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-primary" /><span>Edmonton, AB</span></div>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Quick Links</h4>
            <ul className="flex flex-col gap-3 text-gray-400">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/book" className="hover:text-primary transition-colors">Book Now</Link></li>
              <li><a href="/#services" className="hover:text-primary transition-colors">Services</a></li>
              <li><Link href="/crm/dashboard" className="hover:text-primary transition-colors">Staff Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Services</h4>
            <ul className="flex flex-col gap-3 text-gray-400">
              <li><a href="/#services" className="hover:text-primary transition-colors cursor-pointer">Residential Cleaning</a></li>
              <li><a href="/#services" className="hover:text-primary transition-colors cursor-pointer">Commercial Cleaning</a></li>
              <li><a href="/#services" className="hover:text-primary transition-colors cursor-pointer">Move-In/Move-Out</a></li>
              <li><a href="/#services" className="hover:text-primary transition-colors cursor-pointer">Post-Construction</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Canvica Cleaning Services. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
