import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "WasteIntel — Operational Hub",
  description:
    "Real-time waste management intelligence system for monitoring, analysis, operations, and risk assessment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body
        style={{
          margin: 0,
          display: "flex",
          minHeight: "100vh",
          background: "var(--bg-primary)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <Sidebar />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
