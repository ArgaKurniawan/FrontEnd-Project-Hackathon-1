import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Stats
    const stats = [
      {
        label: "TOTAL VOLUME COLLECTED",
        value: "4,587.7",
        unit: "Tons",
        trend: "+4.2% vs last period",
        positive: true,
      },
      {
        label: "OVERALL RECYCLING RATE",
        value: "42.8",
        unit: "%",
        trend: "+1.5% vs last period",
        positive: true,
      },
      {
        label: "CONTAMINATION INCIDENTS",
        value: "4",
        unit: "Events",
        trend: "-2.1% vs last period",
        positive: false,
      },
      {
        label: "OPERATIONAL COST / TON",
        value: "286.750",
        unit: "",
        prefix: "Rp",
        trend: "-1.2% vs last period",
        positive: true,
      },
    ];

    // 2. Volume By Zone (Total = 4587.7)
    const volumeByZone = [
      { zone: "pasar senen", value: 2834.1, color: "#2dd4a8", max: 3000 },
      { zone: "jis", value: 1240.5, color: "#38bdf8", max: 3000 },
      { zone: "gang sempit tambora", value: 424.4, color: "#6366f1", max: 3000 },
      { zone: "gbk", value: 88.7, color: "#fb7185", max: 3000 },
    ];

    // 3. Composition Trends (May 2 - May 30)
    const compositionTrends = [
      { date: "May 2", organic: 500, plastic: 150, paper: 100 },
      { date: "May 9", organic: 550, plastic: 155, paper: 95 },
      { date: "May 16", organic: 600, plastic: 152, paper: 90 },
      { date: "May 23", organic: 680, plastic: 150, paper: 85 },
      { date: "May 30", organic: 750, plastic: 148, paper: 80 },
    ];

    return NextResponse.json({
      status: "success",
      data: {
        stats,
        volumeByZone,
        compositionTrends,
      }
    });

  } catch (error) {
    console.error("[GET /api/analytics] Unhandled error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
