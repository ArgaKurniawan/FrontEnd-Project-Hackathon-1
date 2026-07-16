import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.predictionLog.findMany({
      include: {
        area: true,
      },
      orderBy: {
        prediction_date: "asc",
      },
    });

    let totalVolume = 0;
    let highRiskCount = 0;
    const volumeMap: Record<string, number> = {};
    const trendMap: Record<string, { organic: number; plastic: number; paper: number; date: string }> = {};

    logs.forEach((log) => {
      totalVolume += Number(log.volume_ton ?? 0);
      if (log.risk_status === "HIGH") {
        highRiskCount++;
      }

      const areaName = log.area?.name?.toLowerCase() ?? "unknown";
      volumeMap[areaName] = (volumeMap[areaName] || 0) + Number(log.volume_ton ?? 0);

      const dateStr = new Date(log.prediction_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      if (!trendMap[dateStr]) {
        trendMap[dateStr] = { date: dateStr, organic: 0, plastic: 0, paper: 0 };
      }

      const organic = Number(log.volume_ton ?? 0) * 0.51;
      const plastic = Number(log.volume_ton ?? 0) * 0.18;
      const paper = Number(log.volume_ton ?? 0) * 0.15;

      trendMap[dateStr].organic += organic;
      trendMap[dateStr].plastic += plastic;
      trendMap[dateStr].paper += paper;
    });

    const stats = [
      {
        label: "TOTAL VOLUME COLLECTED",
        value: totalVolume.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        unit: "Tons",
        trend: "Live Data",
        positive: true,
      },
      {
        label: "OVERALL RECYCLING RATE",
        value: "42.8",
        unit: "%",
        trend: "Estimation",
        positive: true,
      },
      {
        label: "CONTAMINATION INCIDENTS",
        value: highRiskCount.toString(),
        unit: "Events",
        trend: "Live Data",
        positive: false,
      },
      {
        label: "OPERATIONAL COST / TON",
        value: "286.750",
        unit: "",
        prefix: "Rp",
        trend: "Estimation",
        positive: true,
      },
    ];

    const colors = ["#2dd4a8", "#38bdf8", "#6366f1", "#fb7185", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6"];
    const maxVolume = Math.max(...Object.values(volumeMap), 100);
    const ceilingMax = maxVolume > 1000 ? Math.ceil(maxVolume / 1000) * 1000 : Math.ceil(maxVolume / 100) * 100;

    const volumeByZone = Object.entries(volumeMap)
      .map(([zone, value], index) => ({
        zone,
        value: parseFloat(value.toFixed(1)),
        color: colors[index % colors.length],
        max: ceilingMax,
      }))
      .sort((a, b) => b.value - a.value);

    const compositionTrends = Object.values(trendMap).map((trend) => ({
      date: trend.date,
      organic: parseFloat(trend.organic.toFixed(1)),
      plastic: parseFloat(trend.plastic.toFixed(1)),
      paper: parseFloat(trend.paper.toFixed(1)),
    }));

    return NextResponse.json({
      status: "success",
      data: {
        stats,
        volumeByZone,
        compositionTrends,
      },
    });
  } catch (error) {
    console.error("[GET /api/analytics] Unhandled error:", error);
    return NextResponse.json({
      status: "success",
      data: {
        stats: [],
        volumeByZone: [],
        compositionTrends: [],
      },
    });
  }
}
