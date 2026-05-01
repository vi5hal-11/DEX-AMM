import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { SwapPage } from "./pages/SwapPage";
import { LiquidityPage } from "./pages/LiquidityPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen" style={{ background: "var(--bg)" }}>
        {/* Animated grid */}
        <div className="grid-bg" />
        {/* Noise overlay */}
        <div className="noise-overlay" />
        {/* Radial glow top-center */}
        <div
          style={{
            position: "fixed",
            top: "-200px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "600px",
            background: "radial-gradient(ellipse at center, rgba(0,212,255,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        {/* Content */}
        <div className="relative" style={{ zIndex: 2 }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/swap" replace />} />
            <Route path="/swap" element={<SwapPage />} />
            <Route path="/liquidity" element={<LiquidityPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
