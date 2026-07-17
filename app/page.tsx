"use client";

import dynamic from "next/dynamic";
import { useDashboard } from "@/app/hooks/useDashboard";
import DashboardTopBar from "@/app/components/DashboardTopBar";
import PredictionPanel from "@/app/components/PredictionPanel";
import PredictionResults from "@/app/components/PredictionResults";

const InteractiveMap = dynamic(() => import("@/app/components/InteractiveMap"), {
  ssr: false,
});

/* ─── Smooth Scroll Helper ──────────────────────────────────────── */
function smoothScrollTo(targetId: string, duration = 900) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const start = window.scrollY;
  const end = target.getBoundingClientRect().top + window.scrollY - 16;
  const distance = end - start;
  const startTime = performance.now();
  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function step(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, start + distance * easeInOutCubic(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ─── Page ──────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const dashboard = useDashboard();

  return (
    <div className="page-content">
      {/* Top Bar */}
      <DashboardTopBar />

      {/* Map */}
      <div style={{ marginBottom: 24 }}>
        <InteractiveMap
          selectedLocation={dashboard.location}
          onSelectLocation={(name) => {
            dashboard.setLocation(name);
            smoothScrollTo("prediction-parameters");
          }}
        />
      </div>

      {/* Prediction Parameters */}
      <PredictionPanel
        areas={dashboard.areas}
        location={dashboard.location}
        setLocation={dashboard.setLocation}
        modelType={dashboard.modelType}
        setModelType={dashboard.setModelType}
        granularity={dashboard.granularity}
        setGranularity={dashboard.setGranularity}
        forecastDays={dashboard.forecastDays}
        setForecastDays={dashboard.setForecastDays}
        rainfallMm={dashboard.rainfallMm}
        setRainfallMm={dashboard.setRainfallMm}
        eventScale={dashboard.eventScale}
        setEventScale={dashboard.setEventScale}
        isLoading={dashboard.isLoading}
        error={dashboard.error}
        onPredict={dashboard.handlePredict}
      />

      {/* Prediction Results */}
      <PredictionResults
        wasteBreakdown={dashboard.wasteBreakdown}
        riskDonutData={dashboard.riskDonutData}
        riskStatusText={dashboard.riskStatusText}
        predictionData={dashboard.predictionData}
        totalVolume={dashboard.totalVolume}
        staffCount={dashboard.staffCount}
        manHours={dashboard.manHours}
        recommendedTrucks={dashboard.recommendedTrucks}
        isLoading={dashboard.isLoading}
      />

      {/* Export Button */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-start" }}>
        <button
          className="btn"
          style={{ padding: "10px 24px" }}
          onClick={dashboard.generateNewReport}
        >
          Export Report
        </button>
      </div>
    </div>
  );
}
