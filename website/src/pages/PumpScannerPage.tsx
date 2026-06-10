import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import BotPumpScanner from "../components/comps/BotPumpScannerDetail";

export default function BotPumpScannerPage() {
  // Ambil botId dari URL, contoh route config: /bot/:id/pump-scanner
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="p-6 text-center text-rose-500 font-medium">
        Error: Bot ID tidak ditemukan pada tautan URL.
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <BotPumpScanner
        botId={id}
        onBack={() => navigate(-1)} // Kembali ke dashboard list bot / detail bot sebelumnya
      />
    </div>
  );
}
