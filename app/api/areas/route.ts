import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const areas = await prisma.masterArea.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({
      status: "success",
      data: areas,
    });
  } catch (error) {
    console.error("[GET /api/areas] Unhandled error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch areas" },
      { status: 500 }
    );
  }
}
