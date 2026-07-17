export const fetchAreas = async () => {
  const res = await fetch("/api/areas", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  
  if (!res.ok) throw new Error("Gagal mengambil data lokasi dari server");
  
  const result = await res.json();
  if (result.status === "success") {
    return result.data;
  } else {
    throw new Error(result.message || "Error tidak diketahui");
  }
};


export const fetchPrediction = async (payload: any) => {
  // Map frontend payload keys to what /api/waste expects
  const mappedPayload = {
    locationName: payload.location,
    forecast_days: payload.forecast_days,
    start_date: payload.start_date,
    rainfall_mm: payload.rainfall_mm,
    event_scale: payload.event_scale,
    granularity: payload.granularity,
    model_type: payload.model_type,
  };

  const res = await fetch("/api/waste", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(mappedPayload),
    cache: "no-store",
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || "Gagal mengambil data prediksi dari server");
  }

  const result = await res.json();
  if (result.status === "success") {
    return result;
  } else {
    throw new Error(result.message || "Error tidak diketahui");
  }
};

export const fetchAutopilotData = async () => {
  const res = await fetch("/api/autopilot", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  
  if (!res.ok) throw new Error("Gagal mengambil data autopilot dari server");
  
  const result = await res.json();
  return result; // return the whole result so we can check status/data in the component
};


export const fetchAllReports = async () => {
  const res = await fetch("/api/reports", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!res.ok) throw new Error("Gagal mengambil data laporan dari server");
  
  const result = await res.json();
  if (result.status === "success") {
    return result.data;
  } else {
    throw new Error(result.message || "Error tidak diketahui");
  }
};
