import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { wasteService } from "@/app/lib/waste-api";

// ─── Types ───────────────────────────────────────────────────────────

interface RequestPayload {
  locationName: string;
  visitor_count?: number; // legacy
  forecast_days?: number;
  start_date?: string;
  rainfall_mm?: number;
  event_scale?: number;
  granularity?: "daily" | "hourly";
  model_type?: "chronos" | "gradient_boosting";
}

interface CoordinateMap {
  [key: string]: { lat: number; lng: number };
}

// ─── Constants ───────────────────────────────────────────────────────

const COORDINATE_MAP: CoordinateMap = {
  JIS:      { lat: -6.1214, lng: 106.883 },
  GBK:      { lat: -6.2185, lng: 106.8018 },
  "Ice BSD": { lat: -6.3006, lng: 106.6523 },
};

const DEFAULT_COORDINATES = { lat: -6.2088, lng: 106.8456 };

// ─── Helpers ─────────────────────────────────────────────────────────

function resolveCoordinates(locationName: string) {
  return COORDINATE_MAP[locationName] ?? DEFAULT_COORDINATES;
}

function determineRiskStatus(volumeTon: number): string {
  if (volumeTon > 10) return "HIGH";
  if (volumeTon > 5) return "MEDIUM";
  return "LOW";
}

// ─── POST Handler ────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // 1. Parse & validate request body
    let body: RequestPayload;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid JSON payload. Expected a valid JSON body.",
        },
        { status: 400 }
      );
    }

    const {
      locationName,
      visitor_count,
      forecast_days,
      start_date,
      rainfall_mm,
      event_scale,
      granularity,
      model_type,
    } = body;

    if (!locationName || typeof locationName !== "string") {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Missing or invalid 'locationName'. Expected a non-empty string.",
        },
        { status: 400 }
      );
    }

    // 2. Resolve coordinates
    const coordinates = resolveCoordinates(locationName);

    // 3. Call the waste prediction service
    const predictionResponse = await wasteService.predict({
      locationName,
      visitor_count,
      forecast_days,
      start_date,
      rainfall_mm,
      event_scale,
      granularity,
      model_type,
    });

    if (!predictionResponse.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Prediction service returned an unsuccessful result.",
        },
        { status: 502 }
      );
    }

    const prediction = predictionResponse.prediction;

    // 4. Check if the area is registered in MasterArea
    let masterArea = await prisma.masterArea.findUnique({
      where: { name: locationName },
    });

    const isAreaRegistered = masterArea !== null;

    // Auto-register the area if it doesn't exist
    if (!masterArea) {
      masterArea = await prisma.masterArea.create({
        data: {
          name: locationName,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
        },
      });
    }

    // 5. Determine risk status
    const riskStatus = determineRiskStatus(prediction.total_volume_ton);

    // 6. Save prediction to the database (AI-First with Upsert Fallback to prevent Unique Constraint errors)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const existingLog = await prisma.predictionLog.findFirst({
      where: {
        areaId: masterArea.id,
        prediction_date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    let predictionLog;
    if (existingLog) {
      predictionLog = await prisma.predictionLog.update({
        where: { id: existingLog.id },
        data: {
          volume_ton: prediction.total_volume_ton,
          confidence_score: prediction.confidence_score ?? 0,
          risk_status: riskStatus,
        },
      });
    } else {
      predictionLog = await prisma.predictionLog.create({
        data: {
          areaId: masterArea.id,
          prediction_date: new Date(),
          volume_ton: prediction.total_volume_ton,
          confidence_score: prediction.confidence_score ?? 0,
          risk_status: riskStatus,
        },
      });
    }

    // 7. Build and return the success response
    const generatedAt = new Date().toISOString();

    // Use all daily results if available (multi-day forecast), otherwise fall back to day-1 wrapped in array
    const allDailyResults = predictionResponse.all_results && predictionResponse.all_results.length > 0
      ? predictionResponse.all_results
      : [
          {
            total_volume_ton: prediction.total_volume_ton,
            organic_waste_ton: prediction.organic_waste_ton,
            plastic_waste_ton: prediction.plastic_waste_ton,
            paper_waste_ton: prediction.paper_waste_ton,
            glass_waste_ton: prediction.glass_waste_ton,
            metal_waste_ton: prediction.metal_waste_ton,
            textile_waste_ton: prediction.textile_waste_ton,
            other_waste_ton: prediction.other_waste_ton,
            recommended_trucks: prediction.recommended_trucks,
            risk_status: prediction.risk_status || riskStatus,
            event_info: prediction.event_info,
            location: locationName,
          },
        ];

    return NextResponse.json(
      {
        status: "success",
        message: predictionResponse.message || "Prediction completed successfully",
        confidence_score: prediction.confidence_score,
        generated_at: generatedAt,
        data: {
          location: locationName,
          is_area_registered: isAreaRegistered,
          coordinates,
          prediction_results: allDailyResults,
          logistics_plan: predictionResponse.logistics,
          database_log: {
            id: predictionLog.id,
            areaId: predictionLog.areaId,
            prediction_date: predictionLog.prediction_date.toISOString(),
            volume_ton: predictionLog.volume_ton,
            confidence_score: predictionLog.confidence_score,
            risk_status: predictionLog.risk_status,
            created_at: predictionLog.createdAt.toISOString(),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/waste] Unhandled error:", error);

    return NextResponse.json(
      {
        status: "error",
        message:
          process.env.NODE_ENV === "development"
            ? `Internal server error: ${error instanceof Error ? error.message : String(error)}`
            : "Internal server error. Please try again later.",
      },
      { status: 500 }
    );
  }
}
