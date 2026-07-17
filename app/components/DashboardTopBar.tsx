"use client";

import { Bell, User } from "lucide-react";

export default function DashboardTopBar() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 28,
      }}
    >
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

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: 6,
          }}
        >
          <Bell size={18} />
        </button>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--accent-green-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-green)",
          }}
        >
          <User size={16} />
        </div>
      </div>
    </div>
  );
}
