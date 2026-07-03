import { useState } from "react";
import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ScanLine, Activity, History as HistoryIcon, Camera, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Upload & Analyze", icon: ScanLine },
  { href: "/camera", label: "Live Camera", icon: Camera },
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/history", label: "Scan History", icon: HistoryIcon },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const NavLinks = () =>
    navItems.map((item) => {
      const Icon = item.icon;
      const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
      return (
        <Link key={item.href} href={item.href}>
          <div
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-all cursor-pointer font-serif",
              isActive
                ? "bg-stone-200/70 text-stone-800 border-l-2 border-stone-600"
                : "text-stone-500 hover:text-stone-700 hover:bg-stone-200/30 border-l-2 border-transparent"
            )}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{item.label}</span>
          </div>
        </Link>
      );
    });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-amber-50/60">
      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-white border border-stone-300 shadow-sm"
        aria-label="Toggle navigation"
      >
        {sidebarOpen ? <X className="w-5 h-5 text-stone-700" /> : <Menu className="w-5 h-5 text-stone-700" />}
      </button>

      {/* Backdrop overlay — mobile only */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/40 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-56 flex flex-col border-r border-stone-300/40 bg-stone-50/80 paper-texture transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-14 flex items-center px-4 border-b border-dashed border-stone-300/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 90 L70 70 L90 90 L110 70 L130 90" stroke="#78716c" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <circle cx="90" cy="90" r="8" fill="#78716c"/>
                <path d="M50 120 H130" stroke="#78716c" stroke-width="6" stroke-linecap="round"/>
              </svg>
            </div>
            <span className="font-serif font-bold text-sm text-stone-700">RoadScan</span>
          </div>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {NavLinks()}
        </nav>

        <div className="p-3 border-t border-dashed border-stone-300/50">
          <div className="text-[10px] text-stone-400 font-serif italic text-center">
            RoadScan v2.0
          </div>
        </div>
      </aside>

      {/* Main content area — offset on mobile so hamburger is visible */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative md:ml-0">
        <div className="flex-1 overflow-y-auto relative z-10 p-6 md:p-8">
          <div className="max-w-7xl mx-auto h-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
