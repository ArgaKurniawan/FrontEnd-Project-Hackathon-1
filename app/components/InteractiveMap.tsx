"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  AlertTriangle,
  Activity,
  Layers,
  RefreshCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────── */
interface MapMarker {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  riskStatus: string;
  volumeTon: number;
  confidenceScore: number;
  avgVolume: number;
  avgConfidence: number;
  totalPredictions: number;
  highRiskCount: number;
  mediumRiskCount: number;
  predictionDate: string | null;
}

interface MapSummary {
  totalAreas: number;
  highRisk: number;
  mediumRisk: number;
  totalVolume: number;
}

interface MapData {
  markers: MapMarker[];
  summary: MapSummary;
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function getRiskColor(status: string): string {
  switch (status) {
    case "HIGH":
      return "#fb7185";
    case "MEDIUM":
      return "#f59e0b";
    case "LOW":
      return "#2dd4a8";
    default:
      return "#94a3b8";
  }
}

function getRiskBg(status: string): string {
  switch (status) {
    case "HIGH":
      return "rgba(251,113,133,0.15)";
    case "MEDIUM":
      return "rgba(245,158,11,0.15)";
    case "LOW":
      return "rgba(45,212,168,0.15)";
    default:
      return "rgba(148,163,184,0.15)";
  }
}

function getRiskLabel(status: string): string {
  switch (status) {
    case "HIGH":
      return "Kritis";
    case "MEDIUM":
      return "Waspada";
    case "LOW":
      return "Normal";
    default:
      return "Tidak Diketahui";
  }
}

function getRiskEmoji(status: string): string {
  switch (status) {
    case "HIGH":
      return "🔴";
    case "MEDIUM":
      return "🟡";
    case "LOW":
      return "🟢";
    default:
      return "⚪";
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Belum ada data";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

/* ─── Custom Icon Builder ────────────────────────────────────────── */
function createCustomIcon(L: any, color: string, riskStatus: string, size: number) {
  const pulseClass = riskStatus === "HIGH" ? "marker-pulse-critical" : riskStatus === "MEDIUM" ? "marker-pulse-warning" : "marker-pulse-normal";
  const iconSize = Math.max(24, Math.min(44, size));

  return L.divIcon({
    className: "custom-map-marker",
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -iconSize / 2],
    html: `
      <div class="marker-outer ${pulseClass}" style="width:${iconSize}px;height:${iconSize}px;">
        <div class="marker-ring" style="border-color:${color};"></div>
        <div class="marker-core" style="background:${color};box-shadow:0 0 12px ${color}80, 0 0 24px ${color}40;"></div>
        <div class="marker-label" style="color:${color};">${getRiskEmoji(riskStatus)}</div>
      </div>
    `,
  });
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function InteractiveMap() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

    // Default center: Jakarta
    const map = L.map(mapContainerRef.current, {
      center: [-6.2, 106.85],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark-themed tile layer (CartoDB Dark Matter)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
        subdomains: "abcd",
      }
    ).addTo(map);

    // Add subtle attribution
    L.control
      .attribution({ position: "bottomleft", prefix: false })
      .addAttribution(
        '&copy; <a href="https://www.openstreetmap.org/copyright" style="color:#5a6f85">OSM</a> &copy; <a href="https://carto.com/" style="color:#5a6f85">CARTO</a>'
      )
      .addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
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

    // Clear existing markers
    markersLayer.clearLayers();

    if (mapData.markers.length === 0) return;

    const bounds: [number, number][] = [];

    mapData.markers.forEach((marker) => {
      const color = getRiskColor(marker.riskStatus);
      const riskLabel = getRiskLabel(marker.riskStatus);
      const riskBg = getRiskBg(marker.riskStatus);
      const markerSize = Math.max(28, Math.min(44, marker.volumeTon / 2));

      // Use custom div icon for richer visual
      const icon = createCustomIcon(L, color, marker.riskStatus, markerSize);

      const leafletMarker = L.marker([marker.latitude, marker.longitude], {
        icon,
      });

      // Rich tooltip with per-area data
      leafletMarker.bindTooltip(
        `<div class="map-tooltip-custom">
          <div class="map-tooltip-header">
            <span class="map-tooltip-dot" style="background:${color}; box-shadow: 0 0 8px ${color}80;"></span>
            <strong>${marker.name}</strong>
            <span class="map-tooltip-status-badge" style="background:${riskBg}; color:${color}; border: 1px solid ${color}40;">
              ${riskLabel}
            </span>
          </div>
          <div class="map-tooltip-body">
            <div class="map-tooltip-row">
              <span>Volume Saat Ini</span>
              <span>${marker.volumeTon.toFixed(1)} ton</span>
            </div>
            <div class="map-tooltip-row">
              <span>Rata-rata Volume</span>
              <span>${marker.avgVolume.toFixed(1)} ton</span>
            </div>
            <div class="map-tooltip-row">
              <span>Confidence</span>
              <span>${(marker.confidenceScore * 100).toFixed(1)}%</span>
            </div>
            <div class="map-tooltip-row">
              <span>Rata-rata Confidence</span>
              <span>${(marker.avgConfidence * 100).toFixed(1)}%</span>
            </div>
            <div class="map-tooltip-row">
              <span>Total Prediksi</span>
              <span>${marker.totalPredictions}</span>
            </div>
            <div class="map-tooltip-divider"></div>
            <div class="map-tooltip-row">
              <span>Kejadian Kritis</span>
              <span style="color:#fb7185; font-weight:700;">${marker.highRiskCount}</span>
            </div>
            <div class="map-tooltip-row">
              <span>Kejadian Waspada</span>
              <span style="color:#f59e0b; font-weight:700;">${marker.mediumRiskCount}</span>
            </div>
          </div>
        </div>`,
        {
          direction: "top",
          offset: [0, -markerSize / 2 - 4],
          className: "map-tooltip-wrapper",
          permanent: false,
        }
      );

      // Click handler
      leafletMarker.on("click", () => {
        setSelectedMarker(marker);
      });

      leafletMarker.addTo(markersLayer);
      bounds.push([marker.latitude, marker.longitude]);
    });

    // Fit map to markers with padding
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [L, mapData]);

  /* ── Zoom Controls ── */
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    if (!mapInstanceRef.current || !mapData?.markers.length) return;
    const bounds: [number, number][] = mapData.markers.map((m) => [
      m.latitude,
      m.longitude,
    ]);
    mapInstanceRef.current.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 14,
    });
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
        style={{
          width: "100%",
          height: "100%",
          background: "var(--bg-card)",
        }}
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
          <span
            style={{
              color: "var(--accent-coral)",
              fontSize: 13,
              marginTop: 8,
            }}
          >
            {error}
          </span>
          <button
            className="btn"
            onClick={fetchMapData}
            style={{ marginTop: 12, fontSize: 12 }}
          >
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
            Live Collection Network
          </h2>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            Peta interaktif — hover untuk info, klik marker untuk detail
          </p>
        </div>

        {/* Summary Badges */}
        {mapData && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div className="map-stat-pill">
              <Layers size={13} />
              <span>{mapData.summary.totalAreas} Area</span>
            </div>
            {mapData.summary.highRisk > 0 && (
              <div className="map-stat-pill map-stat-pill-danger">
                <AlertTriangle size={13} />
                <span>{mapData.summary.highRisk} Kritis</span>
              </div>
            )}
            {mapData.summary.mediumRisk > 0 && (
              <div className="map-stat-pill map-stat-pill-warning">
                <AlertTriangle size={13} />
                <span>{mapData.summary.mediumRisk} Waspada</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="map-zoom-controls">
        <button
          className="map-zoom-btn"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          className="map-zoom-btn"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <div
          style={{
            height: 1,
            background: "var(--border-primary)",
            margin: "2px 4px",
          }}
        />
        <button
          className="map-zoom-btn"
          onClick={handleRecenter}
          title="Recenter"
        >
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

      {/* Legend */}
      <div className="interactive-map-legend">
        <div className="map-legend-item">
          <span
            className="dot"
            style={{ background: "#2dd4a8", width: 8, height: 8, boxShadow: "0 0 6px #2dd4a880" }}
          />
          Normal (&lt;20t)
        </div>
        <div className="map-legend-item">
          <span
            className="dot"
            style={{ background: "#f59e0b", width: 8, height: 8, boxShadow: "0 0 6px #f59e0b80" }}
          />
          Waspada (20-40t)
        </div>
        <div className="map-legend-item">
          <span
            className="dot"
            style={{ background: "#fb7185", width: 8, height: 8, boxShadow: "0 0 6px #fb718580" }}
          />
          Kritis (&gt;40t)
        </div>
      </div>

      {/* Selected Marker Detail Panel */}
      {selectedMarker && (
        <div className="map-detail-panel">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: getRiskColor(selectedMarker.riskStatus),
                    boxShadow: `0 0 8px ${getRiskColor(selectedMarker.riskStatus)}80`,
                  }}
                />
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-heading)",
                    margin: 0,
                  }}
                >
                  {selectedMarker.name}
                </h3>
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  margin: "2px 0 0",
                }}
              >
                {selectedMarker.latitude.toFixed(4)},{" "}
                {selectedMarker.longitude.toFixed(4)}
              </p>
            </div>
            <button
              onClick={() => setSelectedMarker(null)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px 8px",
                fontSize: 11,
              }}
            >
              ✕
            </button>
          </div>

          {/* Status Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              background: getRiskBg(selectedMarker.riskStatus),
              color: getRiskColor(selectedMarker.riskStatus),
              border: `1px solid ${getRiskColor(selectedMarker.riskStatus)}40`,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            {getRiskEmoji(selectedMarker.riskStatus)} Status:{" "}
            {getRiskLabel(selectedMarker.riskStatus)}
          </div>

          <div className="map-detail-grid">
            <div className="map-detail-item">
              <span className="map-detail-label">VOLUME SAAT INI</span>
              <span className="map-detail-value">
                {selectedMarker.volumeTon.toFixed(1)}{" "}
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  ton
                </span>
              </span>
            </div>
            <div className="map-detail-item">
              <span className="map-detail-label">RATA-RATA VOLUME</span>
              <span className="map-detail-value">
                {selectedMarker.avgVolume.toFixed(1)}{" "}
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  ton
                </span>
              </span>
            </div>
            <div className="map-detail-item">
              <span className="map-detail-label">CONFIDENCE</span>
              <span className="map-detail-value">
                {(selectedMarker.confidenceScore * 100).toFixed(1)}%
              </span>
            </div>
            <div className="map-detail-item">
              <span className="map-detail-label">RATA-RATA CONFIDENCE</span>
              <span className="map-detail-value">
                {(selectedMarker.avgConfidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="map-detail-item">
              <span className="map-detail-label">TOTAL PREDIKSI</span>
              <span className="map-detail-value">
                {selectedMarker.totalPredictions}
              </span>
            </div>
            <div className="map-detail-item">
              <span className="map-detail-label">PREDIKSI TERAKHIR</span>
              <span
                className="map-detail-value"
                style={{ fontSize: 12 }}
              >
                {formatDate(selectedMarker.predictionDate)}
              </span>
            </div>
          </div>

          {/* Risk History */}
          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 8,
            }}
          >
            <div
              style={{
                flex: 1,
                background: "rgba(251,113,133,0.1)",
                border: "1px solid rgba(251,113,133,0.2)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 10px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fb7185" }}>
                {selectedMarker.highRiskCount}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Kritis
              </div>
            </div>
            <div
              style={{
                flex: 1,
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 10px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b" }}>
                {selectedMarker.mediumRiskCount}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Waspada
              </div>
            </div>
          </div>

          {/* Capacity bar */}
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "var(--text-muted)",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              <span>Kapasitas</span>
              <span>{selectedMarker.volumeTon.toFixed(1)} / 100 ton</span>
            </div>
            <div className="progress-bar" style={{ height: 4 }}>
              <div
                className="fill"
                style={{
                  width: `${Math.min(100, (selectedMarker.volumeTon / 100) * 100)}%`,
                  background: `linear-gradient(90deg, ${getRiskColor(selectedMarker.riskStatus)}, ${getRiskColor(selectedMarker.riskStatus)}88)`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        className="map-refresh-btn"
        onClick={fetchMapData}
        disabled={isLoading}
        title="Refresh data"
      >
        <RefreshCw size={14} className={isLoading ? "map-spin" : ""} />
      </button>
    </div>
  );
}
