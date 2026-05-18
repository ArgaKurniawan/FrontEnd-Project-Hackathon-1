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
  visitor_count: number;
}

export interface WastePrediction {
  total_volume_ton: number;
  food_waste_ton: number;
  plastic_ton: number;
  recommended_trucks: number;
  calculated_staff: number;
  man_hours: number;
  weight_kg: number;
  confidence_score: number;
}

export interface PredictResponse {
  success: boolean;
  prediction: WastePrediction;
  source: "api" | "mock";
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
  const { visitor_count } = payload;

  const weight_kg = visitor_count * WASTE_RATE_KG_PER_PERSON;
  const total_volume_ton = parseFloat((weight_kg / 1000).toFixed(2));
  const food_waste_ton = parseFloat((total_volume_ton * FOOD_WASTE_RATIO).toFixed(2));
  const plastic_ton = parseFloat((total_volume_ton * PLASTIC_RATIO).toFixed(2));
  const recommended_trucks = Math.max(1, Math.ceil(total_volume_ton / TRUCK_CAPACITY_TON));
  const calculated_staff = recommended_trucks * STAFF_PER_TRUCK;
  const man_hours = calculated_staff * SHIFT_HOURS;

  return {
    total_volume_ton,
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

  constructor() {
    this.apiUrl = process.env.API_URL;
  }

  /**
   * Predict waste volume for a given location and visitor count.
   *
   * Attempts to call the external AI API first. If the API is not
   * configured, unreachable, or responds with a 500 error, falls back
   * to a deterministic mock calculation based on SIPSN 2025 standards.
   */
  async predict(payload: PredictPayload): Promise<PredictResponse> {
    // Attempt external API call when configured
    if (this.apiUrl) {
      try {
        const response = await fetch(this.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            location: payload.locationName,
            visitor_count: payload.visitor_count,
          }),
          signal: AbortSignal.timeout(10_000), // 10 s timeout
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

        const data = await response.json();

        return {
          success: true,
          prediction: {
            total_volume_ton: data.total_volume_ton ?? 0,
            food_waste_ton: data.food_waste_ton ?? 0,
            plastic_ton: data.plastic_ton ?? 0,
            recommended_trucks: data.recommended_trucks ?? 1,
            calculated_staff: data.calculated_staff ?? 3,
            man_hours: data.man_hours ?? 24,
            weight_kg: data.weight_kg ?? 0,
            confidence_score: data.confidence_score ?? 0.85,
          },
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
}

// Export singleton instance
export const wasteService = new WasteService();
