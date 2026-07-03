import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { UploadCloud, FileImage, Trash2, CheckCircle2, ChevronRight, Zap, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getListDetectionsQueryKey, getGetStatsQueryKey, getGetRecentDetectionsQueryKey } from "@workspace/api-client-react";
import type { Detection } from "@workspace/api-zod";
import { Link } from "wouter";

const CLASS_COLORS = {
  pothole:       { color: "#b91c1c", bg: "bg-red-50",     border: "border-red-300", label: "Potholes",     chip: "border-red-300 text-red-700 bg-red-50/80" },
  plastic_waste: { color: "#92400e", bg: "bg-amber-50",   border: "border-amber-300", label: "Plastic Waste", chip: "border-amber-300 text-amber-700 bg-amber-50/80" },
  other_litter:  { color: "#7c2d12", bg: "bg-orange-50",  border: "border-orange-300", label: "Other Litter",  chip: "border-orange-300 text-orange-700 bg-orange-50/80" },
};

const SEV_CONFIG = {
  low:      { color: "#22c55e", label: "LOW",      glow: "rgba(34,197,94,0.4)"   },
  medium:   { color: "#f59e0b", label: "MEDIUM",   glow: "rgba(245,158,11,0.4)"  },
  high:     { color: "#f97316", label: "HIGH",     glow: "rgba(249,115,22,0.4)"  },
  critical: { color: "#ef4444", label: "CRITICAL", glow: "rgba(239,68,68,0.5)"   },
};

const SCAN_STEPS = [
  "Uploading file...",
  "Running AI vision model...",
  "Mapping bounding boxes...",
  "Computing severity score...",
  "Saving to database...",
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<Detection | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelection(f);
  };

  const handleFileSelection = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/") && !selectedFile.type.startsWith("video/")) {
      toast({ title: "Invalid file", description: "Please select an image or video file.", variant: "destructive" });
      return;
    }
    setFile(selectedFile);
    setResult(null);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    setIsProcessing(false);
    setStepIndex(0);
  };

  const startAnalysis = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setStepIndex(0);

    let p = 0;
    let step = 0;
    const iv = setInterval(() => {
      p += Math.random() * 14 + 4;
      step = Math.min(4, Math.floor(p / 22));
      setProgress(Math.min(p, 90));
      setStepIndex(step);
      if (p >= 90) clearInterval(iv);
    }, 600);

    try {
      const endpoint = file.type.startsWith("video/") ? "/api/analyze/video" : "/api/analyze/image";
      const form = new FormData();
      form.append("file", file);

      const response = await fetch(endpoint, { method: "POST", body: form });
      clearInterval(iv);
      setProgress(100);
      setStepIndex(4);

      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();

      setTimeout(() => {
        setResult(data);
        setIsProcessing(false);
        queryClient.invalidateQueries({ queryKey: getListDetectionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentDetectionsQueryKey() });
      }, 700);
    } catch {
      clearInterval(iv);
      setIsProcessing(false);
      toast({ title: "Analysis Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full" style={{ background: "linear-gradient(180deg, #00d4ff, #22c55e)" }} />
          <h1 className="text-4xl font-black tracking-tight" style={{ background: "linear-gradient(135deg, #00d4ff, #22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Upload & Analyze
          </h1>
        </div>
        <p className="text-muted-foreground font-mono text-sm ml-4">
          Deploy AI vision on road captures — detect potholes, plastic waste, and litter with bounding boxes.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed border-border transition-all duration-300 overflow-hidden cursor-pointer
                ${isDragging ? "border-cyan-500 bg-cyan-50" : "hover:border-stone-300 hover:bg-stone-50"}
                ${file ? "cursor-default" : ""}`}
              style={{ minHeight: 280 }}
            >
              {/* Background glow */}
              {isDragging && (
                <motion.div className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ background: "radial-gradient(ellipse at center, rgba(0,212,255,0.15) 0%, transparent 70%)" }} />
              )}

              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])} />

              <div className="flex flex-col items-center justify-center p-12 text-center">
                {!file ? (
                  <>
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-cyan-50 border border-cyan-200 text-cyan-600"
                    >
                      <UploadCloud className="w-10 h-10" />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">Drag & Drop Road Media</h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-sm font-mono">
                      Dashboard footage, mobile captures, or static images — JPEG, PNG, MP4 supported
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="px-6 py-2.5 rounded-xl font-mono text-sm font-bold text-background bg-foreground hover:opacity-90 transition-opacity"
                    >
                      Browse Files
                    </motion.button>
                  </>
                ) : (
                  <div className="w-full max-w-md">
                    {/* File info */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 rounded-xl mb-6 text-left border border-border bg-card">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-cyan-100 border border-cyan-200">
                        <FileImage className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB · {file.type.split("/")[1].toUpperCase()}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); reset(); }} disabled={isProcessing}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>

                    {isProcessing ? (
                      <div className="space-y-4">
                        {/* Progress bar */}
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full relative overflow-hidden"
                            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #00d4ff, #a855f7)" }}
                          >
                            <motion.div
                              className="absolute inset-0 opacity-50"
                              animate={{ x: ["-100%", "200%"] }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                              style={{ background: "linear-gradient(90deg, transparent, white, transparent)", width: "50%" }}
                            />
                          </motion.div>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <motion.span
                            key={stepIndex}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-cyan-400"
                          >
                            {SCAN_STEPS[stepIndex]}
                          </motion.span>
                          <span className="text-muted-foreground">{Math.round(progress)}%</span>
                        </div>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(0,212,255,0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => { e.stopPropagation(); startAnalysis(); }}
                        className="w-full py-3 rounded-xl font-mono font-bold text-background flex items-center justify-center gap-2"
                        style={{ background: "linear-gradient(135deg, hsl(30 10% 25%), hsl(30 10% 20%))" }}
                      >
                        <Zap className="w-4 h-4" />
                        RUN AI ANALYSIS
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Feature chips */}
            {!file && (
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { label: "ONNX Models", color: "#78716c" },
                  { label: "Real Bounding Boxes", color: "#78716c" },
                  { label: "Pothole Detection", color: "#b91c1c" },
                  { label: "Litter Classification", color: "#92400e" },
                ].map((chip) => (
                  <span key={chip.label} className="text-xs font-mono px-3 py-1 rounded-full border"
                    style={{ color: chip.color, borderColor: `${chip.color}40`, background: `${chip.color}10` }}>
                    {chip.label}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Annotated image */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl overflow-hidden relative border border-border bg-card">
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(0,212,255,0.4)" }}>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-mono text-xs text-cyan-600">ANALYZED</span>
                </div>
                <div className="relative aspect-video bg-black/50 overflow-hidden">
                  <img src={result.annotatedUrl} alt="Analyzed" className="w-full h-full object-contain" />
                  <motion.div
                    initial={{ top: "-5%" }} animate={{ top: "105%" }}
                    transition={{ duration: 2.5, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 z-20 pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent, #00d4ff, transparent)", boxShadow: "0 0 12px #00d4ff" }}
                  />
                </div>
              </div>

              {/* Count cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.entries(CLASS_COLORS) as [keyof typeof CLASS_COLORS, typeof CLASS_COLORS[keyof typeof CLASS_COLORS]][]).map(([key, cfg]) => (
                  <motion.div key={key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-xl border bg-gradient-to-br ${cfg.bg} ${cfg.border}`}>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">{cfg.label}</p>
                    <p className="text-2xl font-black" style={{ color: cfg.color }}>
                      {result.counts[key as keyof typeof result.counts]}
                    </p>
                  </motion.div>
                ))}
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  className="p-4 rounded-xl border"
                  style={{
                    background: `linear-gradient(135deg, ${SEV_CONFIG[result.severity as keyof typeof SEV_CONFIG]?.color}22, transparent)`,
                    borderColor: `${SEV_CONFIG[result.severity as keyof typeof SEV_CONFIG]?.color}50`,
                    boxShadow: `0 0 20px ${SEV_CONFIG[result.severity as keyof typeof SEV_CONFIG]?.glow}`
                  }}>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Severity</p>
                  <p className="text-xl font-black" style={{ color: SEV_CONFIG[result.severity as keyof typeof SEV_CONFIG]?.color }}>
                    {result.severity.toUpperCase()}
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Detection log */}
            <div className="rounded-2xl border border-border flex flex-col overflow-hidden bg-card">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground">Detection Log</h3>
                <span className="text-xs font-mono text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
                  {result.processingTimeMs}ms
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {result.objects.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-green-600/40 mb-3" />
                    <p className="font-medium text-muted-foreground text-sm">Clean Frame</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">No anomalies detected</p>
                  </div>
                ) : (
                  result.objects.map((obj: Detection["objects"][number], i: number) => {
                    const cfg = CLASS_COLORS[obj.className as keyof typeof CLASS_COLORS];
                    return (
                      <motion.div key={obj.id}
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`p-3 rounded-xl border bg-gradient-to-br ${cfg?.bg} ${cfg?.border}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-mono font-bold capitalize text-foreground/80">
                            {obj.className.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs font-mono font-black" style={{ color: cfg?.color }}>
                            {(obj.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${obj.confidence * 100}%` }}
                            transition={{ duration: 0.8, delay: i * 0.08 + 0.2 }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${cfg?.color}, ${cfg?.color}88)` }}
                          />
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t border-border flex gap-3">
                <button onClick={reset}
                  className="flex-1 py-2 rounded-xl font-mono text-xs font-bold text-muted-foreground border border-border hover:bg-muted transition-colors">
                  NEW SCAN
                </button>
                <Link href={`/detection/${result.id}`} className="flex-1">
                  <button className="w-full py-2 rounded-xl font-mono text-xs font-bold text-background"
                    style={{ background: "linear-gradient(135deg, hsl(30 10% 25%), hsl(30 10% 20%))" }}>
                    FULL REPORT
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
