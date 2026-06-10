import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Tooltip,
  message,
} from "antd";
import {
  Clock,
  RefreshCw,
  ArrowLeft,
  Radar,
  Activity,
  CheckCircle2,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";

// Import interface IPumpScanner & IBot sesuai struktur Anda
import { IPumpScanner, IBot } from "../../libs/IInterfaces";

interface BotPumpScannerProps {
  botId: string;
  onBack?: () => void;
}

export default function BotPumpScanner({ botId, onBack }: BotPumpScannerProps) {
  const [scanners, setScanners] = useState<IPumpScanner[]>([]);
  const [botInfo, setBotInfo] = useState<IBot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fungsi fetch data spesifik scanner berdasarkan botId
  const fetchData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      try {
        // Silakan sesuaikan endpoint ini dengan backend Anda,
        // misal: /api/pump-scanner?botId=${botId} atau /api/bot/${botId}/scanner
        const res = await fetch(`/api/pump_scanner/?botId=${botId}`, {
          method: "GET",
        });
        if (!res.ok) throw new Error("Gagal mengambil data pump scanner");

        const { data } = await res.json();

        // Asumsi payload backend mengembalikan data bot dan list scanners-nya
        setScanners(data || []);
        setBotInfo(data.bot || null);

        setLastUpdated(new Date());
      } catch (error) {
        console.error(error);
        message.error("Gagal menyinkronkan data scanner dari server.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [botId],
  );

  useEffect(() => {
    fetchData();
    // Auto-refresh setiap 1 menit
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  // ==========================================
  // METRIK RINGKASAN SCANNER
  // ==========================================
  const totalSignals = scanners.length;
  const activeSignals = scanners.filter((s) => s.active).length;
  const expiredSignals = totalSignals - activeSignals;

  // ==========================================
  // SKEMA CONFIG KOLOM ANT DESIGN
  // ==========================================
  const columns: ColumnsType<IPumpScanner> = [
    {
      title: "Waktu Scan",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (date) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(date).toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      title: "Asset Pair",
      dataIndex: ["Pair", "name"],
      key: "pair_name",
      render: (text) => (
        <span className="font-bold text-slate-800">{text || "—"}</span>
      ),
    },
    {
      title: "Setup / Reason",
      dataIndex: "reason",
      key: "reason",
      render: (reason) => (
        <Tag color="blue" className="font-medium text-xs">
          {reason || "No Reason Specified"}
        </Tag>
      ),
    },
    {
      title: "Open Price",
      dataIndex: "open",
      key: "open",
      render: (val) => (
        <span className="font-mono font-medium text-slate-600">
          ${val.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Target Profit (TP)",
      dataIndex: "tp",
      key: "tp",
      render: (val) => (
        <span className="font-mono font-bold text-emerald-600">
          ${val.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Stop Loss (SL)",
      dataIndex: "sl",
      key: "sl",
      render: (val) => (
        <span className="font-mono font-bold text-rose-500">
          ${val.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Status Signal",
      dataIndex: "active",
      key: "active",
      render: (active) => (
        <Tag
          color={active ? "processing" : "default"}
          className={active ? "animate-pulse" : ""}
        >
          {active ? "ACTIVE SCAN" : "EXPIRED / HIT"}
        </Tag>
      ),
    },
    {
      title: "Summary Analisis",
      dataIndex: "summary",
      key: "summary",
      render: (summary) => (
        <Tooltip
          title={
            <div className="whitespace-pre-wrap max-h-60 overflow-y-auto">
              {summary}
            </div>
          }
          overlayStyle={{ maxWidth: "320px" }}
        >
          <div className="text-xs text-slate-400 truncate max-w-44 cursor-help italic">
            {summary || "—"}
          </div>
        </Tooltip>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-100 flex flex-col items-center justify-center gap-2">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-400 text-sm">
          Mendapatkan log scanner berdasarkan Bot ID...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ACTION TOP BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              type="text"
              icon={<ArrowLeft size={18} />}
              onClick={onBack}
              className="hover:bg-slate-100 rounded-lg"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Radar size={20} className="text-indigo-600" />
                Pump Scanner Logs
              </h1>
              {botInfo && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-600 font-medium">
                    {botInfo.name}
                  </span>
                  <Tag color="blue">{botInfo.type}</Tag>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Riwayat deteksi indikasi lonjakan volume (pump) berdasarkan
              parameter bot.
            </p>
          </div>
        </div>

        {/* METODE AUTO REFRESH INFO */}
        <div className="flex items-center gap-3">
          <div className="text-right text-[11px] text-slate-400">
            <span className="flex items-center gap-1 justify-end">
              <Clock size={12} /> Auto-refresh active (1m)
            </span>
            <div>Terakhir diperbarui: {lastUpdated.toLocaleTimeString()}</div>
          </div>
          <Button
            icon={
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin text-indigo-600" : ""}
              />
            }
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="rounded-lg flex items-center gap-1 font-medium text-xs text-slate-600"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* METRIC ROW WIDGETS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card
            className="shadow-sm border-none rounded-xl"
            bodyStyle={{ padding: "16px" }}
          >
            <Statistic
              title={
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Total Detected Signals
                </span>
              }
              value={totalSignals}
              valueStyle={{ color: "#1e293b", fontWeight: "bold" }}
              prefix={<Activity size={18} className="mr-1 text-slate-400" />}
              suffix={
                <span className="text-xs text-slate-400 font-normal ml-1">
                  Signals
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            className="shadow-sm border-none rounded-xl"
            bodyStyle={{ padding: "16px" }}
          >
            <Statistic
              title={
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Active Monitoring
                </span>
              }
              value={activeSignals}
              valueStyle={{ color: "#2563eb", fontWeight: "bold" }}
              prefix={
                <Radar size={18} className="mr-1 text-blue-500 animate-pulse" />
              }
              suffix={
                <span className="text-xs text-slate-400 font-normal ml-1">
                  Live
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            className="shadow-sm border-none rounded-xl"
            bodyStyle={{ padding: "16px" }}
          >
            <Statistic
              title={
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Expired / Closed Sinyal
                </span>
              }
              value={expiredSignals}
              valueStyle={{ color: "#64748b", fontWeight: "bold" }}
              prefix={
                <CheckCircle2 size={18} className="mr-1 text-slate-400" />
              }
              suffix={
                <span className="text-xs text-slate-400 font-normal ml-1">
                  Done
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* DATA TABLE MAIN CONTENT */}
      <div className="rounded-xl shadow-sm border border-slate-100 p-2">
        <Table
          dataSource={scanners}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: true }}
          size="small"
        />
      </div>
    </div>
  );
}
