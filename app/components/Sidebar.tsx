"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  AlertTriangle,
  Settings,
  Recycle,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dasbor", icon: LayoutDashboard },
  { href: "/analysis", label: "Analisis", icon: BarChart3 },
  { href: "/operations", label: "Operasional", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 210,
        minWidth: 210,
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-primary)",
        padding: "24px 0",
        zIndex: 50,
      }}
    >
      {/* ── Brand ── */}
      <div
        style={{
          padding: "0 20px",
          marginBottom: 36,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "var(--radius-md)",
            background: "var(--accent-green-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-green)",
          }}
        >
          <Recycle size={20} />
        </div>
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-heading)",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
          >
            AeternaAI
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              letterSpacing: "0.02em",
            }}
          >
            Pusat Operasional
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 10px" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--accent-green)" : "var(--text-secondary)",
                background: isActive ? "var(--accent-green-dim)" : "transparent",
                borderLeft: isActive ? "3px solid var(--accent-green)" : "3px solid transparent",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--text-primary)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>


    </aside>
  );
}
