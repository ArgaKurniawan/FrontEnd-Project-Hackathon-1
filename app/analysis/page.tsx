"use client";

import { useState, useEffect } from "react";
import { fetchAnalyticsData } from "@/services/wasteService";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Bell,
  HelpCircle,
  User,
  Calendar,
  MapPin,
  Download,
  MoreVertical,
  Filter,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

/* ─── Custom Tooltip ───────────────────────────────────────────────── */
function CustomAreaTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--radius-md)",
        padding: "12px 16px",
        fontSize: 12,
      }}
    >
      <div style={{ color: "var(--text-secondary)", marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span className="dot" style={{ background: p.color, width: 6, height: 6 }} />
          <span style={{ color: "var(--text-primary)" }}>{p.name}: <strong>{p.value}T</strong></span>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────── */
export default function AnalysisPage() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData()
      .then((data) => {
        setAnalyticsData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const compositionTrends = analyticsData?.compositionTrends || [];
  const volumeByZone = analyticsData?.volumeByZone || [];
  const stats = analyticsData?.stats || [
    { label: "TOTAL VOLUME COLLECTED", value: "-", unit: "Tons", trend: "-", positive: true },
    { label: "OVERALL RECYCLING RATE", value: "-", unit: "%", trend: "-", positive: true },
    { label: "CONTAMINATION INCIDENTS", value: "-", unit: "Events", trend: "-", positive: false },
    { label: "OPERATIONAL COST / TON", value: "-", unit: "$", trend: "-", positive: true },
  ];

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
            margin: 0,
          }}
        >
          Detailed Waste Analysis
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 6 }}>
            <Bell size={18} />
          </button>
          <button style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 6 }}>
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

      {/* ── Filters Row ── */}
      <div
        className="animate-fade-in"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              TIMEFRAME
            </span>
            <div className="filter-pill">
              <Calendar size={14} />
              Last 30 Days
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              COLLECTION ZONE
            </span>
            <div className="filter-pill">
              <MapPin size={14} />
              All Zones (Aggregated)
            </div>
          </div>
        </div>
        <button className="btn" style={{ gap: 6 }}>
          <Download size={14} />
          Export Report
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="stats-grid">
        {stats.map((stat: any, i: number) => (
          <div
            key={i}
            className={`stat-card animate-fade-in-delay-${i + 1}`}
          >
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">
              {stat.prefix && (
                <span style={{ fontSize: 16, fontWeight: 400, color: "var(--text-secondary)" }}>
                  {stat.prefix}
                </span>
              )}
              {stat.value}
              <span className="unit"> {stat.unit}</span>
            </div>
            <div className={`stat-trend ${stat.positive ? "positive" : "negative"}`}>
              {stat.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Grid ── */}
      <div className="two-col-grid">
        {/* ── Waste Composition Trends ── */}
        <div className="card animate-fade-in-delay-2">
          <div className="card-header">
            <span className="card-title">Waste Composition Trends</span>
            <button
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <MoreVertical size={16} />
            </button>
          </div>
          <div style={{ width: "100%", height: 240 }}>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Loading data...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={compositionTrends}>
                  <defs>
                    <linearGradient id="gradOrganic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2dd4a8" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#2dd4a8" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradPlastic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradPaper" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#5a6f85" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#5a6f85" }}
                  />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="paper"
                    stackId="1"
                    stroke="#94a3b8"
                    fill="url(#gradPaper)"
                    strokeWidth={2}
                    name="Paper/Cardboard"
                  />
                  <Area
                    type="monotone"
                    dataKey="plastic"
                    stackId="1"
                    stroke="#38bdf8"
                    fill="url(#gradPlastic)"
                    strokeWidth={2}
                    name="Plastic"
                  />
                  <Area
                    type="monotone"
                    dataKey="organic"
                    stackId="1"
                    stroke="#2dd4a8"
                    fill="url(#gradOrganic)"
                    strokeWidth={2}
                    name="Organic"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div
            style={{
              display: "flex",
              gap: 20,
              marginTop: 12,
              justifyContent: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
              <span className="dot dot-green" /> Organic
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
              <span className="dot dot-blue" /> Plastic
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
              <span className="dot dot-gray" /> Paper/Cardboard
            </div>
          </div>
        </div>

        {/* ── Volume by Zone ── */}
        <div className="card animate-fade-in-delay-3">
          <div className="card-header">
            <span className="card-title">Volume by Zone</span>
            <button
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <Filter size={16} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {isLoading ? (
              <div style={{ padding: 20, textAlign: 'center' }}>Loading zones...</div>
            ) : volumeByZone.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No data available</div>
            ) : volumeByZone.map((zone: any, i: number) => (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                    {zone.zone}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: zone.color,
                    }}
                  >
                    {zone.value} T
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="fill"
                    style={{
                      width: `${(zone.value / zone.max) * 100}%`,
                      background: zone.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
