"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchAutopilotData } from "@/services/wasteService";
import dynamic from "next/dynamic";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
import { 
  Truck, 
  Scale, 
  CloudRain, 
  Calendar, 
  Map, 
  MapPin, 
  CheckCircle2, 
  Building, 
  Locate, 
  PieChart, 
  AlertTriangle,
  Loader2
} from "lucide-react";
const MapComponent = dynamic(() => import("./MapComponent"), { 
  ssr: false,
  loading: () => <div style={{ height: "400px", background: "#1e293b", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#a0aec0" }}>Memuat Peta...</div>
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
        setError("Gagal mengambil data. Silakan coba lagi.");
        setIsLoading(false);
      });
  }, []);

  const summary = useMemo(() => {
    if (!data || !data.top_kecamatan) return null;
    const locations = data.top_kecamatan;
    const count = locations.length;
    const totalVolume = locations.reduce((acc: number, curr: any) => acc + (curr.volume_ton || 0), 0);
    const totalTrucks = locations.reduce((acc: number, curr: any) => acc + (curr.trucks || 0), 0);
    const avgVolume = count > 0 ? (totalVolume / count).toFixed(2) : 0;
    const avgTrucks = count > 0 ? Math.round(totalTrucks / count) : 0;
    const criticalCount = locations.filter((l: any) => l.status === "CRITICAL" || l.status === "DANGER").length;

    return {
      count,
      totalVolume: totalVolume.toFixed(2),
      totalTrucks,
      avgVolume,
      avgTrucks,
      status: criticalCount > 0 ? "WARNING" : "NORMAL",
      criticalCount
    };
  }, [data]);

  // Render loading skeleton
  if (isLoading) {
    return (
      <div style={styles.pageContainer}>
         <div style={styles.header}>
            <h1 style={styles.pageTitle}>
              <Truck size={24} style={{ marginRight: '10px', color: '#4299e1' }} />
              Autopilot Operations Dashboard
            </h1>
         </div>
         <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#e2e8f0' }}>
            <Loader2 size={48} className="animate-spin" />
            <span style={{ marginLeft: '15px', fontSize: '18px' }}>Memuat Data Autopilot...</span>
         </div>
      </div>
    );
  }

  // Render Error
  if (error) {
    return (
      <div style={styles.pageContainer}>
        <div style={{ ...styles.card, borderLeft: "4px solid #f56565" }}>
          <h2 style={{ color: "#f56565", fontSize: '20px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={24} />
            Error
          </h2>
          <p style={{ color: "#e2e8f0" }}>{error}</p>
        </div>
      </div>
    );
  }

  // Handle empty data
  if (!data) {
    return (
      <div style={styles.pageContainer}>
         <div style={styles.card}>
            <p style={{ color: "#a0aec0", textAlign: "center" }}>Data kosong atau tidak tersedia.</p>
         </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

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
        .card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 12px rgba(0, 0, 0, 0.4);
        }
        .metric-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 18px !important;
        }
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .metric-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        .metric-title {
          font-size: 13px;
          font-weight: 600;
          color: #a0aec0;
          margin: 0;
        }
        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0;
        }
        .metric-unit {
          font-size: 14px;
          font-weight: 500;
          color: #718096;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .badge-success { background: rgba(72, 187, 120, 0.2); color: #48bb78; }
        .badge-warning { background: rgba(236, 201, 75, 0.2); color: #ecc94b; }
        .badge-danger { background: rgba(245, 101, 101, 0.2); color: #f56565; }
        .badge-info { background: rgba(66, 153, 225, 0.2); color: #4299e1; }
        
        .list-item {
          padding: 15px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .list-item:last-child {
          border-bottom: none;
        }
        
        @media (max-width: 1024px) {
          .top-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .mid-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .top-grid { grid-template-columns: 1fr !important; }
          .summary-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* 1. HEADER SECTION */}
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>
          <Truck size={24} style={{ marginRight: '12px', color: '#4299e1' }} />
          Autopilot Operations Dashboard
        </h1>
        <div className="badge badge-success" style={{ fontSize: '14px', padding: '6px 12px' }}>
          <CheckCircle2 size={16} style={{ marginRight: '6px' }} /> API CONNECTED
        </div>
      </div>

      {/* 2. TOP SECTION - 4 Metric Cards */}
      <div className="top-grid" style={styles.topGrid}>
        
        {/* Card 1 */}
        <div style={styles.card} className="card-hover metric-card">
          <div className="metric-header">
            <h3 className="metric-title">TOTAL VOLUME</h3>
            <div className="metric-icon" style={{ background: 'rgba(66, 153, 225, 0.1)', color: '#4299e1' }}>
              <Scale size={20} />
            </div>
          </div>
          <div>
            <h2 className="metric-value">
              {formatNumber(data.total_volume_ton || 0)} <span className="metric-unit">Ton</span>
            </h2>
          </div>
          <div>
            <span className="badge badge-success">SAFE</span>
          </div>
        </div>

        {/* Card 2 */}
        <div style={styles.card} className="card-hover metric-card">
          <div className="metric-header">
            <h3 className="metric-title">TOTAL TRUCKS</h3>
            <div className="metric-icon" style={{ background: 'rgba(72, 187, 120, 0.1)', color: '#48bb78' }}>
              <Truck size={20} />
            </div>
          </div>
          <div>
            <h2 className="metric-value">
              {formatNumber(data.total_trucks || 0)} <span className="metric-unit">Armada</span>
            </h2>
          </div>
          <div>
            <span className="badge badge-success">SAFE</span>
          </div>
        </div>

        {/* Card 3 */}
        <div style={styles.card} className="card-hover metric-card">
          <div className="metric-header">
            <h3 className="metric-title">RAINY REGIONS</h3>
            <div className="metric-icon" style={{ background: 'rgba(236, 201, 75, 0.1)', color: '#ecc94b' }}>
              <CloudRain size={20} />
            </div>
          </div>
          <div>
            <h2 className="metric-value">
              {formatNumber(data.rainy_regions || 0)} <span className="metric-unit">Wilayah</span>
            </h2>
          </div>
          <div>
            <span className={`badge ${data.rainy_regions > 0 ? 'badge-warning' : 'badge-success'}`}>
              {data.rainy_regions > 0 ? 'WASPADA' : 'CERAH / SUNNY'}
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div style={styles.card} className="card-hover metric-card">
          <div className="metric-header">
            <h3 className="metric-title">TANGGAL OPERASI</h3>
            <div className="metric-icon" style={{ background: 'rgba(159, 122, 234, 0.1)', color: '#9f7aea' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div>
            <h2 className="metric-value" style={{ fontSize: '20px', marginTop: '4px' }}>
              {formatDate(data.date)}
            </h2>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <span className="badge badge-info">UPDATED HARI INI</span>
          </div>
        </div>

      </div>

      {/* 3. MIDDLE SECTION */}
      <div className="mid-grid" style={styles.midGrid}>
        
        {/* Kiri: Peta */}
        <div style={styles.card} className="card-hover">
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <Map size={20} style={{ marginRight: '10px', color: '#4299e1' }} />
              Peta Lokasi Operasi
            </h3>
          </div>
          <div style={{ borderRadius: '10px', overflow: 'hidden', height: '400px' }}>
            <MapComponent locations={data.top_kecamatan || []} />
          </div>
        </div>

        {/* Kanan: Detail */}
        <div style={styles.card} className="card-hover">
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <MapPin size={20} style={{ marginRight: '10px', color: '#f56565' }} />
              Detail Lokasi (Top Kecamatan)
            </h3>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '400px', paddingRight: '10px' }}>
            {data.top_kecamatan && data.top_kecamatan.length > 0 ? (
              data.top_kecamatan.map((loc: any, idx: number) => {
                let badgeClass = "badge-success";
                let s = (loc.status || "").toUpperCase();
                if (s === "CRITICAL" || s === "DANGER") badgeClass = "badge-danger";
                else if (s === "WARNING" || s === "WASPADA") badgeClass = "badge-warning";

                return (
                  <div key={idx} className="list-item">
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>
                        {loc.location}
                      </div>
                      <div style={{ fontSize: '13px', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building size={14} /> {loc.city}</span>
                        {loc.latitude && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Locate size={14} /> {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        {loc.volume_ton}T / {loc.trucks} <Truck size={14} />
                      </div>
                      <span className={`badge ${badgeClass}`} style={{ fontSize: '10px' }}>{loc.status}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: '#a0aec0', textAlign: 'center', marginTop: '20px' }}>Tidak ada data lokasi.</p>
            )}
          </div>
        </div>

      </div>

      {/* 4. BOTTOM SECTION: Conclusion */}
      {summary && (
        <div style={styles.card} className="card-hover">
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <PieChart size={20} style={{ marginRight: '10px', color: '#48bb78' }} />
              Kesimpulan Data Top Kecamatan
            </h3>
          </div>
          <div className="summary-grid" style={styles.summaryGrid}>
            
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
              <div style={styles.summaryValue}>{summary.avgVolume} Ton</div>
            </div>
            
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Average Trucks / Kec</div>
              <div style={styles.summaryValue}>{summary.avgTrucks} Armada</div>
            </div>
            
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Status Operasi</div>
              <div style={{ ...styles.summaryValue, color: summary.status === 'NORMAL' ? '#48bb78' : '#ecc94b' }}>
                {summary.status}
              </div>
            </div>
            
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Active Locations</div>
              <div style={styles.summaryValue}>{summary.count}</div>
            </div>
            
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Event Today</div>
              <div style={styles.summaryValue}>
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
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    backgroundColor: '#0f172a',
    minHeight: '100vh',
    fontFamily: 'var(--font-sans)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  pageTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#f8fafc',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  topGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px'
  },
  midGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px'
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '15px',
    padding: '25px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
  },
  cardHeader: {
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#f8fafc',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
  },
  summaryItem: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  summaryLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#a0aec0',
    marginBottom: '8px',
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#e2e8f0',
  }
};
