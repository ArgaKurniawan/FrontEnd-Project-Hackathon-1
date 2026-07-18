import { Newspaper, Calendar, ArrowUpRight, AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function OperationsPage() {
  const API_URL = process.env.API_URL || "https://waste-api-seven.vercel.app";
  const API_KEY = (process.env.API_KEY || "").trim();

  let news: any[] = [];
  let error: string | null = null;
  let isFallback = false;

  const fallbackData = [
    {
      title: "DKI Uji Coba Penarikan Retribusi Sampah Pelayanan Kebersihan Harian",
      source: "Antara News",
      url: "https://www.antaranews.com/tag/sampah-jakarta",
      date_fetched: new Date().toISOString(),
      summary: "Pemprov DKI Jakarta merencanakan uji coba penarikan retribusi pelayanan kebersihan bagi rumah tangga untuk menekan volume sampah harian dan meningkatkan kesadaran masyarakat."
    },
    {
      title: "Integrasi AI dalam Manajemen Rute Truk Sampah di Jakarta",
      source: "Tech in Asia",
      url: "#",
      date_fetched: new Date().toISOString(),
      summary: "Pemanfaatan kecerdasan buatan (AI) untuk mengoptimalkan rute pengangkutan sampah harian kini mampu menurunkan biaya operasional armada hingga 20%."
    },
    {
      title: "Volume Sampah Plastik Menurun Berkat Kebijakan Pengurangan Kantong Sekali Pakai",
      source: "Kompas",
      url: "#",
      date_fetched: new Date().toISOString(),
      summary: "Data terbaru menunjukkan adanya tren penurunan volume sampah plastik di TPA Bantargebang, seiring dengan efektivitas kebijakan pembatasan penggunaan kantong plastik sekali pakai."
    }
  ];

  try {
    const res = await fetch(`${API_URL}/api/v1/news`, {
      headers: {
        "x-api-key": API_KEY,
      },
      next: { revalidate: 60 }, // Revalidate every minute
    });
    
    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }
    
    let fetchedData = await res.json();
    
    // Fallback if the API returns a 'status: success' wrapper instead of an array
    if (!Array.isArray(fetchedData) && fetchedData.data && Array.isArray(fetchedData.data)) {
      fetchedData = fetchedData.data;
    }
    
    if (!Array.isArray(fetchedData) || fetchedData.length === 0) {
      throw new Error("Format data berita tidak valid atau kosong");
    }

    news = fetchedData;
  } catch (err: any) {
    console.error("Gagal mengambil data dari API, menggunakan local fallback:", err.message);
    news = fallbackData;
    isFallback = true;
  }

  return (
    <div className="page-content">
      <style dangerouslySetInnerHTML={{__html: `
        .news-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
          gap: clamp(12px, 3vw, 24px);
          margin-top: 16px;
        }
        @media (max-width: 480px) {
          .news-grid { grid-template-columns: 1fr; }
        }
        .news-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid var(--border);
          background: var(--surface-card);
          border-radius: var(--radius-lg);
          padding: clamp(12px, 3vw, 18px);
          display: flex;
          flex-direction: column;
          height: 100%;
          position: relative;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
        }
        .news-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(45, 212, 168, 0.10);
          border-color: rgba(45, 212, 168, 0.5);
        }
        .news-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--accent-green), var(--accent-blue));
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .news-card:hover::before {
          opacity: 1;
        }
        .news-source {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 700;
          color: var(--accent-blue);
          background: rgba(56, 189, 248, 0.1);
          padding: 3px 8px;
          border-radius: 100px;
          margin-bottom: 10px;
          align-self: flex-start;
        }
        .news-title {
          font-size: clamp(12px, 3vw, 15px);
          font-weight: 700;
          color: var(--text-heading);
          margin: 0 0 8px 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .news-summary {
          font-size: clamp(11px, 2.5vw, 13px);
          color: var(--text-secondary);
          line-height: 1.55;
          flex-grow: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .news-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
          font-size: 11px;
          color: var(--text-muted);
        }
        .news-icon-wrapper {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(45, 212, 168, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-green);
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        .news-card:hover .news-icon-wrapper {
          background: var(--accent-green);
          color: #fff;
          transform: rotate(45deg);
        }
      `}} />

      {/* Header */}
      <div className="page-header animate-fade-in" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ color: "var(--accent-green)", fontSize: "clamp(15px, 4vw, 20px)", margin: 0 }}>Berita & Update Operasional</h1>
          <p style={{ fontSize: "clamp(11px, 2.5vw, 12px)", margin: "4px 0 0" }}>Informasi terbaru seputar manajemen operasional dan lingkungan.</p>
        </div>
        <div style={{ padding: "4px 10px", background: "rgba(45, 212, 168, 0.1)", borderRadius: "var(--radius-md)", color: "var(--accent-green)", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 11, whiteSpace: "nowrap", flexShrink: 0 }}>
          <Newspaper size={13} />
          {news.length} Berita
        </div>
      </div>

      {isFallback && (
        <div className="animate-fade-in" style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#f59e0b", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={16} /> 
          <strong>Mode Fallback Lokal:</strong> API eksternal saat ini tidak dapat diakses. Menampilkan data cadangan untuk menjamin <em>zero downtime</em>.
        </div>
      )}

      {error && !isFallback && (
        <div style={{ background: "var(--accent-red-dim)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--accent-coral)", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* News Grid */}
      {!error && news.length === 0 ? (
        <div className="card animate-fade-in" style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
          <Newspaper size={48} style={{ margin: "0 auto 16px auto", opacity: 0.2 }} />
          <div>Belum ada berita yang tersedia saat ini.</div>
        </div>
      ) : (
        <div className="news-grid">
          {news.map((item, i) => {
            // Parse date if available
            const dateStr = item.date_fetched || item.date || item.published_at;
            let displayDate = dateStr;
            if (dateStr) {
              try {
                const d = new Date(dateStr);
                displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
              } catch (e) {
                // Ignore parse error
              }
            }

            return (
              <a 
                key={i} 
                href={item.url || "#"} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`news-card animate-fade-in-delay-${(i % 5) + 1}`}
              >
                <div className="news-source">
                  {item.source || "Berita Update"}
                </div>
                
                <h3 className="news-title">
                  {item.title || "Tanpa Judul"}
                </h3>
                
                <div className="news-summary">
                  {item.summary || item.description || "Tidak ada ringkasan yang tersedia untuk berita ini."}
                </div>
                
                <div className="news-footer">
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Calendar size={12} />
                    {displayDate || "Baru saja"}
                  </div>
                  <div className="news-icon-wrapper">
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
