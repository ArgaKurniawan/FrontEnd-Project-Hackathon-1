"use client";

import React, { useMemo } from "react";
import { Truck, Users, Calendar, AlertTriangle, Lightbulb, Pickaxe, Wallet, PiggyBank, ArrowRight } from "lucide-react";

export default function DecisionSupportPanel({ dashboard }: { dashboard: any }) {
  const { predictionData, totalVolume, staffCount, manHours, recommendedTrucks, isLoading } = dashboard;

  const results = predictionData?.data?.prediction_results || [];

  const costAnalysis = useMemo(() => {
    // Standard assumed constants for estimation
    const WAGE_PER_HOUR = 25000;
    const TRUCK_COST_PER_DAY = 800000;
    const BASELINE_DAILY_COST = 5000000; // Baseline assumption to show savings

    // Asumsi: manHours dari API ternyata merepresentasikan Total Waktu Operasional atau angka kumulatif.
    // Jika kita kalikan lagi dengan staffCount, angkanya akan menjadi kuadrat (pembengkakan ganda).
    // Oleh karena itu, kita asumsikan setiap "staff" bekerja 1 shift (8 jam), atau kita hanya hitung total jamnya saja.
    // Kita gunakan standar 8 jam kerja per pekerja untuk menghitung upah riil:
    const workerCost = staffCount * 8 * WAGE_PER_HOUR; 
    
    // Asumsi truk dikalikan jumlah hari agar realistis (atau gunakan flat jika API memberikan total truk untuk seluruh periode)
    const truckCost = recommendedTrucks * TRUCK_COST_PER_DAY; 
    const totalCost = workerCost + truckCost;
    
    // Calculate theoretical savings
    const assumedBaselineTotal = BASELINE_DAILY_COST * (results.length || 1);
    const savings = Math.max(0, assumedBaselineTotal - totalCost);
    const savingsPercent = assumedBaselineTotal > 0 ? (savings / assumedBaselineTotal) * 100 : 0;
    
    return {
      workerCost,
      truckCost,
      totalCost,
      savings,
      savingsPercent
    }
  }, [staffCount, manHours, recommendedTrucks, results.length]);

  const truckBreakdown = useMemo(() => {
    // Heuristic: 60% Big Trucks, 40% Small Pick-ups
    const big = Math.round(recommendedTrucks * 0.6);
    const small = recommendedTrucks - big;
    return { big, small };
  }, [recommendedTrucks]);

  const scheduleHeatmap = useMemo(() => {
    return results.map((r: any, idx: number) => {
        // Evaluate load to determine status and color
        let status = "OPTIMAL";
        let color = "var(--accent-green)";
        let bg = "var(--accent-green-dim)";
        
        if (r.risk_status === "HIGH" || r.risk_status === "WARNING") {
            status = "KRITIS";
            color = "var(--accent-red)";
            bg = "var(--accent-red-dim)";
        } else if ((r.total_volume_ton || 0) > 30) {
            status = "WASPADA";
            color = "var(--accent-orange)";
            bg = "var(--accent-orange-dim)";
        }

        // Get day of week
        const dateObj = new Date(r.date);
        const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
        const dayName = isNaN(dateObj.getTime()) ? `H+${idx+1}` : days[dateObj.getDay()];

        const trucks = r.recommended_trucks || Math.ceil((r.total_volume_ton || 0)/8);
        const shifts = trucks >= 65 ? 3 : 2;

        return {
            day: dayName,
            fullDate: r.date || `Hari ${idx+1}`,
            volume: (r.total_volume_ton || 0).toFixed(1),
            trucks,
            shifts,
            status,
            color,
            bg
        }
    });
  }, [results]);

  const actionPlans = useMemo(() => {
      const plans = [];
      const isOvertime = manHours > (staffCount * 8);

      if (isOvertime) {
          plans.push("Prioritas 1: Indikasi lembur/overload terdeteksi. Pertimbangkan untuk menambah shift pekerja atau alihkan armada cadangan.");
      }
      if (recommendedTrucks > 15) {
          plans.push("Prioritas 2: Volume sampah memuncak. Pastikan seluruh armada besar beroperasi penuh dan maksimalkan ritase pagi hari.");
      }
      if (scheduleHeatmap.some((d: any) => d.status === "KRITIS")) {
          plans.push("Prioritas 3: Terdapat hari berstatus KRITIS di jadwal. Pantau ketersediaan armada pihak ketiga jika kapasitas internal tidak mencukupi.");
      }
      if (plans.length === 0 && results.length > 0) {
          plans.push("Status Optimal: Beban kerja stabil. Lanjutkan operasional harian sesuai dengan rencana standar.");
      }
      return plans;
  }, [manHours, staffCount, recommendedTrucks, results.length, scheduleHeatmap]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  if (!predictionData || isLoading || results.length === 0) return null;

  return (
    <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 16 }}>
       <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
           <Lightbulb size={24} style={{ color: "var(--accent-blue)" }} />
           <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>Decision Support System</h2>
       </div>
       
       {/* Executive Summary Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="stat-card">
               <div className="stat-label">Total Volume Prediksi</div>
               <div className="stat-value">{totalVolume.toFixed(1)} <span className="unit">Ton</span></div>
               <div className="stat-trend" style={{ color: "var(--text-secondary)" }}>
                   Selama {results.length} Hari Ke Depan
               </div>
           </div>
           
           <div className="stat-card">
               <div className="stat-label">Estimasi Biaya Operasional</div>
               <div className="stat-value" style={{ fontSize: "clamp(20px, 4vw, 26px)" }}>{formatIDR(costAnalysis.totalCost)}</div>
               <div className="stat-trend" style={{ color: "var(--text-secondary)" }}>
                   Total Anggaran Logistik & SDM
               </div>
           </div>

           <div className="stat-card" style={{ border: "1px solid rgba(45, 212, 168, 0.3)", background: "var(--accent-green-dim)" }}>
               <div className="stat-label" style={{ color: "var(--accent-green)" }}>Estimasi Penghematan AI</div>
               <div className="stat-value" style={{ fontSize: "clamp(20px, 4vw, 26px)", color: "var(--accent-green)" }}>
                   {formatIDR(costAnalysis.savings)}
               </div>
               <div className="stat-trend positive">
                   Menurunkan biaya {costAnalysis.savingsPercent.toFixed(1)}%
               </div>
           </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
           {/* Schedule Heatmap */}
           <div className="card">
               <div className="card-header">
                   <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                       <Calendar size={18} style={{ color: "var(--accent-teal)" }} />
                       Peta Beban Kerja Harian
                   </span>
               </div>
               <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }} className="no-scrollbar">
                   {scheduleHeatmap.map((dayData: any, i: number) => (
                       <div key={i} style={{ 
                           flex: 1, 
                           minWidth: 80,
                           background: "var(--bg-input)", 
                           borderRadius: "var(--radius-md)", 
                           overflow: "hidden",
                           border: "1px solid var(--border-primary)",
                           display: "flex",
                           flexDirection: "column"
                       }}>
                           <div style={{ background: dayData.bg, color: dayData.color, fontSize: 11, fontWeight: 700, textAlign: "center", padding: "6px 0", textTransform: "uppercase" }}>
                               {dayData.day}
                           </div>
                           <div style={{ padding: "10px 0", textAlign: "center", display: "flex", flexDirection: "column", gap: 4 }}>
                               <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-heading)" }}>{dayData.volume}</div>
                               <div style={{ fontSize: 10, color: "var(--text-muted)" }}>TON</div>
                           </div>
                           <div style={{ background: "rgba(0,0,0,0.15)", padding: "6px 0", textAlign: "center", fontSize: 11, color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                               <Truck size={12} /> {dayData.trucks}
                           </div>
                           <div style={{ padding: "6px 0", textAlign: "center", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, color: dayData.color, borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                               <span>{dayData.shifts} SHIFT</span>
                           </div>
                       </div>
                   ))}
               </div>
           </div>

           {/* Resource & Actions Panel */}
           <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
               {/* Resource Allocation */}
               <div className="card" style={{ padding: "16px 20px" }}>
                    <div className="card-title" style={{ marginBottom: 12 }}>Alokasi Armada Spesifik</div>
                    <div className="grid grid-cols-2 gap-4">
                        <div style={{ background: "var(--bg-input)", padding: 12, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ padding: 10, background: "rgba(56, 189, 248, 0.15)", borderRadius: "var(--radius-sm)", color: "var(--accent-blue)" }}>
                                <Truck size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-heading)" }}>{truckBreakdown.big} Unit</div>
                                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Truk Besar (Dump Truck)</div>
                            </div>
                        </div>
                        <div style={{ background: "var(--bg-input)", padding: 12, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ padding: 10, background: "rgba(245, 158, 11, 0.15)", borderRadius: "var(--radius-sm)", color: "var(--accent-orange)" }}>
                                <Truck size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-heading)" }}>{truckBreakdown.small} Unit</div>
                                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Armada Kecil (Pick-up)</div>
                            </div>
                        </div>
                    </div>
               </div>

               {/* Action Plans */}
               <div className="card" style={{ padding: "16px 20px", flex: 1, border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    <div className="card-title" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                        <AlertTriangle size={18} style={{ color: "var(--accent-red)" }} />
                        Rencana Aksi Kritis
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {actionPlans.map((plan, i) => (
                            <div key={i} style={{ 
                                display: "flex", 
                                gap: 10, 
                                fontSize: 13, 
                                color: "var(--text-primary)",
                                background: "var(--bg-input)",
                                padding: "10px 14px",
                                borderRadius: "var(--radius-sm)",
                                borderLeft: "3px solid var(--accent-orange)"
                            }}>
                                <ArrowRight size={16} style={{ color: "var(--accent-orange)", flexShrink: 0, marginTop: 2 }} />
                                <span style={{ lineHeight: 1.5 }}>{plan}</span>
                            </div>
                        ))}
                    </div>
               </div>
           </div>
       </div>
    </div>
  );
}
