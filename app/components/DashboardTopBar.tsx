"use client";

export default function DashboardTopBar() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-7 gap-4 sm:gap-0">
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text-heading)",
          letterSpacing: "-0.02em",
          margin: 0,
        }}
      >
        Waste Prediction Dashboard
      </h1>
    </div>
  );
}
