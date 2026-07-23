"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchAutopilotData } from "@/services/wasteService";
import dynamic from "next/dynamic";

import { 
  Truck, 
  Scale, 
  CloudRain, 
  Calendar, 
  Map, 
  MapPin, 
  Building, 
  Locate, 
  AlertTriangle,
  Loader2,
  Sparkles,
  Info,
  PieChart
} from "lucide-react";

const MapComponent = dynamic(() => import("./MapComponent"), { 
  ssr: false,
  loading: () => (
    <div style={{ height: "450px", background: "var(--bg-input)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: 12 }}>
      <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
      <span style={{ fontSize: "13px" }}>Memuat Peta Autopilot...</span>
    </div>
  )
});

export default function AutopilotDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAutopilotData()
      .then((res) => {
        const payload = res.data ? res.data : res;
        setData(payload);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Gagal mengambil data Autopilot. Silakan coba lagi.");
        setIsLoading(false);
      });
  }, []);

  const summary = useMemo(() => {
    if (!data || !data.top_kecamatan) return null;
    const locations = data.top_kecamatan;
    const count = locations.length;
    const totalVolume = locations.reduce((acc: number, curr: any) => acc + (curr.volume_ton || 0), 0);
    const totalTrucks = locations.reduce((acc: number, curr: any) => acc + (curr.trucks || 0), 0);
    const criticalCount = locations.filter((l: any) => l.status === "CRITICAL" || l.status === "DANGER" || l.status === "DARURAT").length;

    return {
      count,
      totalVolume: totalVolume.toFixed(1),
      totalTrucks,
      status: criticalCount > 0 ? "WARNING" : "OPTIMAL",
      criticalCount
    };
  }, [data]);

  if (isLoading) {
    return (
      <div style={styles.pageContainer}>
         <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)', gap: 12 }}>
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
            <span style={{ fontSize: '14px' }}>Sinkronisasi Data Autopilot...</span>
         </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.pageContainer}>
        <div className="card" style={{ borderLeft: "4px solid var(--accent-red)", padding: "16px 20px" }}>
          <h3 style={{ color: "var(--accent-red)", fontSize: '16px', margin: "0 0 8px 0", display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> Gagal Sinkronisasi
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div style={styles.pageContainer}>
      <style>{`
        .list-row {
          padding: 12px 0;
          border-bottom: 1px solid var(--border-primary);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .list-row:last-child {
          border-bottom: none;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 6px;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Autopilot Operations Dashboard
          </h1>
          <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
            Monitoring sistem pengangkutan otomatis dan telemetri data wilayah.
          </p>
        </div>
      </div>

      {/* AI Directives Card (Consolidated) */}
      <div className="card" style={{ padding: "14px 18px", border: "1px solid rgba(56, 189, 248, 0.2)", display: "flex", alignItems: "center", gap: 12 }}>
        <Info size={16} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
        <span style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.45 }}>
          {summary?.criticalCount && summary.criticalCount > 0 ? (
            <>Sistem mendeteksi <strong style={{ color: "var(--accent-coral)" }}>{summary.criticalCount} wilayah kritis</strong>. Direkomendasikan melakukan rotasi pengangkutan sebelum potensi hujan.</>
          ) : (
            <>Seluruh wilayah operasional dalam status <strong style={{ color: "var(--accent-green)" }}>optimal</strong>. Kebutuhan armada berjalan sesuai jadwal rutin.</>
          )}
        </span>
      </div>

      {/* Main Workspace: Split Screen Map & Details */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
        
        {/* Left Side: Map Container */}
        <div className="card" style={{ padding: "18px" }}>
          <div className="card-title" style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
            <Map size={16} style={{ color: "var(--text-muted)" }} />
            Peta Lokasi Operasi
          </div>
          <div style={{ borderRadius: "var(--radius-sm)", overflow: "hidden", height: "450px", border: "1px solid var(--border-primary)" }}>
            <MapComponent locations={data.top_kecamatan || []} />
          </div>
        </div>

        {/* Right Side: Simple Kecamatan List */}
        <div className="card" style={{ padding: "18px" }}>
          <div className="card-title" style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 15 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin size={16} style={{ color: "var(--text-muted)" }} />
              Daftar Lokasi Terpantau
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {data.top_kecamatan?.length || 0} Kecamatan
            </span>
          </div>
          
          <div style={{ overflowY: "auto", maxHeight: "450px", paddingRight: 4 }} className="no-scrollbar">
            {data.top_kecamatan && data.top_kecamatan.length > 0 ? (
              data.top_kecamatan.map((loc: any, idx: number) => {
                let statusColor = "var(--accent-green)";
                let s = (loc.status || "").toUpperCase();
                
                if (s === "CRITICAL" || s === "DANGER" || s === "DARURAT") {
                  statusColor = "var(--accent-coral)";
                } else if (s === "WARNING" || s === "WASPADA" || s === "SEDANG") {
                  statusColor = "var(--accent-orange)";
                }

                return (
                  <div key={idx} className="list-row">
                    <div>
                      <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {loc.location}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Building size={11} /> {loc.city}</span>
                        {loc.latitude && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Locate size={11} /> {loc.latitude.toFixed(3)}, {loc.longitude.toFixed(3)}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                        {loc.volume_ton}T <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>({loc.trucks} Truk)</span>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                        <span className="status-dot" style={{ backgroundColor: statusColor }} />
                        {loc.status || "NORMAL"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "40px", fontSize: 13 }}>Tidak ada data lokasi.</p>
            )}
          </div>
        </div>

      </div>

      {/* 5. BOTTOM SECTION: EXECUTIVE SUMMARY (Restored) */}
      {summary && (
        <div className="card" style={{ padding: "20px" }}>
          <div className="card-title" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
            <PieChart size={18} style={{ color: "var(--text-muted)" }} />
            Kesimpulan Data Top Kecamatan
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Total Kecamatan</div>
              <div style={styles.summaryValue}>{summary.count} Lokasi</div>
            </div>
            
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Total Volume</div>
              <div style={styles.summaryValue}>{formatNumber(Number(summary.totalVolume))} Ton</div>
            </div>
            
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Total Trucks</div>
              <div style={styles.summaryValue}>{formatNumber(summary.totalTrucks)} Armada</div>
            </div>
            
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Average Volume / Kec</div>
              <div style={styles.summaryValue}>{(Number(summary.totalVolume) / Math.max(1, summary.count)).toFixed(2)} Ton</div>
            </div>
            
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Average Trucks / Kec</div>
              <div style={styles.summaryValue}>{Math.round(summary.totalTrucks / Math.max(1, summary.count))} Armada</div>
            </div>
            
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Status Operasi</div>
              <div style={{ ...styles.summaryValue, color: summary.status === 'OPTIMAL' ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                {summary.status}
              </div>
            </div>
            
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Active Locations</div>
              <div style={styles.summaryValue}>{summary.count}</div>
            </div>
            
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Event Today</div>
              <div style={{ ...styles.summaryValue, color: summary.criticalCount > 0 ? 'var(--accent-coral)' : 'var(--text-primary)' }}>
                {summary.criticalCount > 0 ? `${summary.criticalCount} Critical` : 'None'}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    padding: 'clamp(14px, 4vw, 24px)',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  summaryItem: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    padding: '18px 24px',
    borderRadius: '10px',
    border: '1px solid var(--border-primary)',
  },
  summaryLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '8px',
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  }
};
