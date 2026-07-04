import { useState } from "react";
import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ScanLine, Activity, History as HistoryIcon, Camera, Menu, X, PanelLeft, PanelLeftClose, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const { user, logout } = useAuth();

  const sidebarWidth = desktopOpen ? "md:ml-56" : "md:ml-0";

  const nav = (onClose?: () => void) => (
    <nav className="flex-1 py-4 px-2 space-y-0.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-all cursor-pointer font-serif whitespace-nowrap",
                isActive
                  ? "bg-stone-200/70 text-stone-800"
                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-200/30"
              )}
              onClick={onClose}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );

  const sidebarFooter = (
    <div className="p-3 border-t border-dashed border-stone-300/50 shrink-0 space-y-1">
      {user && (
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 px-2 py-1.5 rounded text-xs font-mono text-stone-500 hover:text-stone-700 hover:bg-red-100/50 transition-colors whitespace-nowrap"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      )}
      <button
        onClick={() => setDesktopOpen((v) => !v)}
        className="hidden md:flex w-full items-center gap-2 px-2 py-1.5 rounded text-xs font-mono text-stone-500 hover:text-stone-700 hover:bg-stone-200/50 transition-colors whitespace-nowrap"
      >
        {desktopOpen ? <PanelLeftClose className="w-4 h-4 shrink-0" /> : <PanelLeft className="w-4 h-4 shrink-0" />}
        <span>{desktopOpen ? "Collapse" : "Expand Menu"}</span>
      </button>
      <div className="text-[10px] text-stone-400 font-serif italic text-center md:hidden">
        RoadScan v2.0
      </div>
    </div>
  );

  const sidebarHeader = (
    <div className="h-14 flex items-center px-4 border-b border-dashed border-stone-300/50 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 90 L70 70 L90 90 L110 70 L130 90" stroke="#78716c" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="90" cy="90" r="8" fill="#78716c"/>
            <path d="M50 120 H130" stroke="#78716c" strokeWidth="6" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="font-serif font-bold text-sm text-stone-700">RoadScan</span>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full overflow-hidden bg-amber-50/60">

      {/* ── Mobile hamburger ── */}
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-white border border-stone-300 shadow-sm"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X className="w-5 h-5 text-stone-700" /> : <Menu className="w-5 h-5 text-stone-700" />}
      </button>

      {/* ── Mobile backdrop ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/40 z-30"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile sidebar (fixed, completely outside flow) ── */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-40 w-56 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full paper-card-deep paper-texture">
          {sidebarHeader}
          {nav(() => setMobileOpen(false))}
          {sidebarFooter}
        </div>
      </aside>

      {/* ── Desktop sidebar (fixed, main offsets with margin) ── */}
      <aside
        className={cn(
          "hidden md:flex fixed inset-y-0 left-0 z-40 w-56 flex-col transition-all duration-300 paper-card-deep paper-texture border-r border-stone-300/50",
          desktopOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarHeader}
        {nav()}
        {sidebarFooter}
      </aside>

      {/* ── Desktop expand button ── */}
      <AnimatePresence>
        {!desktopOpen && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => setDesktopOpen(true)}
            className="hidden md:flex fixed top-3 left-3 z-40 p-2 rounded-lg bg-white border border-stone-300 shadow-sm"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="w-4 h-4 text-stone-700" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Main content (single instance, offsets on desktop via margin) ── */}
      <main className={cn(
        "h-full flex flex-col overflow-hidden transition-[margin] duration-300",
        sidebarWidth
      )}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 px-4 pt-14 pb-4 md:px-8 md:pt-8 md:pb-8">
          <div className="w-full min-w-0">{children}</div>
        </div>
      </main>
    </div>
  );
}
