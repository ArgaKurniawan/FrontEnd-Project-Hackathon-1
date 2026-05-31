"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchWasteDashboardData, fetchLatestDashboardData, fetchAnalyticsData } from "@/services/wasteService";
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
  HelpCircle,
  User,
  Search,
  MapPin,
  Clock,
  Users,
  Truck,
  TrendingUp,
  Plus,
} from "lucide-react";
import InteractiveMap from "@/app/components/InteractiveMap";

/* ─── Mock Data ────────────────────────────────────────────────────── */
// mapDots are now dynamically fetched from the API

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

/* ─── Page ─────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch API function (Reads latest from DB)
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch waste dashboard data from Prisma
      try {
        const result = await fetchLatestDashboardData();
        setDashboardData(result);
      } catch (err: any) {
        console.error("Dashboard data error:", err);
        setError("Gagal memuat sebagian data dashboard.");
      }

      // Fetch analytics data (untuk map dots)
      try {
        const analytics = await fetchAnalyticsData();
        setAnalyticsData(analytics);
      } catch (err: any) {
        console.error("Analytics data error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate new prediction (POST)
  const generateNewReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchWasteDashboardData("JIS", 50000);
      setDashboardData(result);
      // Refresh analytics too
      const analytics = await fetchAnalyticsData();
      setAnalyticsData(analytics);
    } catch (err: any) {
      console.error("Generate report error:", err);
      setError("Gagal membuat report baru.");
    } finally {
      setIsLoading(false);
    }
  };

  const mapDots = useMemo(() => {
    return analyticsData?.mapDots || [];
  }, [analyticsData]);

  // Panggil saat halaman dimuat
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Mapping data untuk Recharts
  const wasteBreakdown = useMemo(() => {
    if (!dashboardData) return [];
    const summary = dashboardData.data?.waste_summary;
    if (!summary) return [];
    const otherTon = Math.max(0, summary.total_volume_ton - summary.total_food_waste_ton - summary.total_plastic_ton);
    return [
      { name: "Organic", value: Number(summary.total_food_waste_ton.toFixed(1)), color: "#2dd4a8" },
      { name: "Plastik", value: Number(summary.total_plastic_ton.toFixed(1)), color: "#38bdf8" },
      { name: "Lainnya", value: Number(otherTon.toFixed(1)), color: "#94a3b8" },
    ];
  }, [dashboardData]);

  const riskDonutData = useMemo(() => {
    const score = dashboardData?.confidence_score ? dashboardData.confidence_score * 100 : 75;
    return [
      { name: "Risk", value: score, color: "#fb7185" },
      { name: "Remaining", value: 100 - score, color: "#1e3048" },
    ];
  }, [dashboardData]);

  const truckRecommendations = useMemo(() => {
    const recs = dashboardData?.data?.prediction_results?.[0]?.rekomendasi_truk;
    if (!recs || !Array.isArray(recs)) return [];
    return recs.map((truck: any) => ({
      type: truck.jenis_truk || "Truck",
      area: dashboardData.data.location || "Area",
      volume: `${truck.kapasitas_ton} ton`,
      action: "Dispatch"
    }));
  }, [dashboardData]);

  const riskStatusText = dashboardData?.data?.database_log?.risk_status || "Menghitung...";
  const staffCount = dashboardData?.data?.prediction_results?.[0]?.calculated_staff || 0;
  const manHours = dashboardData?.data?.prediction_results?.[0]?.man_hours || 0;

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
          Waste Intelligence System
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-card)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-full)",
              padding: "8px 16px",
              width: 280,
            }}
          >
            <Search size={15} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search..."
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontSize: 13,
                width: "100%",
              }}
            />
          </div>
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
          <button
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: 6,
            }}
          >
            <HelpCircle size={18} />
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
      <InteractiveMap />

      {/* ── Bottom Grid: 3 columns ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr",
          gap: 16,
        }}
      >
        {/* ── Ringkasan Limbah ── */}
        <div className="card animate-fade-in-delay-1">
          <div className="card-header">
            <span className="card-title">Ringkasan Limbah</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              HARIAN
            </span>
          </div>
          <div style={{ width: "100%", height: 200 }}>
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
          </div>
        </div>

        {/* ── Status Risiko ── */}
        <div className="card animate-fade-in-delay-2">
          <div className="card-header">
            <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Status Risiko
              <span style={{ color: "var(--accent-orange)" }}>⚠</span>
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
              <div className="label" style={{ fontSize: 14 }}>{riskStatusText}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <div
              style={{
                background: riskStatusText === "HIGH" ? "var(--accent-red-dim)" : "rgba(45,212,168,0.1)",
                border: riskStatusText === "HIGH" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(45,212,168,0.2)",
                borderRadius: "var(--radius-md)",
                padding: "8px 12px",
                fontSize: 12,
                color: riskStatusText === "HIGH" ? "var(--accent-coral)" : "var(--accent-green)",
              }}
            >
              Status Risiko: {riskStatusText}. {isLoading ? "Memuat data..." : error ? `Error: ${error}` : "Data termonitor dari API."}
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: "var(--radius-md)",
                padding: "8px 12px",
                fontSize: 12,
                color: "var(--text-secondary)",
              }}
            >
              Contamination level nominal.
            </div>
          </div>
        </div>

        {/* ── Operasional + Rekomendasi Truk ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Operasional */}
          <div className="card animate-fade-in-delay-3" style={{ padding: "16px 20px" }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Operasional</div>
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
                    ESTIMASI STAFF
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
                    JAM KERJA
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
            <div className="card-title" style={{ marginBottom: 12 }}>Rekomendasi Truk</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {truckRecommendations.map((truck, i) => (
                <div
                  key={i}
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
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{truck.type}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                        {truck.area} • {truck.volume}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color:
                        truck.action === "Dispatch"
                          ? "var(--accent-coral)"
                          : truck.action === "Standby"
                          ? "var(--accent-orange)"
                          : "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {truck.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Generate Report Button ── */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-start" }}>
        <button 
          className="btn btn-primary" 
          style={{ padding: "12px 28px", borderRadius: "var(--radius-lg)", opacity: isLoading ? 0.7 : 1 }}
          onClick={generateNewReport}
          disabled={isLoading}
        >
          {isLoading ? (
             <span style={{ fontSize: 14 }}>Loading API...</span>
          ) : (
            <>
              <Plus size={16} />
              Generate Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}
