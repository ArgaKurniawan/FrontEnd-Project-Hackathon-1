import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiUrl = process.env.API_URL;
    const apiKey = process.env.API_KEY;

    if (!apiUrl) {
      return NextResponse.json({ status: "error", message: "API URL not configured" }, { status: 500 });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    const response = await fetch(`${apiUrl}/api/v1/autopilot`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Autopilot API error:", response.status, errorText);
      return NextResponse.json(
        { status: "error", message: `API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching autopilot data:", error);
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
