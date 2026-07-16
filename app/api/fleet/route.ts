import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const fleet = await prisma.fleetInventory.findMany({
      orderBy: { id: "asc" },
    });

    // Aggregate fleet statistics
    const totalUnits = fleet.reduce((sum, f) => sum + f.total_units, 0);
    const readyUnits = fleet.reduce((sum, f) => sum + f.ready_units, 0);
    const maintenanceUnits = totalUnits - readyUnits;
    const readinessRate =
      totalUnits > 0
        ? parseFloat(((readyUnits / totalUnits) * 100).toFixed(1))
        : 0;
    const totalCapacity = fleet.reduce(
      (sum, f) => sum + f.ready_units * f.capacity_per_truck_ton,
      0
    );

    return NextResponse.json({
      status: "success",
      data: {
        fleet,
        summary: {
          totalUnits,
          readyUnits,
          maintenanceUnits,
          readinessRate,
          totalCapacity: parseFloat(totalCapacity.toFixed(1)),
          truckTypes: fleet.length,
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/fleet] Unhandled error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch fleet data" },
      { status: 500 }
    );
  }
}
