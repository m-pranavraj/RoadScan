import { motion } from "framer-motion";
import { useGetStats, useGetRecentDetections, useGetMapDetections } from "@workspace/api-client-react";
import { Activity, Target, TrendingUp, Timer, ChevronRight, MapPin } from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar, Cell,
} from "recharts";
import { Link } from "wouter";

const SEVERITY_CONFIG = {
  low:      { bg: "from-emerald-500/10 to-green-600/5",   border: "border-emerald-300",  text: "text-emerald-700",  dot: "#22c55e" },
  medium:   { bg: "from-amber-500/10 to-yellow-600/5",    border: "border-amber-300",    text: "text-amber-700",    dot: "#f59e0b" },
  high:     { bg: "from-orange-500/10 to-red-600/5",      border: "border-orange-300",   text: "text-orange-700",   dot: "#f97316" },
  critical: { bg: "from-red-500/10 to-rose-700/5",        border: "border-red-300",      text: "text-red-700",      dot: "#ef4444" },
};

const STAT_CARDS = [
  { key: "totalScans",     label: "Total Scans",      icon: Activity,   accent: "#0891b2" },
  { key: "totalObjects",   label: "Objects Detected", icon: Target,     accent: "#9333ea" },
  { key: "avgConfidence",  label: "Avg Confidence",   icon: TrendingUp, accent: "#16a34a" },
  { key: "avgProcessingMs",label: "Avg Processing",   icon: Timer,      accent: "#d97706" },
];

const CLASS_CONFIG = [
  { key: "pothole",       label: "Potholes",      color: "#ef4444", bg: "from-red-500/20 to-red-900/5",    border: "border-red-500/30"    },
  { key: "plastic_waste", label: "Plastic Waste", color: "#f59e0b", bg: "from-amber-500/20 to-amber-900/5", border: "border-amber-500/30"  },
  { key: "other_litter",  label: "Other Litter",  color: "#a855f7", bg: "from-purple-500/20 to-purple-900/5", border: "border-purple-500/30" },
];

function formatValue(key: string, val: number): string {
  if (key === "avgConfidence") return `${(val * 100).toFixed(1)}%`;
  if (key === "avgProcessingMs") return `${Math.round(val)}ms`;
  return String(val);
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useGetStats();
  const { data: recent, isLoading: recentLoading, error: recentError } = useGetRecentDetections();

  if (statsLoading || recentLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="paper-card-vintage h-28" />)}
        </div>
        <div className="paper-card-vintage h-[400px]" />
      </div>
    );
  }

  if (statsError || recentError) {
    return (
      <div className="py-20 text-center">
        <p className="font-serif text-sm text-red-600">Failed to load dashboard data. Please try again later.</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-20 text-center">
        <p className="font-serif text-sm text-stone-500 italic">No analytics data available yet. Run some scans first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-0.5 h-7" style={{ background: "hsl(30 10% 50%)" }} />
          <h1 className="text-3xl font-serif font-bold text-stone-800 tracking-tight">
            Dashboard
          </h1>
        </div>
        <p className="text-stone-500 font-serif text-sm ml-4 italic">
          Aggregated analytics across all your field scans.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => {
          const Icon = card.icon;
          const rawVal = stats[card.key as keyof typeof stats] as number;
          const displayVal = formatValue(card.key, rawVal);
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="paper-card-vintage paper-scratches paper-stains paper-fold p-4 group cursor-default"
            >
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-serif text-stone-500">{card.label}</p>
                <div className="w-7 h-7 flex items-center justify-center"
                  style={{ background: `${card.accent}15`, border: `1px solid ${card.accent}30` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: card.accent }} />
                </div>
              </div>
              <p className="text-2xl font-serif font-bold text-stone-800">{displayVal}</p>
              <div className="h-px mt-3 opacity-30" style={{ background: `linear-gradient(90deg, ${card.accent}, transparent)` }} />
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 paper-card-vintage paper-scratches paper-stains p-0"
        >
          <div className="px-4 py-3 border-b border-dashed border-stone-300/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-stone-500" />
              <span className="font-serif text-xs font-semibold text-stone-700 uppercase tracking-wider">Daily Scan Activity</span>
            </div>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-1.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Live</span>
            </motion.div>
          </div>
          <div className="p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.recentActivity}>
                <defs>
                  <linearGradient id="gradScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradObjects" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(30 10% 75%)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false}
                  tick={{ fontSize: 11, fontFamily: 'Space Mono', fill: 'hsl(30 10% 50%)' }} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false}
                  tick={{ fontSize: 11, fontFamily: 'Space Mono', fill: 'hsl(30 10% 50%)' }} tickMargin={8} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(40 30% 95%)', border: '1px solid hsl(30 10% 75%)', borderRadius: 4, fontFamily: 'Georgia, serif', fontSize: 11 }}
                  labelStyle={{ color: 'hsl(30 10% 20%)', fontWeight: 600 }}
                  itemStyle={{ color: '#0891b2' }}
                />
                <Area type="monotone" dataKey="scans" stroke="#00d4ff" strokeWidth={2.5}
                  fill="url(#gradScans)" animationDuration={1200} dot={false} />
                <Area type="monotone" dataKey="objects" stroke="#a855f7" strokeWidth={2}
                  fill="url(#gradObjects)" animationDuration={1400} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Class breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="paper-card-vintage paper-scratches paper-stains p-0"
          >
            <div className="px-4 py-3 border-b border-dashed border-stone-300/60">
              <span className="font-serif text-xs font-semibold text-stone-700 uppercase tracking-wider">Class Breakdown</span>
            </div>
            <div className="p-4 space-y-3">
              {CLASS_CONFIG.map((cls) => {
                const val = stats.classBreakdown[cls.key as keyof typeof stats.classBreakdown] as number;
                const pct = stats.totalObjects > 0 ? (val / stats.totalObjects) * 100 : 0;
                return (
                  <div key={cls.key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-serif text-stone-500">{cls.label}</span>
                      <span className="text-xs font-serif font-bold" style={{ color: cls.color }}>{val}</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-200 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                        className="h-full"
                        style={{ background: `linear-gradient(90deg, ${cls.color}, ${cls.color}88)` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mini bar chart */}
            <div className="px-4 pb-4 h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: "Dist", pothole: stats.classBreakdown.pothole, plastic: stats.classBreakdown.plastic_waste, litter: stats.classBreakdown.other_litter }]} barSize={28} barGap={6}>
                  <Bar dataKey="pothole" radius={[4,4,0,0]} fill="#ef4444" />
                  <Bar dataKey="plastic" radius={[4,4,0,0]} fill="#f59e0b" />
                  <Bar dataKey="litter" radius={[4,4,0,0]} fill="#a855f7" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Severity distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="paper-card-vintage paper-scratches paper-stains p-0"
          >
            <div className="px-4 py-3 border-b border-dashed border-stone-300/60 flex items-center justify-between">
              <span className="font-serif text-xs font-semibold text-stone-700 uppercase tracking-wider">Recent Alerts</span>
              <Link href="/history">
                <span className="text-xs font-serif text-stone-500 hover:text-stone-700 flex items-center gap-1 cursor-pointer italic">
                  All <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <div className="divide-y divide-stone-200/50">
              {(recent ?? []).slice(0, 4).map((item) => {
                const sev = SEVERITY_CONFIG[item.severity as keyof typeof SEVERITY_CONFIG];
                return (
                  <Link key={item.id} href={`/detection/${item.id}`}>
                    <div className="px-4 py-2.5 hover:bg-stone-100/50 transition-colors cursor-pointer flex items-center justify-between gap-3">
                      <div className="min-w-0 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sev?.dot ?? "#78716c" }} />
                          <p className="text-xs font-serif text-stone-700 truncate">{item.filename}</p>
                      </div>
                      <span className="tag-vintage text-[10px] uppercase font-bold"
                        style={{ background: `${sev?.dot}15`, color: sev?.dot, borderColor: `${sev?.dot}30` }}>
                        {item.severity}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Geo Map Widget */}
      <DashboardMiniMap />
    </div>
  );
}

function DashboardMiniMap() {
  const { data: mapDetections } = useGetMapDetections();
  const geoCount = (mapDetections ?? []).filter((d) => d.lat != null).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="paper-card-vintage paper-scratches paper-stains p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-stone-500" />
          <span className="font-serif text-xs font-semibold text-stone-700 uppercase tracking-wider">Geo-Tagged Detections</span>
        </div>
        <Link href="/map">
          <span className="font-serif text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1 cursor-pointer italic">
            View Map <ChevronRight className="w-3 h-3" />
          </span>
        </Link>
      </div>

      {geoCount > 0 ? (
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="font-serif text-sm text-stone-700">
              <strong className="text-lg">{geoCount}</strong> detection{geoCount !== 1 ? "s" : ""} with location data
            </p>
            <p className="font-serif text-xs text-stone-500 italic mt-1">
              Pinpointed on the interactive detection map
            </p>
          </div>
          <Link href="/map">
            <span className="btn-vintage text-xs flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Open Map
            </span>
          </Link>
        </div>
      ) : (
        <div className="text-center py-6">
          <MapPin className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="font-serif text-xs text-stone-500 italic">
            No geo-tagged detections yet. Enable location during scanning or pin a location when uploading.
          </p>
          <Link href="/camera">
            <span className="inline-block mt-3 font-serif text-xs text-stone-600 hover:text-stone-800 underline underline-offset-2 cursor-pointer">
              Go to Camera &rarr;
            </span>
          </Link>
        </div>
      )}
    </motion.div>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
  return (
    <span className="tag-vintage text-[10px] uppercase font-bold"
      style={{ background: `${config?.dot}15`, color: config?.dot, borderColor: `${config?.dot}30` }}>
      {severity}
    </span>
  );
}
