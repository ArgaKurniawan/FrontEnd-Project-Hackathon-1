"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker based on status
const createCustomIcon = (color: string) => {
  const hex = color.replace("#", "");
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color}; 
        width: 16px; 
        height: 16px; 
        border-radius: 50%; 
        border: 2px solid white; 
        animation: glowPulse-${hex} 2s infinite;
      "></div>
      <style>
        @keyframes glowPulse-${hex} {
          0% { box-shadow: 0 0 0 0 ${color}80; }
          70% { box-shadow: 0 0 0 10px ${color}00; }
          100% { box-shadow: 0 0 0 0 ${color}00; }
        }
      </style>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapComponent({ locations }: { locations: any[] }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div style={{ height: "400px", width: "100%", background: "#1e293b", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#a0aec0" }}>Memuat Peta...</div>;
  }

  const center: [number, number] = locations.length > 0 && locations[0].latitude 
    ? [locations[0].latitude, locations[0].longitude] 
    : [-6.200000, 106.816666]; // Default to Jakarta

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: "400px", width: "100%", borderRadius: "10px", zIndex: 1 }}
    >
      <ChangeView center={center} zoom={11} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {locations.map((loc, index) => {
        if (!loc.latitude || !loc.longitude) return null;
        
        let markerColor = "#4299e1"; // Blue default
        if (loc.status === "CRITICAL" || loc.status === "DANGER") markerColor = "#f56565";
        else if (loc.status === "WARNING" || loc.status === "WASPADA") markerColor = "#ecc94b";
        else if (loc.status === "SAFE" || loc.status === "AMAN") markerColor = "#48bb78";

        return (
          <Marker 
            key={index} 
            position={[loc.latitude, loc.longitude]}
            icon={createCustomIcon(markerColor)}
          >
            <Popup>
              <div style={{ color: "#1a202c", minWidth: "150px" }}>
                <h3 style={{ margin: "0 0 5px 0", fontSize: "14px", fontWeight: "bold" }}>{loc.location}</h3>
                <p style={{ margin: "0 0 5px 0", fontSize: "12px", color: "#4a5568" }}>{loc.city}</p>
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "5px", marginTop: "5px", fontSize: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span>Volume:</span> <strong>{loc.volume_ton} Ton</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span>Trucks:</span> <strong>{loc.trucks}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Status:</span> 
                    <strong style={{ color: markerColor }}>{loc.status}</strong>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
