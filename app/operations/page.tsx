"use client";

import {
  Truck,
  Users,
  Trash2,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

/* ─── Mock Data ────────────────────────────────────────────────────── */
const operationsStats = [
  {
    label: "Active Fleet",
    value: "24",
    fraction: "/30",
    trend: "+2 from yesterday",
    positive: true,
    icon: Truck,
    iconColor: "#2dd4a8",
  },
  {
    label: "Staff on Duty",
    value: "42",
    subtitle: "94% Attendance Rate",
    icon: Users,
    iconColor: "#38bdf8",
  },
  {
    label: "Est. Waste Volume",
    value: "18.5",
    unit: "tons",
    trend: "High volume alert",
    positive: false,
    icon: Trash2,
    iconColor: "#f59e0b",
  },
  {
    label: "Efficiency Score",
    value: "92",
    unit: "%",
    progress: 92,
    icon: CheckCircle,
    iconColor: "#2dd4a8",
  },
];

/* ─── Page ─────────────────────────────────────────────────────────── */
export default function OperationsPage() {
  return (
    <div className="page-content">
      {/* ── Header ── */}
      <div className="page-header animate-fade-in">
        <h1 style={{ color: "var(--accent-green)" }}>Operations Management</h1>
        <p>Fleet deployment, staff scheduling, and resource estimation.</p>
      </div>

      {/* ── Stats Grid ── */}
      <div className="stats-grid">
        {operationsStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className={`stat-card animate-fade-in-delay-${i + 1}`}
            >
              <div className="stat-label">
                {stat.label}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--radius-md)",
                    background: `${stat.iconColor}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={16} style={{ color: stat.iconColor }} />
                </div>
              </div>
              <div className="stat-value">
                {stat.value}
                {stat.fraction && (
                  <span className="fraction">{stat.fraction}</span>
                )}
                {stat.unit && <span className="unit"> {stat.unit}</span>}
              </div>
              {stat.trend && (
                <div className={`stat-trend ${stat.positive ? "positive" : "negative"}`}>
                  <TrendingUp size={12} />
                  {stat.trend}
                </div>
              )}
              {stat.subtitle && (
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {stat.subtitle}
                </div>
              )}
              {stat.progress !== undefined && (
                <div className="progress-bar" style={{ marginTop: 4 }}>
                  <div
                    className="fill"
                    style={{
                      width: `${stat.progress}%`,
                      background: "var(--accent-green)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
