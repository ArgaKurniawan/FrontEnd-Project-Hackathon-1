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
  source: "api";
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
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
   * Calls the external AI API. Throws an error if the API is unreachable
   * or returns a 500 status code.
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
          throw new Error(`Server AI bermasalah (Error ${response.status}). Mohon coba lagi nanti.`);
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
        throw new Error(`Gagal terhubung ke Layanan AI Prediksi: ${error instanceof Error ? error.message : "Koneksi terputus"}`);
      }
    }

    throw new Error("API URL tidak dikonfigurasi.");
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
