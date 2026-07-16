"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import * as XLSX from "xlsx";
import { fetchPrediction, fetchAnalyticsData, fetchAllReports, fetchAreas } from "@/services/wasteService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Bell,
  User,
  Clock,
  Users,
  Truck,
  Settings,
  Activity
} from "lucide-react";

const InteractiveMap = dynamic(() => import("@/app/components/InteractiveMap"), {
  ssr: false,
});

/* ─── Custom Tooltip ───────────────────────────────────────────────── */
function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        fontSize: 12,
      }}
    >
      <div style={{ color: "var(--text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ color: "var(--text-heading)", fontWeight: 600 }}>
        {payload[0].value} ton
      </div>
    </div>
  );
}

/* ─── Smooth Scroll Helper ─────────────────────────────────────── */
function smoothScrollTo(targetId: string, duration = 900) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const start = window.scrollY;
  const end = target.getBoundingClientRect().top + window.scrollY - 16;
  const distance = end - start;
  const startTime = performance.now();

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function step(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, start + distance * easeInOutCubic(progress));
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/* ─── Page ─────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  // New States for Prediction
  const [areas, setAreas] = useState<any[]>([]);
  const [location, setLocation] = useState("JIS");
  const [forecastDays, setForecastDays] = useState(7);
  const [startDate, setStartDate] = useState("2026-07-10");
  const [rainfallMm, setRainfallMm] = useState(15.5);
  const [eventScale, setEventScale] = useState(2);
  const [granularity, setGranularity] = useState("daily");
  const [modelType, setModelType] = useState("chronos");

  const [predictionData, setPredictionData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to run prediction
  const handlePredict = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        location,
        forecast_days: forecastDays,
        start_date: startDate,
        rainfall_mm: rainfallMm,
        event_scale: eventScale,
        granularity,
        model_type: modelType
      };

      const result = await fetchPrediction(payload);
      setPredictionData(result);
    } catch (err: any) {
      console.error("Prediction error:", err);
      setError("Gagal memuat data prediksi. Silakan periksa koneksi atau coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Run on first load to fetch areas
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const areaData = await fetchAreas();
        if (areaData && areaData.length > 0) {
          setAreas(areaData);
          setLocation(areaData[0].name);
        }

        // Fetch analytics data (untuk map dots, existing logic)
        const analytics = await fetchAnalyticsData();
        setAnalyticsData(analytics);
      } catch (err: any) {
        console.error("Initial data error:", err);
      }
    };
    loadInitialData();
  }, []);

  // Export Report Logic
  const generateNewReport = async () => {
    try {
      const allReports = await fetchAllReports();
      if (allReports && allReports.length > 0) {
        const reportData = allReports.map((log: any) => {
          const volume = log.volume_ton || 0;
          const foodWaste = parseFloat((volume * 0.51).toFixed(2));
          const plastic = parseFloat((volume * 0.18).toFixed(2));
          const recommendedTrucks = Math.max(1, Math.ceil(volume / 8));
          const calculatedStaff = recommendedTrucks * 3;
          const manHours = calculatedStaff * 8;

          return {
            "ID": log.id,
            "Tanggal Prediksi": new Date(log.prediction_date).toLocaleString(),
            "Lokasi": log.area?.name || "Unknown",
            "Total Volume (Ton)": volume,
            "Sisa Makanan (Ton)": foodWaste,
            "Plastik (Ton)": plastic,
            "Rekomendasi Truk": recommendedTrucks,
            "Estimasi Staff": calculatedStaff,
            "Jam Kerja": manHours,
            "Status Risiko": log.risk_status || "-",
            "Confidence Score": log.confidence_score ? `${(log.confidence_score * 100).toFixed(0)}%` : "-",
          };
        });

        const worksheet = XLSX.utils.json_to_sheet(reportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Semua Data Report");

        XLSX.writeFile(workbook, `Waste_Report_All_${new Date().getTime()}.xlsx`);
        alert("File Excel berhasil diunduh!");
      }
    } catch (excelErr) {
      console.error("Gagal export excel:", excelErr);
      alert("Gagal mengunduh report.");
    }
  };

  // Mapping data untuk Recharts — Aggregated across ALL forecast days
  const wasteBreakdown = useMemo(() => {
    if (!predictionData) return [];
    const allResults: any[] = predictionData.data?.prediction_results ?? [];
    if (allResults.length === 0) return [];

    const sum = (key: string) =>
      parseFloat(allResults.reduce((acc: number, r: any) => acc + (r[key] ?? 0), 0).toFixed(2));

    return [
      { name: "Organik",  value: sum("organic_waste_ton"),  color: "#2dd4a8" },
      { name: "Plastik",  value: sum("plastic_waste_ton"),  color: "#38bdf8" },
      { name: "Kertas",   value: sum("paper_waste_ton"),    color: "#94a3b8" },
      { name: "Kaca",     value: sum("glass_waste_ton"),    color: "#fcd34d" },
      { name: "Metal",    value: sum("metal_waste_ton"),    color: "#f87171" },
      { name: "Tekstil",  value: sum("textile_waste_ton"),  color: "#a78bfa" },
      { name: "Lainnya",  value: sum("other_waste_ton"),    color: "#f472b6" },
    ].filter(item => item.value > 0);
  }, [predictionData]);

  const riskDonutData = useMemo(() => {
    const score = predictionData?.confidence_score ? predictionData.confidence_score * 100 : 75;
    return [
      { name: "Risk",      value: score,       color: "#fb7185" },
      { name: "Remaining", value: 100 - score, color: "#1e3048" },
    ];
  }, [predictionData]);

  // Derive worst risk status across all forecast days
  const riskStatusText = useMemo(() => {
    const allResults: any[] = predictionData?.data?.prediction_results ?? [];
    if (allResults.length === 0) return "Menghitung...";
    const priority: Record<string, number> = { HIGH: 4, WARNING: 3, MEDIUM: 2, SAFE: 1, LOW: 0 };
    const worst = allResults.reduce((worst: any, r: any) => {
      const w = priority[r.risk_status] ?? -1;
      const b = priority[worst?.risk_status] ?? -1;
      return w > b ? r : worst;
    }, allResults[0]);
    return worst?.risk_status || "Menghitung...";
  }, [predictionData]);

  // Derived values for UI — logistics plan already covers total forecast period
  const staffCount        = predictionData?.data?.logistics_plan?.manpower ?? 0;
  const manHours          = predictionData?.data?.logistics_plan?.estimated_duration_hours ?? 0;
  const recommendedTrucks = predictionData?.data?.logistics_plan?.trucks_needed ?? 0;

  // Total volume = sum of all forecast days
  const totalVolume = useMemo(() => {
    const allResults: any[] = predictionData?.data?.prediction_results ?? [];
    return parseFloat(
      allResults.reduce((acc: number, r: any) => acc + (r.total_volume_ton ?? 0), 0).toFixed(2)
    );
  }, [predictionData]);

  return (
    <div className="page-content">
      {/* ── Top Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text-heading)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Waste Prediction Dashboard
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: 6,
            }}
          >
            <Bell size={18} />
          </button>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--accent-green-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-green)",
            }}
          >
            <User size={16} />
          </div>
        </div>
      </div>

      {/* ── Map Section ── */}
      <div style={{ marginBottom: 24 }}>
        <InteractiveMap 
          selectedLocation={location}
          onSelectLocation={(name) => {
            setLocation(name);
          }} 
        />
      </div>

      {/* ── Prediction Controls ── */}
      <div
        id="prediction-parameters"
        className="animate-fade-in"
        style={{
          marginBottom: 24,
          padding: "24px 28px",
          background: "#0f172a",
          borderRadius: "12px",
          border: "1px solid #1e293b",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <Settings size={20} style={{ color: "var(--text-secondary)" }} />
          <h2 style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "0.05em",
            margin: 0
          }}>
            PREDICTION PARAMETERS
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "48px",
          alignItems: "start"
        }}>
          {/* Left Column - Dropdowns */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Location */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>LOCATION</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
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
                  backgroundSize: "16px"
                }}
              >
                {areas.length > 0 ? (
                  areas.map((area: any) => (
                    <option key={area.id} value={area.name} style={{ background: "#0f172a", color: "#ffffff" }}>
                      {area.name}
                    </option>
                  ))
                ) : (
                  <option value="Cakung" style={{ background: "#0f172a", color: "#ffffff" }}>Cakung</option>
                )}
              </select>
            </div>

            {/* Model Type */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>AI MODEL</label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                style={{
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
                  backgroundSize: "16px"
                }}
              >
                <option value="chronos" style={{ background: "#0f172a", color: "#ffffff" }}>Chronos Forecasting</option>
                <option value="gradient_boosting" style={{ background: "#0f172a", color: "#ffffff" }}>Gradient Boosting</option>
              </select>
            </div>

            {/* Granularity */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>GRANULARITY</label>
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value)}
                style={{
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
                  backgroundSize: "16px"
                }}
              >
                <option value="daily" style={{ background: "#0f172a", color: "#ffffff" }}>Daily</option>
                <option value="hourly" style={{ background: "#0f172a", color: "#ffffff" }}>Hourly</option>
              </select>
            </div>
          </div>

          {/* Right Column - Sliders */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Forecast Days */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                FORECAST HORIZON
              </label>
              <input
                type="range"
                min="1" max="30"
                value={forecastDays}
                onChange={(e) => setForecastDays(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#f8fafc", cursor: "pointer", borderRadius: "8px" }}
              />
              <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px" }}>{forecastDays} Days</span>
            </div>

            {/* Rainfall */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                RAINFALL (mm)
              </label>
              <input
                type="range"
                min="0" max="100" step="0.5"
                value={rainfallMm}
                onChange={(e) => setRainfallMm(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#f8fafc", cursor: "pointer", borderRadius: "8px" }}
              />
              <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px" }}>{rainfallMm} mm</span>
            </div>

            {/* Event Scale */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Crowd Event Scale (0 - 5)
              </label>
              <input
                type="range"
                min="1" max="5"
                value={eventScale}
                onChange={(e) => setEventScale(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#f8fafc", cursor: "pointer", borderRadius: "8px" }}
              />
              <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px" }}>Level {eventScale}</span>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: 20,
            color: "#fca5a5",
            fontSize: 13,
            background: "rgba(239, 68, 68, 0.1)",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid rgba(239, 68, 68, 0.2)"
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handlePredict}
            disabled={isLoading}
            style={{
              background: "#6ee7b7",
              color: "#022c22",
              fontWeight: 600,
              padding: "10px 24px",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              opacity: isLoading ? 0.7 : 1,
              transition: "opacity 0.2s ease"
            }}
          >
            {isLoading ? "Running Prediction..." : "Run AI Prediction"}
          </button>
        </div>
      </div>


      {/* ── Bottom Grid: 3 columns ── */}
      {!predictionData ? (
        <div style={{ marginTop: 24, textAlign: "center", padding: "60px 20px", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border-primary)" }}>
          <Activity size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Belum Ada Data Prediksi</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Silakan atur parameter di atas dan klik "Run AI Prediction" untuk melihat hasil kalkulasi.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gap: 16,
            marginTop: 24
          }}
        >
          {/* ── Ringkasan Limbah ── */}
          <div className="card animate-fade-in-delay-1">
            <div className="card-header">
              <span className="card-title">Waste Composition Breakdown</span>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-heading)",
                  background: "var(--bg-input)",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                TOTAL: {totalVolume.toFixed(2)} TON
              </div>
            </div>
            <div style={{ width: "100%", height: 200 }}>
              {wasteBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wasteBreakdown} barSize={42}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#5a6f85" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#5a6f85" }}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {wasteBreakdown.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                  No composition data available
                </div>
              )}
            </div>
          </div>

          {/* ── Status Risiko ── */}
          <div className="card animate-fade-in-delay-2">
            <div className="card-header">
              <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                Risk Status
                <Activity size={16} style={{ color: "var(--accent-orange)" }} />
              </span>
            </div>
            <div style={{ position: "relative", width: "100%", height: 160, display: "flex", justifyContent: "center" }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={riskDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    {riskDonutData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <div className="label" style={{
                  fontSize: 16,
                  color: riskStatusText === "WARNING" ? "var(--accent-orange)" :
                    riskStatusText === "HIGH" ? "var(--accent-coral)" : "var(--accent-green)"
                }}>
                  {riskStatusText}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              <div
                style={{
                  background: riskStatusText === "WARNING" ? "var(--accent-orange-dim)" :
                    riskStatusText === "HIGH" ? "var(--accent-red-dim)" : "rgba(45,212,168,0.1)",
                  border: riskStatusText === "WARNING" ? "1px solid rgba(245,158,11,0.2)" :
                    riskStatusText === "HIGH" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(45,212,168,0.2)",
                  borderRadius: "var(--radius-md)",
                  padding: "8px 12px",
                  fontSize: 12,
                  color: riskStatusText === "WARNING" ? "var(--accent-orange)" :
                    riskStatusText === "HIGH" ? "var(--accent-coral)" : "var(--accent-green)",
                }}
              >
                {predictionData?.message || `Status Risiko: ${riskStatusText}`}
              </div>
            </div>
          </div>

          {/* ── Operasional & Logistik ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Operasional */}
            <div className="card animate-fade-in-delay-3" style={{ padding: "16px 20px" }}>
              <div className="card-title" style={{ marginBottom: 12 }}>Manpower & Logistics</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      REQUIRED STAFF
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-heading)" }}>{isLoading ? "-" : staffCount}</div>
                  </div>
                  <Users size={20} style={{ color: "var(--accent-green)" }} />
                </div>
                <div
                  style={{
                    height: 1,
                    background: "var(--border-primary)",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      EST. DURATION
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-heading)" }}>
                      {isLoading ? "-" : manHours} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-secondary)" }}>hrs</span>
                    </div>
                  </div>
                  <Clock size={20} style={{ color: "var(--accent-blue)" }} />
                </div>
              </div>
            </div>

            {/* Rekomendasi Truk */}
            <div className="card animate-fade-in-delay-4" style={{ padding: "16px 20px", flex: 1 }}>
              <div className="card-title" style={{ marginBottom: 12 }}>Recommended Fleet</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Truck size={14} style={{ color: "var(--text-muted)" }} />
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{recommendedTrucks} Trucks Needed</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                        For {totalVolume.toFixed(1)} tons of waste
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--accent-coral)"
                    }}
                  >
                    Dispatch
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Export Button ── */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-start" }}>
        <button
          className="btn"
          style={{ padding: "10px 24px" }}
          onClick={generateNewReport}
        >
          Export Report
        </button>
      </div>

    </div>
  );
}
