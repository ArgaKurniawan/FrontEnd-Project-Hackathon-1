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
  { href: "/analysis", label: "Autopilot", icon: BarChart3 },
  { href: "/operations", label: "Berita", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-[210px] md:min-w-[210px] h-auto md:h-screen sticky top-0 flex flex-col bg-[var(--bg-sidebar)] border-b md:border-b-0 md:border-r border-[var(--border-primary)] py-4 md:py-6 z-50">
      {/* ── Brand ── */}
      <div className="px-5 mb-4 md:mb-9 flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-[var(--radius-md)] bg-[var(--accent-green-dim)] flex items-center justify-center text-[var(--accent-green)]">
          <Recycle size={20} />
        </div>
        <div>
          <div className="text-[15px] font-bold text-[var(--text-heading)] tracking-[-0.01em] leading-[1.2]">
            AeternaAI
          </div>
          <div className="text-[11px] text-[var(--text-muted)] tracking-[0.02em]">
            Pusat Operasional
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 flex flex-row md:flex-col gap-2 px-2.5 overflow-x-auto overflow-y-hidden md:overflow-visible no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={`flex items-center gap-3 py-2.5 px-3.5 rounded-[var(--radius-md)] text-[13px] transition-all duration-200 no-underline whitespace-nowrap ${isActive
                  ? "font-semibold text-[var(--accent-green)] bg-[var(--accent-green-dim)] border-b-[3px] md:border-b-0 md:border-l-[3px] border-[var(--accent-green)]"
                  : "font-normal text-[var(--text-secondary)] bg-transparent border-b-[3px] md:border-b-0 md:border-l-[3px] border-transparent hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.03)]"
                }`}
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
