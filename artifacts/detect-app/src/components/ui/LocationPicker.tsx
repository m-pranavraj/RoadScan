import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { motion } from "framer-motion";
import { MapPin, Crosshair, Trash2 } from "lucide-react";

const markerIcon = L.divIcon({
  className: "",
  html: `<div style="width:24px;height:24px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) { onMapClick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

interface LocationPickerProps {
  onLocationChange: (lat: number | null, lon: number | null) => void;
}

export function LocationPicker({ onLocationChange }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleMapClick = (lat: number, lon: number) => {
    setPosition([lat, lon]);
    onLocationChange(lat, lon);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setPosition([lat, lon]);
        onLocationChange(lat, lon);
        setExpanded(true);
      },
      () => { /* permission denied */ },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleClear = () => {
    setPosition(null);
    onLocationChange(null, null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => { setExpanded((v) => !v); if (expanded) handleClear(); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-serif transition-all",
            position
              ? "bg-stone-200/70 text-stone-700"
              : "text-stone-500 hover:text-stone-700 hover:bg-stone-200/30"
          )}
        >
          <MapPin className="w-3.5 h-3.5" />
          {position
            ? `Selected (${position[0].toFixed(4)}, ${position[1].toFixed(4)})`
            : "Add location"}
        </button>
        {position && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={handleDetectLocation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-serif text-stone-500 hover:text-stone-700 hover:bg-stone-200/30 transition-all"
        >
          <Crosshair className="w-3.5 h-3.5" />
          Use GPS
        </button>
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 200 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded border border-stone-300/70"
        >
          <MapContainer
            center={position || [20.5937, 78.9629]}
            zoom={position ? 10 : 4}
            scrollWheelZoom={true}
            style={{ width: "100%", height: 200 }}
            zoomControl={true}
            doubleClickZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onMapClick={handleMapClick} />
            {position && <Marker position={position} icon={markerIcon} />}
          </MapContainer>
        </motion.div>
      )}
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
