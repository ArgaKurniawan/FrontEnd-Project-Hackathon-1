"use client";

import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { fetchPrediction, fetchAllReports, fetchAreas } from "@/services/wasteService";
import { toast } from "sonner";

export interface PredictionParams {
  location: string;
  forecastDays: number;
  startDate: string;
  rainfallMm: number;
  eventScale: number;
  granularity: string;
  modelType: string;
}

export function useDashboard() {
  // ── State: Prediction Parameters ────────────────────────────────────
  const [areas, setAreas] = useState<any[]>([]);
  const [location, setLocation] = useState("JIS");
  const [forecastDays, setForecastDays] = useState(7);
  const [startDate, setStartDate] = useState("2026-07-10");
  const [rainfallMm, setRainfallMm] = useState(15.5);
  const [eventScale, setEventScale] = useState(2);
  const [granularity, setGranularity] = useState("daily");
  const [modelType, setModelType] = useState("chronos");

  // ── State: Data & UI ─────────────────────────────────────────────────
  const [predictionData, setPredictionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Effect: Load Initial Data ─────────────────────────────────────────
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const areaData = await fetchAreas();
        if (areaData && areaData.length > 0) {
          setAreas(areaData);
          setLocation(areaData[0].name);
        }
      } catch (err: any) {
        console.error("Initial data error:", err);
      }
    };
    loadInitialData();
  }, []);

  // ── Action: Run Prediction ────────────────────────────────────────────
  const handlePredict = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        location,
        forecast_days: forecastDays,
        start_date: startDate,
        rainfall_mm: rainfallMm,
        event_scale: eventScale,
        granularity,
        model_type: modelType,
      };
      const result = await fetchPrediction(payload);
      setPredictionData(result);
    } catch (err: any) {
      console.error("Prediction error:", err);
      setError("Gagal memuat data prediksi. Silakan periksa koneksi atau coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Action: Export Report to Excel ────────────────────────────────────
  const generateNewReport = async () => {
    try {
      if (!predictionData || !predictionData.data || !predictionData.data.prediction_results) {
        toast.warning("Tidak ada data prediksi untuk di-export. Silakan jalankan prediksi terlebih dahulu.");
        return;
      }

      const results = predictionData.data.prediction_results;
      const logistics = predictionData.data.logistics_plan;
      const loc = predictionData.data.location || location;

      const reportData = results.map((log: any, index: number) => {
        const volume = log.total_volume_ton || 0;
        const foodWaste = log.organic_waste_ton || 0;
        const plastic = log.plastic_waste_ton || 0;
        const recommendedTrucks = log.recommended_trucks || (logistics?.trucks_needed ?? Math.max(1, Math.ceil(volume / 8)));
        const calculatedStaff = logistics?.manpower ?? (recommendedTrucks * 3);
        const manHours = logistics?.estimated_duration_hours ?? (calculatedStaff * 8);

        return {
          "Hari ke-": index + 1,
          "Lokasi": loc,
          "Total Volume (Ton)": volume,
          "Organik (Ton)": foodWaste,
          "Plastik (Ton)": plastic,
          "Kertas (Ton)": log.paper_waste_ton || 0,
          "Kaca (Ton)": log.glass_waste_ton || 0,
          "Metal (Ton)": log.metal_waste_ton || 0,
          "Tekstil (Ton)": log.textile_waste_ton || 0,
          "Lainnya (Ton)": log.other_waste_ton || 0,
          "Rekomendasi Truk": recommendedTrucks,
          "Estimasi Staff": calculatedStaff,
          "Jam Kerja": manHours,
          "Status Risiko": log.risk_status || "-",
          "Info Event": log.event_info || "-",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Hasil Prediksi AI");
      XLSX.writeFile(workbook, `AI_Prediction_${loc}_${new Date().getTime()}.xlsx`);
      toast.success("File Excel berhasil diunduh!");
    } catch (excelErr) {
      console.error("Gagal export excel:", excelErr);
      toast.error("Gagal mengunduh report.");
    }
  };

  // ── Derived/Computed Values ───────────────────────────────────────────
  const wasteBreakdown = useMemo(() => {
    if (!predictionData) return [];
    const allResults: any[] = predictionData.data?.prediction_results ?? [];
    if (allResults.length === 0) return [];

    const sum = (key: string) =>
      parseFloat(allResults.reduce((acc: number, r: any) => acc + (r[key] ?? 0), 0).toFixed(2));

    return [
      { name: "Organik", value: sum("organic_waste_ton"), color: "#2dd4a8" },
      { name: "Plastik", value: sum("plastic_waste_ton"), color: "#38bdf8" },
      { name: "Kertas", value: sum("paper_waste_ton"), color: "#94a3b8" },
      { name: "Kaca", value: sum("glass_waste_ton"), color: "#fcd34d" },
      { name: "Metal", value: sum("metal_waste_ton"), color: "#f87171" },
      { name: "Tekstil", value: sum("textile_waste_ton"), color: "#a78bfa" },
      { name: "Lainnya", value: sum("other_waste_ton"), color: "#f472b6" },
    ].filter((item) => item.value > 0);
  }, [predictionData]);

  const riskDonutData = useMemo(() => {
    const score = predictionData?.confidence_score ? predictionData.confidence_score * 100 : 75;
    return [
      { name: "Risk", value: score, color: "#fb7185" },
      { name: "Remaining", value: 100 - score, color: "#1e3048" },
    ];
  }, [predictionData]);

  const riskStatusText = useMemo(() => {
    const allResults: any[] = predictionData?.data?.prediction_results ?? [];
    if (allResults.length === 0) return "Menghitung...";
    const priority: Record<string, number> = { HIGH: 4, WARNING: 3, MEDIUM: 2, SAFE: 1, LOW: 0 };
    const worst = allResults.reduce((worst: any, r: any) => {
      const w = priority[r.risk_status] ?? -1;
      const b = priority[worst?.risk_status] ?? -1;
      return w > b ? r : worst;
    }, allResults[0]);
    return worst?.risk_status || "Menghitung...";
  }, [predictionData]);

  const totalVolume = useMemo(() => {
    const allResults: any[] = predictionData?.data?.prediction_results ?? [];
    return parseFloat(
      allResults.reduce((acc: number, r: any) => acc + (r.total_volume_ton ?? 0), 0).toFixed(2)
    );
  }, [predictionData]);

  const staffCount = predictionData?.data?.logistics_plan?.manpower ?? 0;
  const manHours = predictionData?.data?.logistics_plan?.estimated_duration_hours ?? 0;
  const recommendedTrucks = predictionData?.data?.logistics_plan?.trucks_needed ?? 0;

  return {
    // State
    areas, location, setLocation,
    forecastDays, setForecastDays,
    startDate, setStartDate,
    rainfallMm, setRainfallMm,
    eventScale, setEventScale,
    granularity, setGranularity,
    modelType, setModelType,
    predictionData,
    isLoading, error,
    // Actions
    handlePredict,
    generateNewReport,
    // Derived
    wasteBreakdown,
    riskDonutData,
    riskStatusText,
    totalVolume,
    staffCount,
    manHours,
    recommendedTrucks,
  };
}
