import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.predictionLog.findMany({
      include: {
        area: true,
      },
      orderBy: {
        prediction_date: 'desc'
      }
    });

    return NextResponse.json({
      status: "success",
      data: logs
    });
  } catch (error) {
    console.error("[GET /api/reports] Unhandled error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
