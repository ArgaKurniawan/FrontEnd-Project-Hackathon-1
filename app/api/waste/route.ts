import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { wasteService } from "@/app/lib/waste-api";

// ─── Types ───────────────────────────────────────────────────────────

interface RequestPayload {
  locationName: string;
  visitor_count: number;
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

    const { locationName, visitor_count } = body;

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

    if (
      visitor_count === undefined ||
      visitor_count === null ||
      typeof visitor_count !== "number" ||
      visitor_count < 0
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Missing or invalid 'visitor_count'. Expected a non-negative number.",
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

    // 6. Save prediction to the database
    const predictionLog = await prisma.predictionLog.create({
      data: {
        areaId: masterArea.id,
        prediction_date: new Date(),
        volume_ton: prediction.total_volume_ton,
        confidence_score: prediction.confidence_score,
        risk_status: riskStatus,
      },
    });

    // 7. Build and return the success response
    const generatedAt = new Date().toISOString();

    return NextResponse.json(
      {
        status: "success",
        message: "Prediction completed successfully",
        confidence_score: prediction.confidence_score,
        generated_at: generatedAt,
        data: {
          location: locationName,
          is_area_registered: isAreaRegistered,
          coordinates,
          waste_summary: {
            total_volume_ton: prediction.total_volume_ton,
            total_food_waste_ton: prediction.food_waste_ton,
            total_plastic_ton: prediction.plastic_ton,
          },
          prediction_results: [
            {
              lokasi: locationName,
              total_volume_ton: prediction.total_volume_ton,
              sisa_makanan_ton: prediction.food_waste_ton,
              plastik_ton: prediction.plastic_ton,
              rekomendasi_truk: prediction.recommended_trucks,
              calculated_staff: prediction.calculated_staff,
              man_hours: prediction.man_hours,
              weight_kg: prediction.weight_kg,
            },
          ],
          database_log: {
            id: predictionLog.id,
            areaId: predictionLog.areaId,
            prediction_date: predictionLog.prediction_date.toISOString(),
            volume_ton: predictionLog.volume_ton,
            confidence_score: predictionLog.confidence_score,
            risk_status: predictionLog.risk_status,
            created_at: predictionLog.created_at.toISOString(),
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
