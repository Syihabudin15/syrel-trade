import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import BotDetail from "../components/comps/BotDetail"; // Sesuaikan path komponen Detail Bot kamu

export default function BotDetailPage() {
  // 1. Ambil parameter 'id' dari URL.
  // Nama variabel harus sama dengan yang di <Route path="/bot/:id" />
  const { id } = useParams<{ id: string }>();

  // 2. Gunakan useNavigate untuk fungsi tombol kembali
  const navigate = useNavigate();

  // Antisipasi jika id tidak ditemukan di URL
  if (!id) {
    return (
      <div className="p-6 text-center text-rose-500 font-medium">
        Error: Bot ID tidak valid atau tidak ditemukan di URL.
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Membuka Komponen Detail Bot dengan ID dari URL */}
      <BotDetail
        botId={id}
        onBack={() => navigate(-1)} // navigate(-1) artinya kembali ke halaman sebelumnya
      />
    </div>
  );
}
