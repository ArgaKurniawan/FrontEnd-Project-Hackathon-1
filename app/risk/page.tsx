"use client";

import {
  Shield,
  AlertOctagon,
  Target,
  Filter,
  Download,
  ArrowUp,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

/* ─── Mock Data ────────────────────────────────────────────────────── */
const heatmapData = [
  // row 0
  ["nominal","nominal","warning","critical","warning","nominal","empty","nominal","nominal","warning"],
  // row 1
  ["nominal","empty","critical","critical","warning","nominal","nominal","empty","empty","nominal"],
  // row 2
  ["nominal","nominal","warning","warning","warning","nominal","warning","nominal","nominal","warning"],
  // row 3
  ["nominal","warning","warning","critical","critical","warning","warning","empty","nominal","empty"],
  // row 4
  ["empty","warning","empty","warning","empty","nominal","empty","nominal","warning","nominal"],
];

const nodeAlerts = [
  { name: "Sortation Hub B", utilization: 98, status: "Critical", color: "#fb7185" },
  { name: "Transfer Station 4", utilization: 85, status: "Warning", color: "#f59e0b" },
  { name: "Organic Processing Unit", utilization: 82, status: "Warning", color: "#f59e0b" },
  { name: "Inbound Weighbridge East", utilization: 65, status: "Nominal", color: "#38bdf8" },
];

const historyLog = [
  {
    timestamp: "Today, 08:14 AM",
    node: "Sortation Hub B",
    issueType: "Capacity Overload",
    severity: "CRITICAL",
    severityType: "critical",
    status: "Active",
    statusIcon: "dot-red",
  },
  {
    timestamp: "Today, 07:30 AM",
    node: "Sector 4, Belt C",
    issueType: "Bio-Contamination",
    severity: "HIGH",
    severityType: "warning",
    status: "Mitigating",
    statusIcon: "dot-orange",
  },
  {
    timestamp: "Yesterday, 14:22 PM",
    node: "Transfer Station 1",
    issueType: "Mechanical Failure",
    severity: "CRITICAL",
    severityType: "critical",
    status: "Resolved",
    statusIcon: "dot-green",
  },
  {
    timestamp: "Yesterday, 09:05 AM",
    node: "Inbound Weighbridge East",
    issueType: "Sensor Desync",
    severity: "LOW",
    severityType: "neutral",
    status: "Resolved",
    statusIcon: "dot-green",
  },
];

/* ─── Page ─────────────────────────────────────────────────────────── */
export default function RiskPage() {
  return (
    <div className="page-content">
      {/* ── Header ── */}
      <div className="page-header animate-fade-in">
        <h1>Risk Assessment</h1>
        <p>
          Real-time monitoring of operational hazards, contamination spread, and node capacity
          bottlenecks across the logistics network.
        </p>
      </div>

      {/* ── Stats Cards ── */}
      <div
        className="animate-fade-in-delay-1"
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* System Risk Level */}
        <div className="stat-card">
          <div className="stat-label">
            SYSTEM RISK LEVEL
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md)",
                background: "rgba(251,113,133,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Shield size={16} style={{ color: "#fb7185" }} />
            </div>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "var(--accent-green)",
              letterSpacing: "0.04em",
              marginTop: 4,
            }}
          >
            ELEVATED
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <div className="progress-bar" style={{ flex: 1 }}>
              <div
                className="fill"
                style={{
                  width: "75%",
                  background: "linear-gradient(90deg, #2dd4a8, #f59e0b, #fb7185)",
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
              75/100 Index
            </span>
          </div>
        </div>

        {/* Active Bottlenecks */}
        <div className="stat-card">
          <div className="stat-label">
            ACTIVE BOTTLENECKS
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md)",
                background: "rgba(245,158,11,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertOctagon size={16} style={{ color: "#f59e0b" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <span className="stat-value">12</span>
            <span style={{ fontSize: 12, color: "var(--accent-coral)", display: "flex", alignItems: "center", gap: 3 }}>
              <ArrowUp size={12} /> 3 since 08:00
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            Primary constraint: Node Alpha-7
          </div>
        </div>

        {/* Mitigation Rate */}
        <div className="stat-card">
          <div className="stat-label">
            MITIGATION RATE
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md)",
                background: "rgba(45,212,168,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Target size={16} style={{ color: "#2dd4a8" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <span className="stat-value">94.2<span className="unit">%</span></span>
            <span style={{ fontSize: 12, color: "var(--accent-green)", display: "flex", alignItems: "center", gap: 3 }}>
              <ArrowUp size={12} /> 1.5% 24h
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            Target &gt; 95.0% adherence
          </div>
        </div>
      </div>

      {/* ── Middle Grid: Heatmap + Node Alerts ── */}
      <div className="two-col-grid animate-fade-in-delay-2">
        {/* Facility Contamination Risk */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Facility Contamination Risk</span>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span className="dot" style={{ background: "#94a3b8", width: 7, height: 7 }} /> Nominal
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span className="dot" style={{ background: "#f59e0b", width: 7, height: 7 }} /> Warning
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span className="dot" style={{ background: "#fb7185", width: 7, height: 7 }} /> Critical
              </div>
            </div>
          </div>
          <div className="heatmap-grid">
            {heatmapData.flat().map((cell, i) => (
              <div
                key={i}
                className={`heatmap-cell heatmap-${cell}`}
              />
            ))}
          </div>
        </div>

        {/* Node Capacity Alerts */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Node Capacity Alerts</span>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {nodeAlerts.map((node, i) => (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 6,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {node.name}
                    </div>
                    <div style={{ fontSize: 11, color: node.color }}>
                      {node.utilization}% Utilization - {node.status}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: node.color,
                    }}
                  >
                    {node.utilization}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="fill"
                    style={{
                      width: `${node.utilization}%`,
                      background: node.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── History Log ── */}
      <div className="card animate-fade-in-delay-3">
        <div className="card-header">
          <div>
            <span className="card-title" style={{ fontSize: 18, fontWeight: 700 }}>
              History Log
            </span>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              Recent risk alerts and current mitigation status.
            </div>
          </div>
          <button className="btn" style={{ fontSize: 12, gap: 6 }}>
            <Download size={14} />
            Export CSV
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>TIMESTAMP</th>
              <th>NODE / LOCATION</th>
              <th>ISSUE TYPE</th>
              <th>SEVERITY</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {historyLog.map((row, i) => (
              <tr key={i}>
                <td>{row.timestamp}</td>
                <td>{row.node}</td>
                <td>{row.issueType}</td>
                <td>
                  <span className={`badge badge-${row.severityType}`}>
                    {row.severity}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {row.status === "Active" && <XCircle size={14} style={{ color: "#fb7185" }} />}
                    {row.status === "Mitigating" && <Clock size={14} style={{ color: "#f59e0b" }} />}
                    {row.status === "Resolved" && <CheckCircle2 size={14} style={{ color: "#2dd4a8" }} />}
                    <span
                      style={{
                        color:
                          row.status === "Active"
                            ? "#fb7185"
                            : row.status === "Mitigating"
                            ? "#f59e0b"
                            : "#2dd4a8",
                        fontWeight: 500,
                      }}
                    >
                      {row.status}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
