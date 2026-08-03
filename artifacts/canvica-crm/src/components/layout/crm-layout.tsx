import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  UserSquare, 
  CalendarDays, 
  FileText, 
  Receipt, 
  Briefcase,
  ClipboardList,
  LogOut,
  Bell,
  Search,
  Settings,
  Tag,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import logoUrl from "@assets/PHOTO-2026-07-30-13-52-03_1785624211974.jpg";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/crm/dashboard" },
  { icon: Users, label: "Leads", href: "/crm/leads" },
  { icon: UserSquare, label: "Customers", href: "/crm/customers" },
  { icon: CalendarDays, label: "Jobs", href: "/crm/jobs" },
  { icon: FileText, label: "Quotes", href: "/crm/quotes" },
  { icon: Receipt, label: "Invoices", href: "/crm/invoices" },
  { icon: Briefcase, label: "Staff", href: "/crm/employees" },
  { icon: ClipboardList, label: "Hiring Hub", href: "/crm/hiring" },
  { icon: Tag, label: "Pricing", href: "/crm/pricing" },
];

function NavItem({ item, isActive, onClick }: { item: typeof NAV_ITEMS[0]; isActive: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      {item.label}
    </Link>
  );
}

export function CrmLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, email } = useAuth();

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = async () => {
    closeSidebar();
    await logout();
  };

  const userInitials = email
    ? email.split("@")[0].slice(0, 2).toUpperCase()
    : "AM";

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50 flex-shrink-0">
        <Link href="/" className="flex items-center" onClick={closeSidebar}>
          <img src={logoUrl} alt="Canvica CRM" className="h-8 w-auto object-contain mix-blend-screen" />
        </Link>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-1">
        <div className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider mb-4 px-2 mt-4">
          Operations
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return <NavItem key={item.href} item={item} isActive={isActive} onClick={closeSidebar} />;
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border/50 flex-shrink-0 space-y-1">
        <Link href="/" onClick={closeSidebar} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Website
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] flex bg-gray-50 dark:bg-zinc-950 font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Desktop sidebar (always visible) */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col flex-shrink-0 sticky top-0 h-[100dvh]">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar (slide-in drawer) */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-50 flex flex-col lg:hidden transition-transform duration-250",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button
          className="absolute top-4 right-4 p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={closeSidebar}
        >
          <X className="w-4 h-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3 flex-1">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile logo (shown when sidebar closed) */}
            <Link href="/" className="lg:hidden">
              <img src={logoUrl} alt="Canvica CRM" className="h-7 w-auto object-contain" />
            </Link>

            <div className="relative w-full max-w-md hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search customers, jobs, invoices..."
                className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary border-2 border-white dark:border-zinc-900" />
            </button>
            <Link href="/crm/pricing" className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted hidden md:block">
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-medium font-display ml-1 cursor-pointer text-sm hover:bg-primary/20 transition-colors"
            >
              {userInitials}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
