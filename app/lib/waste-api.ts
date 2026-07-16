/**
 * Waste Management Service — Client Service Library
 *
 * Provides a `wasteService` singleton with an async `predict` method.
 * - In production, calls the external AI service at `process.env.API_URL`.
 * - Falls back to a deterministic mock calculation when the API is
 *   unreachable or returns a 500 error.
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface PredictPayload {
  locationName: string;
  visitor_count?: number; // legacy
  forecast_days?: number;
  start_date?: string;
  rainfall_mm?: number;
  event_scale?: number;
  granularity?: "daily" | "hourly";
  model_type?: "chronos" | "gradient_boosting";
}

export interface LogisticsPlan {
  trucks_needed: number;
  manpower: number;
  estimated_duration_hours: number;
  efficiency_rate: string;
}

export interface WastePrediction {
  total_volume_ton: number;
  organic_waste_ton: number;
  plastic_waste_ton: number;
  recommended_trucks: number;
  risk_status?: string;
  event_info?: string;
  paper_waste_ton?: number;
  glass_waste_ton?: number;
  metal_waste_ton?: number;
  textile_waste_ton?: number;
  other_waste_ton?: number;
  // mapped legacy fields to avoid breaking too many things:
  food_waste_ton?: number;
  plastic_ton?: number;
  calculated_staff?: number;
  man_hours?: number;
  weight_kg?: number;
  confidence_score?: number;
}

export interface PredictResponse {
  success: boolean;
  prediction: WastePrediction; // day-1 summary, used for DB logging
  all_results?: any[];         // all forecast days from external API
  logistics?: LogisticsPlan;
  message?: string;
  source: "api" | "mock";
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Constants ───────────────────────────────────────────────────────

/** SIPSN 2025 waste generation rate: ~0.7 kg per person per day */
const WASTE_RATE_KG_PER_PERSON = 0.7;
/** SIPSN 2025 composition: 51% organic / food waste */
const FOOD_WASTE_RATIO = 0.51;
/** SIPSN 2025 composition: 18% plastic */
const PLASTIC_RATIO = 0.18;
/** Truck payload capacity in tons */
const TRUCK_CAPACITY_TON = 8;
/** Staff required per truck */
const STAFF_PER_TRUCK = 3;
/** Standard shift duration in hours */
const SHIFT_HOURS = 8;

// ─── Mock Prediction Engine ──────────────────────────────────────────

function generateMockPrediction(payload: PredictPayload): WastePrediction {
  const visitorCount = payload.visitor_count ?? 15000; // default baseline visitors if undefined

  const weight_kg = visitorCount * WASTE_RATE_KG_PER_PERSON;
  const total_volume_ton = parseFloat((weight_kg / 1000).toFixed(2));
  const food_waste_ton = parseFloat((total_volume_ton * FOOD_WASTE_RATIO).toFixed(2));
  const plastic_ton = parseFloat((total_volume_ton * PLASTIC_RATIO).toFixed(2));
  const paper_ton = parseFloat((total_volume_ton * 0.12).toFixed(2));
  const glass_ton = parseFloat((total_volume_ton * 0.04).toFixed(2));
  const metal_ton = parseFloat((total_volume_ton * 0.02).toFixed(2));
  const textile_ton = parseFloat((total_volume_ton * 0.05).toFixed(2));
  const other_ton = parseFloat((total_volume_ton * 0.08).toFixed(2));
  
  const recommended_trucks = Math.max(1, Math.ceil(total_volume_ton / TRUCK_CAPACITY_TON));
  const calculated_staff = recommended_trucks * STAFF_PER_TRUCK;
  const man_hours = calculated_staff * SHIFT_HOURS;

  return {
    total_volume_ton,
    organic_waste_ton: food_waste_ton,
    plastic_waste_ton: plastic_ton,
    paper_waste_ton: paper_ton,
    glass_waste_ton: glass_ton,
    metal_waste_ton: metal_ton,
    textile_waste_ton: textile_ton,
    other_waste_ton: other_ton,
    food_waste_ton,
    plastic_ton,
    recommended_trucks,
    calculated_staff,
    man_hours,
    weight_kg: parseFloat(weight_kg.toFixed(2)),
    confidence_score: 0.85,
  };
}

// ─── Service ─────────────────────────────────────────────────────────

class WasteService {
  private apiUrl: string | undefined;
  private apiKey: string | undefined;

  constructor() {
    this.apiUrl = process.env.API_URL;
    this.apiKey = process.env.API_KEY?.trim();
  }

  private getBaseUrl(): string {
    if (!this.apiUrl) return "";
    try {
      return new URL(this.apiUrl).origin;
    } catch {
      return this.apiUrl;
    }
  }

  /**
   * Predict waste volume for a given location and visitor count.
   *
   * Attempts to call the external AI API first. If the API is not
   * configured, unreachable, or responds with a 500 error, falls back
   * to a deterministic mock calculation based on SIPSN 2025 standards.
   */
  async predict(payload: PredictPayload): Promise<PredictResponse> {
    const baseUrl = this.getBaseUrl();
    // Attempt external API call when configured
    if (baseUrl) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };
        if (this.apiKey) {
          headers["x-api-key"] = this.apiKey;
        }

        const response = await fetch(`${baseUrl}/api/v1/predict`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            location: payload.locationName,
            forecast_days: payload.forecast_days ?? 1,
            start_date: payload.start_date ?? new Date().toISOString().split("T")[0],
            rainfall_mm: payload.rainfall_mm ?? 0,
            event_scale: payload.event_scale ?? 1,
            granularity: payload.granularity ?? "daily",
            model_type: payload.model_type ?? "chronos",
          }),
          signal: AbortSignal.timeout(60_000), // 60 s timeout untuk model AI
        });

        if (response.status >= 500) {
          console.warn(
            `[WasteService] External API returned ${response.status}. Falling back to mock prediction.`
          );
          return {
            success: true,
            prediction: generateMockPrediction(payload),
            source: "mock",
          };
        }

        if (!response.ok) {
          throw new Error(
            `External API error: ${response.status} ${response.statusText}`
          );
        }

        const responseData = await response.json();
        const data = responseData.data;
        const result = data?.prediction_results?.[0];
        const logistics = data?.logistics_plan;

        if (!result) {
           throw new Error("Invalid response format from API");
        }

        return {
          success: true,
          message: responseData.message,
          all_results: data.prediction_results ?? [],
          prediction: {
            total_volume_ton: result.total_volume_ton ?? 0,
            organic_waste_ton: result.organic_waste_ton ?? 0,
            plastic_waste_ton: result.plastic_waste_ton ?? 0,
            paper_waste_ton: result.paper_waste_ton ?? 0,
            glass_waste_ton: result.glass_waste_ton ?? 0,
            metal_waste_ton: result.metal_waste_ton ?? 0,
            textile_waste_ton: result.textile_waste_ton ?? 0,
            other_waste_ton: result.other_waste_ton ?? 0,
            recommended_trucks: result.recommended_trucks ?? 1,
            risk_status: result.risk_status,
            event_info: result.event_info,
            // Legacy fallbacks:
            food_waste_ton: result.organic_waste_ton ?? 0,
            plastic_ton: result.plastic_waste_ton ?? 0,
            calculated_staff: logistics?.manpower ?? 3,
            man_hours: logistics?.estimated_duration_hours ?? 24,
            weight_kg: (result.total_volume_ton ?? 0) * 1000,
            confidence_score: responseData.confidence_score ?? 0.85,
          },
          logistics,
          source: "api",
        };
      } catch (error) {
        console.warn(
          `[WasteService] External API call failed. Falling back to mock prediction.`,
          error instanceof Error ? error.message : error
        );
      }
    }

    // Fallback: deterministic mock
    return {
      success: true,
      prediction: generateMockPrediction(payload),
      source: "mock",
    };
  }

  /**
   * Predict waste volume from a CSV file
   * POST /api/v1/predict/csv
   */
  async predictCsv(file: File): Promise<ApiResponse> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) return { success: false, error: "API URL not configured" };

    try {
      const formData = new FormData();
      formData.append("file", file);

      const headers: Record<string, string> = {};
      if (this.apiKey) headers["x-api-key"] = this.apiKey;

      const response = await fetch(`${baseUrl}/api/v1/predict/csv`, {
        method: "POST",
        headers,
        body: formData,
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("[WasteService] predictCsv error:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Get Alerts
   * GET /api/v1/alerts
   */
  async getAlerts(): Promise<ApiResponse> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) return { success: false, error: "API URL not configured" };

    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (this.apiKey) headers["x-api-key"] = this.apiKey;

      const response = await fetch(`${baseUrl}/api/v1/alerts`, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("[WasteService] getAlerts error:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Get System Status
   * GET /api/v1/status
   */
  async getStatus(): Promise<ApiResponse> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) return { success: false, error: "API URL not configured" };

    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (this.apiKey) headers["x-api-key"] = this.apiKey;

      const response = await fetch(`${baseUrl}/api/status`, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(5_000),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("[WasteService] getStatus error:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

// Export singleton instance
export const wasteService = new WasteService();
