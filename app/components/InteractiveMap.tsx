"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MapPin,
  AlertTriangle,
  Activity,
  Layers,
  RefreshCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  X,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────── */
interface MapMarker {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

interface MapSummary {
  totalAreas: number;
}

interface MapData {
  markers: MapMarker[];
  summary: MapSummary;
}

/* ─── Leaflet Dynamic Loader ─────────────────────────────────────── */
function useLeaflet() {
  const [L, setL] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default || leaflet);
    });
  }, []);

  return L;
}

/* ─── Uniform Icon Builder ───────────────────────────────────────── */
function createIcon(L: any, name: string) {
  const color = "#2dd4a8";
  const dotSize = 14;
  const containerWidth = 80;

  return L.divIcon({
    className: "custom-map-marker",
    iconSize: [containerWidth, 40],
    iconAnchor: [containerWidth / 2, dotSize / 2],
    popupAnchor: [0, -dotSize],
    html: `
      <div style="
        width:${containerWidth}px;
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:5px;
      ">
        <span style="
          display:block;
          width:${dotSize}px;
          height:${dotSize}px;
          border-radius:50%;
          background:${color};
          box-shadow:0 0 0 4px ${color}40, 0 0 16px 4px ${color}80, 0 0 32px 8px ${color}30;
          flex-shrink:0;
        "></span>
        <span style="
          color:#ffffff;
          font-size:10px;
          font-weight:600;
          font-family:sans-serif;
          white-space:nowrap;
          text-shadow:0 1px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6);
          letter-spacing:0.03em;
          line-height:1;
        ">${name}</span>
      </div>
    `,
  });
}

interface InteractiveMapProps {
  onSelectLocation?: (locationName: string) => void;
  selectedLocation?: string;
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function InteractiveMap({ onSelectLocation, selectedLocation }: InteractiveMapProps) {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [showWeather, setShowWeather] = useState(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const L = useLeaflet();

  /* ── Fetch Data ── */
  const fetchMapData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/map");
      if (!res.ok) throw new Error("Gagal memuat data peta");
      const result = await res.json();
      if (result.status === "success") {
        setMapData(result.data);
      } else {
        throw new Error(result.message || "Error tidak diketahui");
      }
    } catch (err: any) {
      console.error("Map data error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  /* ── Fetch Weather ── */
  useEffect(() => {
    if (!mapData || !selectedLocation) return;
    const selectedMarker = mapData.markers.find(m => m.name === selectedLocation);
    if (!selectedMarker) return;

    const fetchWeather = async () => {
      setIsWeatherLoading(true);
      setShowWeather(true);
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${selectedMarker.latitude}&longitude=${selectedMarker.longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=auto`);
        const data = await res.json();
        if (data && data.daily) {
          setWeatherData(data.daily);
        }
      } catch (err) {
        console.error("Failed to fetch weather", err);
      } finally {
        setIsWeatherLoading(false);
      }
    };
    fetchWeather();
  }, [mapData, selectedLocation]);

  function getWeatherIcon(code: number) {
    if (code === 0 || code === 1) return <Sun size={16} color="#fbbf24" />;
    if (code === 2 || code === 3) return <Cloud size={16} color="#94a3b8" />;
    if (code >= 51 && code <= 67) return <CloudRain size={16} color="#38bdf8" />;
    if (code >= 80 && code <= 82) return <CloudRain size={16} color="#38bdf8" />;
    if (code >= 71 && code <= 77) return <CloudSnow size={16} color="#e2e8f0" />;
    if (code >= 95) return <CloudLightning size={16} color="#c084fc" />;
    return <Cloud size={16} color="#94a3b8" />;
  }

  function getWeatherDesc(code: number) {
    if (code === 0) return "Cerah";
    if (code === 1 || code === 2 || code === 3) return "Berawan";
    if (code === 45 || code === 48) return "Berkabut";
    if (code >= 51 && code <= 55) return "Gerimis";
    if (code >= 61 && code <= 65) return "Hujan";
    if (code >= 71 && code <= 75) return "Salju";
    if (code >= 80 && code <= 82) return "Hujan Deras";
    if (code >= 95) return "Badai Petir";
    return "Tidak Diketahui";
  }

  /* ── Init Map ── */
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    // Inject Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const map = L.map(mapContainerRef.current, {
      center: [-6.2, 106.85],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19, subdomains: "abcd" }
    ).addTo(map);

    L.control
      .attribution({ position: "bottomleft", prefix: false })
      .addAttribution(
        '&copy; <a href="https://www.openstreetmap.org/copyright" style="color:#5a6f85">OSM</a> &copy; <a href="https://carto.com/" style="color:#5a6f85">CARTO</a>'
      )
      .addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      try {
        map.remove();
      } catch (err) {
        console.error("Leaflet cleanup error:", err);
      }
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, [L]);

  /* ── Render Markers ── */
  useEffect(() => {
    if (!L || !mapInstanceRef.current || !markersLayerRef.current || !mapData)
      return;

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;

    markersLayer.clearLayers();

    if (mapData.markers.length === 0) return;

    const bounds: [number, number][] = [];

    mapData.markers.forEach((marker) => {
      const icon = createIcon(L, marker.name);
      const leafletMarker = L.marker([marker.latitude, marker.longitude], { icon });

      // Click: sync location to prediction form
      leafletMarker.on("click", () => {
        if (onSelectLocation) {
          onSelectLocation(marker.name);
        }
      });

      leafletMarker.addTo(markersLayer);
      bounds.push([marker.latitude, marker.longitude]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [L, mapData, onSelectLocation]);

  /* ── Zoom Controls ── */
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    if (!mapInstanceRef.current || !mapData?.markers.length) return;
    const bounds: [number, number][] = mapData.markers.map((m) => [m.latitude, m.longitude]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  };

  /* ── Fullscreen Toggle ── */
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
      handleRecenter();
    }, 300);
  };

  /* ── Render ── */
  return (
    <div
      className={`interactive-map-wrapper animate-fade-in ${isFullscreen ? "interactive-map-fullscreen" : ""}`}
      style={{
        marginBottom: 20,
        position: isFullscreen ? "fixed" : "relative",
        inset: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 1000 : undefined,
        height: isFullscreen ? "100vh" : 340,
        borderRadius: isFullscreen ? 0 : "var(--radius-lg)",
        overflow: "hidden",
        border: isFullscreen ? "none" : "1px solid var(--border-primary)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        id="interactive-map"
        style={{ width: "100%", height: "100%", background: "var(--bg-card)" }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="map-loading-overlay">
          <div className="map-loading-spinner" />
          <span style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 12 }}>
            Memuat data peta...
          </span>
        </div>
      )}

      {/* Error Overlay */}
      {error && !isLoading && (
        <div className="map-loading-overlay">
          <AlertTriangle size={28} style={{ color: "var(--accent-coral)" }} />
          <span style={{ color: "var(--accent-coral)", fontSize: 13, marginTop: 8 }}>
            {error}
          </span>
          <button className="btn" onClick={fetchMapData} style={{ marginTop: 12, fontSize: 12 }}>
            <RefreshCw size={14} />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Header Overlay */}
      <div className="interactive-map-header">
        <div>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--accent-green)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Activity size={18} />
            Prediction Location Map
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Klik marker untuk memilih lokasi prediksi secara otomatis
          </p>
        </div>

        {mapData && (
          <div style={{ display: "flex", gap: 8 }}>
            <div className="map-stat-pill">
              <Layers size={13} />
              <span>{mapData.summary.totalAreas} Lokasi Tersedia</span>
            </div>
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="map-zoom-controls">
        <button className="map-zoom-btn" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <button className="map-zoom-btn" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={16} />
        </button>
        <div style={{ height: 1, background: "var(--border-primary)", margin: "2px 4px" }} />
        <button className="map-zoom-btn" onClick={handleRecenter} title="Recenter">
          <MapPin size={16} />
        </button>
        <button
          className="map-zoom-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Refresh Button */}
      <button
        className="map-refresh-btn"
        onClick={fetchMapData}
        disabled={isLoading}
        title="Refresh data"
      >
        <RefreshCw size={14} className={isLoading ? "map-spin" : ""} />
      </button>

      {/* Weather Overlay using Portal to ensure it is fixed to the viewport */}
      {selectedLocation && weatherData && showWeather && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: "rgba(15, 23, 42, 0.9)",
          border: "1px solid rgba(51, 65, 85, 0.8)",
          borderRadius: "var(--radius-lg)",
          padding: 16,
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)",
          width: 320,
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              Prakiraan Cuaca 7 Hari
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--accent-green)", fontWeight: 600, background: "var(--accent-green-dim)", padding: "2px 6px", borderRadius: 4 }}>
                {selectedLocation}
              </span>
              <button
                onClick={() => setShowWeather(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {isWeatherLoading ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>Memuat cuaca...</div>
          ) : (() => {
            const rains = weatherData.precipitation_sum?.slice(0, 7) || [];
            const totalRain = rains.reduce((a: number, b: number) => a + b, 0);
            const avgRain = totalRain / 7;
            const isWet = totalRain > 20;

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* ── Summary Cuaca ── */}
                <div style={{
                  background: isWet ? "rgba(56, 189, 248, 0.1)" : "rgba(250, 204, 21, 0.1)",
                  border: `1px solid ${isWet ? "rgba(56, 189, 248, 0.3)" : "rgba(250, 204, 21, 0.3)"}`,
                  borderRadius: 6,
                  padding: "10px 12px",
                  marginBottom: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Summary 7 Hari</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>
                      Total: {totalRain.toFixed(1)}mm <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>•</span> Avg: {avgRain.toFixed(1)}mm/hr
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isWet ? "#38bdf8" : "#facc15",
                    background: isWet ? "rgba(56, 189, 248, 0.2)" : "rgba(250, 204, 21, 0.2)",
                    padding: "4px 8px",
                    borderRadius: 4
                  }}>
                    {isWet ? "BASAH" : "KERING"}
                  </div>
                </div>

                {weatherData.time?.slice(0, 7).map((time: string, idx: number) => {
                  const date = new Date(time);
                  const dayName = date.toLocaleDateString("id-ID", { weekday: "short" });
                  const maxTemp = weatherData.temperature_2m_max[idx];
                  const minTemp = weatherData.temperature_2m_min[idx];
                  const code = weatherData.weathercode[idx];
                  const rain = weatherData.precipitation_sum[idx];

                  return (
                    <div key={idx} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 6,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, width: 85 }}>
                        <span style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, width: 35 }}>{dayName}</span>
                        {getWeatherIcon(code)}
                      </div>
                      <div style={{ flex: 1, color: "var(--text-primary)", fontSize: 11, textAlign: "left" }}>
                        {getWeatherDesc(code)}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, width: 85, justifyContent: "flex-end" }}>
                        {rain > 0 && (
                          <span style={{ color: "#38bdf8", fontSize: 10 }}>{rain}mm</span>
                        )}
                        <div style={{ display: "flex", gap: 4, fontSize: 11, fontWeight: 600 }}>
                          <span style={{ color: "#f8fafc" }}>{Math.round(maxTemp)}°</span>
                          <span style={{ color: "var(--text-muted)" }}>{Math.round(minTemp)}°</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>,
        document.body
      )}
    </div>
  );
}
