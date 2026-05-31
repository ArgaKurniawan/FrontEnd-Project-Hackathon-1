import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    // Fetch all areas with ALL their prediction logs for richer per-area data
    const areas = await prisma.masterArea.findMany({
      include: {
        predictionLogs: {
          orderBy: { prediction_date: "desc" },
        },
      },
    });

    // Build map markers with aggregated prediction data per area
    const markers = areas.map((area) => {
      const logs = area.predictionLogs;
      const latestLog = logs[0] || null;

      // Compute per-area averages for differentiation
      const totalLogs = logs.length;
      const avgVolume =
        totalLogs > 0
          ? logs.reduce((sum, l) => sum + l.volume_ton, 0) / totalLogs
          : 0;
      const avgConfidence =
        totalLogs > 0
          ? logs.reduce((sum, l) => sum + l.confidence_score, 0) / totalLogs
          : 0;
      const highRiskCount = logs.filter(
        (l) => l.risk_status === "HIGH"
      ).length;
      const mediumRiskCount = logs.filter(
        (l) => l.risk_status === "MEDIUM"
      ).length;

      // Determine effective risk status using volume thresholds if DB status is uniform
      // HIGH: volume > 40 ton, MEDIUM: 20–40 ton, LOW: < 20 ton
      let effectiveRisk = latestLog?.risk_status || "UNKNOWN";
      if (latestLog) {
        const vol = latestLog.volume_ton;
        if (vol > 40) {
          effectiveRisk = "HIGH";
        } else if (vol > 20) {
          effectiveRisk = "MEDIUM";
        } else {
          effectiveRisk = "LOW";
        }
      }

      return {
        id: area.id,
        name: area.name,
        latitude: area.latitude,
        longitude: area.longitude,
        riskStatus: effectiveRisk,
        volumeTon: latestLog?.volume_ton || 0,
        confidenceScore: latestLog?.confidence_score || 0,
        avgVolume: Number(avgVolume.toFixed(1)),
        avgConfidence: Number(avgConfidence.toFixed(2)),
        totalPredictions: totalLogs,
        highRiskCount,
        mediumRiskCount,
        predictionDate: latestLog?.prediction_date || null,
      };
    });

    // Aggregate stats for the map header
    const totalAreas = markers.length;
    const highRisk = markers.filter((m) => m.riskStatus === "HIGH").length;
    const mediumRisk = markers.filter((m) => m.riskStatus === "MEDIUM").length;
    const totalVolume = markers.reduce((sum, m) => sum + m.volumeTon, 0);

    return NextResponse.json({
      status: "success",
      data: {
        markers,
        summary: {
          totalAreas,
          highRisk,
          mediumRisk,
          totalVolume: Number(totalVolume.toFixed(1)),
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/map] Unhandled error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch map data" },
      { status: 500 }
    );
  }
}
