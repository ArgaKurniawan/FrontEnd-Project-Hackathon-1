import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    // Ambil log prediksi terbaru dari database
    const latestLog = await prisma.predictionLog.findFirst({
      include: {
        area: true,
      },
      orderBy: {
        prediction_date: 'desc'
      }
    });

    if (!latestLog) {
      // Return fallback data if database is empty
      return NextResponse.json({
        status: "success",
        confidence_score: 0.85,
        data: {
          location: "Unknown",
          waste_summary: {
            total_volume_ton: 0,
            total_food_waste_ton: 0,
            total_plastic_ton: 0,
          },
          prediction_results: [
            {
              rekomendasi_truk: [],
              calculated_staff: 0,
              man_hours: 0,
            },
          ],
          database_log: {
            risk_status: "LOW",
          },
        },
      });
    }

    // Kalkulasi nilai berdasarkan standar SIPSN (sama dengan fallback AI)
    const volume_ton = latestLog.volume_ton;
    const food_waste_ton = parseFloat((volume_ton * 0.51).toFixed(2));
    const plastic_ton = parseFloat((volume_ton * 0.18).toFixed(2));
    const recommended_trucks = Math.max(1, Math.ceil(volume_ton / 8));
    const calculated_staff = recommended_trucks * 3;
    const man_hours = calculated_staff * 8;

    // Build truck recommendations array
    const rekomendasi_truk = [];
    for (let i = 0; i < recommended_trucks; i++) {
      rekomendasi_truk.push({
        jenis_truk: "Truk Sampah Besar",
        kapasitas_ton: 8,
      });
    }

    return NextResponse.json({
      status: "success",
      confidence_score: latestLog.confidence_score,
      data: {
        location: latestLog.area.name,
        waste_summary: {
          total_volume_ton: volume_ton,
          total_food_waste_ton: food_waste_ton,
          total_plastic_ton: plastic_ton,
        },
        prediction_results: [
          {
            rekomendasi_truk,
            calculated_staff,
            man_hours,
          },
        ],
        database_log: {
          risk_status: latestLog.risk_status,
        },
      },
    });

  } catch (error) {
    console.error("[GET /api/dashboard] Unhandled error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch latest dashboard data from Prisma" },
      { status: 500 }
    );
  }
}
