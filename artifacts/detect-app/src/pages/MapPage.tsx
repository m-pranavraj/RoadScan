import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapContainer, TileLayer, Marker, Popup, useMap,
} from "react-leaflet";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { useGetMapDetections, useGetStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MapPin, Navigation, AlertTriangle } from "lucide-react";

const SEVERITY_ICONS: Record<string, L.DivIcon> = {
  low: L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  }),
  medium: L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#f59e0b;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  }),
  high: L.divIcon({
    className: "",
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#f97316;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -14],
  }),
  critical: L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;border-radius:50%;background:#ef4444;border:2px solid white;box-shadow:0 0 8px rgba(239,68,68,0.5);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -16],
  }),
};

function ClusterLayer({ detections }: { detections: Array<{ id: number; lat: number; lon: number; severity: string; filename: string; counts: { total: number } }> }) {
  const map = useMap();

  useMemo(() => {
    const mcg = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let bg = "#78716c";
        if (count > 10) bg = "#f59e0b";
        if (count > 25) bg = "#f97316";
        if (count > 50) bg = "#ef4444";
        return L.divIcon({
          className: "",
          html: `<div style="width:36px;height:36px;border-radius:50%;background:${bg};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:monospace;border:2px solid rgba(255,255,255,0.8);box-shadow:0 2px 8px rgba(0,0,0,0.2);">${count}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
      },
    });

    detections.forEach((d) => {
      const icon = SEVERITY_ICONS[d.severity] || SEVERITY_ICONS.low;
      const marker = L.marker([d.lat, d.lon], { icon });
      marker.bindPopup(`
        <div style="font-family:'Source Serif 4',serif;font-size:12px;min-width:160px;">
          <p style="font-weight:600;margin:0 0 4px;color:#444;">${d.filename}</p>
          <p style="margin:0 0 2px;font-size:11px;color:#666;">
            Severity: <strong style="color:${d.severity === 'critical' ? '#ef4444' : d.severity === 'high' ? '#f97316' : d.severity === 'medium' ? '#f59e0b' : '#22c55e'}">${d.severity.toUpperCase()}</strong>
          </p>
          <p style="margin:0 0 2px;font-size:11px;color:#666;">Objects: ${d.counts.total}</p>
          <a href="/detection/${d.id}" style="color:#0891b2;font-size:11px;text-decoration:underline;">View details →</a>
        </div>
      `);
      mcg.addLayer(marker);
    });

    map.addLayer(mcg);
    return () => { map.removeLayer(mcg); };
  }, [map, detections]);

  return null;
}

function IndiaBoundary() {
  const [geojson, setGeojson] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(setGeojson)
      .catch(() => setError(true));
  }, []);

  if (error || !geojson) return null;

  return (
    <GeoJSON
      data={geojson}
      style={{
        color: "#78716c",
        weight: 1.5,
        opacity: 0.6,
        fillColor: "#a8a29e",
        fillOpacity: 0.08,
      }}
    />
  );
}

function MapBounds({ detections }: { detections: Array<{ lat: number; lon: number }> }) {
  const map = useMap();

  useMemo(() => {
    if (detections.length === 0) {
      map.setView([20.5937, 78.9629], 4);
      return;
    }
    const bounds = L.latLngBounds(detections.map((d) => [d.lat, d.lon] as [number, number]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, detections]);

  return null;
}

export default function MapPage() {
  const { data: detections, isLoading, error } = useGetMapDetections();
  const { data: stats } = useGetStats();

  const geoDetections = useMemo(() => {
    if (!detections) return [];
    return detections
      .filter((d): d is typeof d & { lat: number; lon: number } => d.lat != null && d.lon != null)
      .map((d) => ({
        id: d.id,
        lat: d.lat as number,
        lon: d.lon as number,
        severity: d.severity,
        filename: d.filename,
        counts: d.counts,
      }));
  }, [detections]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="paper-card-vintage h-[600px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="font-serif text-sm text-red-600">Failed to load map data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-0.5 h-7" style={{ background: "hsl(30 10% 50%)" }} />
          <h1 className="text-3xl font-serif font-bold text-stone-800 tracking-tight">Detection Map</h1>
        </div>
        <p className="text-stone-500 font-serif text-sm ml-4 italic flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          {geoDetections.length} geo-tagged detection{geoDetections.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="paper-card-vintage p-0 overflow-hidden animate-crumple"
        style={{ height: "calc(100vh - 240px)", minHeight: 500 }}
      >
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={4}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <IndiaBoundary />
          <MapBounds detections={geoDetections} />
          <ClusterLayer detections={geoDetections} />
        </MapContainer>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="paper-card-vintage p-3"
      >
        <div className="flex items-center gap-6 flex-wrap">
          <span className="font-serif text-xs text-stone-600 font-semibold uppercase tracking-wider">Severity</span>
          {[
            { label: "Low", color: "#22c55e" },
            { label: "Medium", color: "#f59e0b" },
            { label: "High", color: "#f97316" },
            { label: "Critical", color: "#ef4444" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: s.color, border: "1px solid rgba(0,0,0,0.1)" }} />
              <span className="font-serif text-xs text-stone-500">{s.label}</span>
            </div>
          ))}
          <span className="font-serif text-xs text-stone-400 italic ml-auto">
            {stats?.totalScans ? `${Math.round((geoDetections.length / stats.totalScans) * 100)}% of scans have location data` : ""}
          </span>
        </div>
      </motion.div>

      {/* Upload prompt */}
      {geoDetections.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="paper-card-vintage p-8 text-center"
        >
          <AlertTriangle className="w-8 h-8 text-stone-400 mx-auto mb-3" />
          <h3 className="font-serif text-base font-semibold text-stone-700 mb-2">No Geo-Tagged Detections Yet</h3>
          <p className="font-serif text-sm text-stone-500 max-w-md mx-auto">
            Enable location when scanning with the camera or click on the map when uploading
            images to pin the detection location. They will appear here.
          </p>
          <Link href="/camera">
            <span className="inline-block mt-4 btn-vintage text-xs">
              <Navigation className="w-3 h-3 inline mr-1" /> Go to Camera
            </span>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
