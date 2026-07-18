"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Activity, Users, Clock, Truck } from "lucide-react";

/* ─── Custom Tooltip ─────────────────────────────────────────────── */
function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-light)",
      borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 12,
    }}>
      <div style={{ color: "var(--text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ color: "var(--text-heading)", fontWeight: 600 }}>{payload[0].value} ton</div>
    </div>
  );
}

/* ─── Props ──────────────────────────────────────────────────────── */
interface PredictionResultsProps {
  wasteBreakdown: { name: string; value: number; color: string }[];
  riskDonutData: { name: string; value: number; color: string }[];
  riskStatusText: string;
  predictionData: any;
  totalVolume: number;
  staffCount: number;
  manHours: number;
  recommendedTrucks: number;
  isLoading: boolean;
}

/* ─── Empty State ────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{
      marginTop: 24, textAlign: "center", padding: "60px 20px",
      background: "var(--bg-card)", borderRadius: "var(--radius-lg)",
      border: "1px dashed var(--border-primary)",
    }}>
      <Activity size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
      <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
        Belum Ada Data Prediksi
      </h3>
      <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
        Silakan atur parameter di atas dan klik &quot;Run AI Prediction&quot; untuk melihat hasil kalkulasi.
      </p>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function PredictionResults({
  wasteBreakdown, riskDonutData, riskStatusText,
  predictionData, totalVolume, staffCount,
  manHours, recommendedTrucks, isLoading,
}: PredictionResultsProps) {
  if (!predictionData) return <EmptyState />;

  const riskColor =
    riskStatusText === "WARNING" ? "var(--accent-orange)" :
    riskStatusText === "HIGH"    ? "var(--accent-coral)"  :
    "var(--accent-green)";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-4 mt-6">

      {/* ── Waste Composition Breakdown ── */}
      <div className="card animate-fade-in-delay-1">
        <div className="card-header">
          <span className="card-title">Waste Composition Breakdown</span>
          <div style={{
            fontSize: 11, fontWeight: 600, color: "var(--text-heading)",
            background: "var(--bg-input)", padding: "4px 8px", borderRadius: "var(--radius-sm)",
          }}>
            TOTAL: {totalVolume.toFixed(2)} TON
          </div>
        </div>
        <div style={{ width: "100%", height: 200 }}>
          {wasteBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wasteBreakdown} barSize={42}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5a6f85" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5a6f85" }} />
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

      {/* ── Risk Status ── */}
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
                data={riskDonutData} cx="50%" cy="50%"
                innerRadius={50} outerRadius={68}
                startAngle={90} endAngle={-270}
                dataKey="value" stroke="none"
              >
                {riskDonutData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center">
            <div className="label" style={{ fontSize: 16, color: riskColor }}>{riskStatusText}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <div style={{
            background: riskStatusText === "WARNING" ? "var(--accent-orange-dim)" :
              riskStatusText === "HIGH" ? "var(--accent-red-dim)" : "rgba(45,212,168,0.1)",
            border: riskStatusText === "WARNING" ? "1px solid rgba(245,158,11,0.2)" :
              riskStatusText === "HIGH" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(45,212,168,0.2)",
            borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: 12, color: riskColor,
          }}>
            {predictionData?.message || `Status Risiko: ${riskStatusText}`}
          </div>
        </div>
      </div>

      {/* ── Manpower & Fleet ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Manpower */}
        <div className="card animate-fade-in-delay-3" style={{ padding: "16px 20px" }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Manpower &amp; Logistics</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  REQUIRED STAFF
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-heading)" }}>
                  {isLoading ? "-" : staffCount}
                </div>
              </div>
              <Users size={20} style={{ color: "var(--accent-green)" }} />
            </div>
            <div style={{ height: 1, background: "var(--border-primary)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  EST. DURATION
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-heading)" }}>
                  {isLoading ? "-" : manHours}{" "}
                  <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-secondary)" }}>hrs</span>
                </div>
              </div>
              <Clock size={20} style={{ color: "var(--accent-blue)" }} />
            </div>
          </div>
        </div>

        {/* Fleet */}
        <div className="card animate-fade-in-delay-4" style={{ padding: "16px 20px", flex: 1 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Recommended Fleet</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Truck size={14} style={{ color: "var(--text-muted)" }} />
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{recommendedTrucks} Trucks Needed</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 11 }}>For {totalVolume.toFixed(1)} tons of waste</div>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-coral)" }}>Dispatch</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
