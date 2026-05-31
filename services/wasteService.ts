export const fetchWasteDashboardData = async (locationName: string = "JIS", visitorCount: number = 50000) => {
  const res = await fetch("/api/waste", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locationName, visitor_count: visitorCount }),
  });
  
  if (!res.ok) throw new Error("Gagal mengambil data dari server");
  
  const result = await res.json();
  if (result.status === "success") {
    return result;
  } else {
    throw new Error(result.message || "Error tidak diketahui");
  }
};

export const fetchAnalyticsData = async () => {
  const res = await fetch("/api/analytics", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!res.ok) throw new Error("Gagal mengambil data analytics dari server");
  
  const result = await res.json();
  if (result.status === "success") {
    return result.data;
  } else {
    throw new Error(result.message || "Error tidak diketahui");
  }
};

export const fetchLatestDashboardData = async () => {
  const res = await fetch("/api/dashboard", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!res.ok) throw new Error("Gagal mengambil data dashboard dari database");
  
  const result = await res.json();
  if (result.status === "success") {
    return result;
  } else {
    throw new Error(result.message || "Error tidak diketahui");
  }
};
