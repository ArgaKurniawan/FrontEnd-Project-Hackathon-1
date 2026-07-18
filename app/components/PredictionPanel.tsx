"use client";

import { Settings } from "lucide-react";

const SELECT_STYLE: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #334155",
  color: "#f8fafc",
  padding: "12px 16px",
  borderRadius: "8px",
  outline: "none",
  fontSize: "14px",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 16px center",
  backgroundSize: "16px",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--text-muted)",
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const OPT = { background: "#0f172a", color: "#ffffff" };

interface PredictionPanelProps {
  areas: any[];
  location: string;
  setLocation: (v: string) => void;
  modelType: string;
  setModelType: (v: string) => void;
  granularity: string;
  setGranularity: (v: string) => void;
  forecastDays: number;
  setForecastDays: (v: number) => void;
  rainfallMm: number;
  setRainfallMm: (v: number) => void;
  eventScale: number;
  setEventScale: (v: number) => void;
  isLoading: boolean;
  error: string | null;
  onPredict: () => void;
}

export default function PredictionPanel({
  areas, location, setLocation,
  modelType, setModelType,
  granularity, setGranularity,
  forecastDays, setForecastDays,
  rainfallMm, setRainfallMm,
  eventScale, setEventScale,
  isLoading, error, onPredict,
}: PredictionPanelProps) {
  return (
    <div
      id="prediction-parameters"
      className="animate-fade-in"
      style={{
        marginBottom: 24,
        padding: "24px 28px",
        background: "#0f172a",
        borderRadius: "12px",
        border: "1px solid #1e293b",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <Settings size={20} style={{ color: "var(--text-secondary)" }} />
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.05em", margin: 0 }}>
          PREDICTION PARAMETERS
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
        {/* Left Column — Dropdowns */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Location */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={LABEL_STYLE}>LOCATION</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)} style={SELECT_STYLE}>
              {areas.length > 0 ? (
                areas.map((area: any) => (
                  <option key={area.id} value={area.name} style={OPT}>{area.name}</option>
                ))
              ) : (
                <option value="Cakung" style={OPT}>Cakung</option>
              )}
            </select>
          </div>

          {/* AI Model */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={LABEL_STYLE}>AI MODEL</label>
            <select value={modelType} onChange={(e) => setModelType(e.target.value)} style={SELECT_STYLE}>
              <option value="chronos" style={OPT}>Chronos Forecasting</option>
              <option value="gradient_boosting" style={OPT}>Gradient Boosting</option>
            </select>
          </div>

          {/* Granularity */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={LABEL_STYLE}>GRANULARITY</label>
            <select value={granularity} onChange={(e) => setGranularity(e.target.value)} style={SELECT_STYLE}>
              <option value="daily" style={OPT}>Daily</option>
              <option value="hourly" style={OPT}>Hourly</option>
            </select>
          </div>
        </div>

        {/* Right Column — Sliders */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Forecast Days */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={LABEL_STYLE}>FORECAST HORIZON</label>
            <input
              type="range" min="1" max="30" value={forecastDays}
              onChange={(e) => setForecastDays(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#f8fafc", cursor: "pointer", borderRadius: "8px" }}
            />
            <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px" }}>{forecastDays} Days</span>
          </div>

          {/* Rainfall */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={LABEL_STYLE}>RAINFALL (mm)</label>
            <input
              type="range" min="0" max="100" step="0.5" value={rainfallMm}
              onChange={(e) => setRainfallMm(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#f8fafc", cursor: "pointer", borderRadius: "8px" }}
            />
            <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px" }}>{rainfallMm} mm</span>
          </div>

          {/* Event Scale */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={LABEL_STYLE}>Crowd Event Scale (0 - 5)</label>
            <input
              type="range" min="1" max="5" value={eventScale}
              onChange={(e) => setEventScale(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#f8fafc", cursor: "pointer", borderRadius: "8px" }}
            />
            <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px" }}>Level {eventScale}</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 20, color: "#fca5a5", fontSize: 13,
          background: "rgba(239,68,68,0.1)", padding: "10px 14px",
          borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)",
        }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onPredict}
          disabled={isLoading}
          style={{
            background: "#6ee7b7", color: "#022c22", fontWeight: 600,
            padding: "10px 24px", borderRadius: "9999px", border: "none",
            cursor: "pointer", opacity: isLoading ? 0.7 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          {isLoading ? "Running Prediction..." : "Run AI Prediction"}
        </button>
      </div>
    </div>
  );
}
