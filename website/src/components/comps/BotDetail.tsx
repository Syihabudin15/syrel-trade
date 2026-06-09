import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Tabs,
  Badge,
  Tooltip,
  message,
} from "antd";
import {
  Bot,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  Terminal,
  RefreshCw,
  Zap,
  ArrowLeft,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";

// Import interfaces dari file eksternal kamu
import { IBot, ITrade, IBotLog } from "../../libs/IInterfaces";

interface BotDetailProps {
  botId: string;
  onBack?: () => void; // Aksi jika user menekan tombol kembali
}

export default function BotDetail({ botId, onBack }: BotDetailProps) {
  const [botData, setBotData] = useState<IBot | null>(null);
  const [trades, setTrades] = useState<ITrade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fungsi enkapsulasi fetch data gabungan
  const fetchData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      try {
        // 1. Ambil detail data bot (yang otomatis include/embed BotLogs di backend)
        const resBot = await fetch(`/api/bot/${botId}`, { method: "PATCH" });
        if (!resBot.ok) throw new Error("Gagal mengambil data bot");
        const { data } = await resBot.json();
        setBotData(data);
        setTrades(data.Trades);

        setLastUpdated(new Date());
      } catch (error) {
        console.error(error);
        message.error("Gagal melakukan sinkronisasi data dari API Engine.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [botId],
  );

  // Efek untuk fetch data pertama kali & set interval refresh setiap 1 menit
  useEffect(() => {
    fetchData();

    // Setup interval auto-refresh 1 menit (60000 ms)
    const intervalId = setInterval(() => {
      fetchData(true); // IsSilent = true agar tidak memicu spinner utama yang mengganggu UX
    }, 60000);

    // Bersihkan interval saat komponen dilepas (unmounted)
    return () => clearInterval(intervalId);
  }, [fetchData]);

  // ==========================================
  // KALKULASI RINGKASAN METRIK PERFORMA BOT
  // ==========================================
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const activePositions = trades.filter((t) => t.close_time === null).length;
  const closedTrades = trades.filter((t) => t.close_time !== null);
  const winRate =
    closedTrades.length > 0
      ? (closedTrades.filter((t) => t.pnl > 0).length / closedTrades.length) *
        100
      : 0;

  // ==========================================
  // SKEMA CONFIG KOLOM (TRADES & LOGS)
  // ==========================================
  const tradeColumns: ColumnsType<ITrade> = [
    {
      title: "Waktu",
      key: "time",
      render: (_, record) => (
        <div className="text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">In:</span>{" "}
            {new Date(record.open_time).toLocaleTimeString()}
          </div>
          {record.close_time ? (
            <div>
              <span className="font-semibold text-slate-700">Out:</span>{" "}
              {new Date(record.close_time).toLocaleTimeString()}
            </div>
          ) : (
            <Tag color="processing" className="mt-1 animate-pulse text-[10px]">
              LIVE
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Asset Pair",
      dataIndex: ["Pair", "name"],
      key: "pair_name",
      render: (text) => <span className="font-bold ">{text}</span>,
    },
    {
      title: "Side",
      dataIndex: "side",
      key: "side",
      render: (side) => (
        <Tag
          color={side === "buy" ? "green" : "red"}
          className="font-bold uppercase text-xs"
        >
          {side}
        </Tag>
      ),
    },
    {
      title: "Lev & Margin",
      key: "leverage",
      render: (_, record) => (
        <div>
          <span className="font-semibold text-orange-600">{record.lev}x</span>
          <div className="text-[11px] text-slate-400">${record.amount}</div>
        </div>
      ),
    },
    {
      title: "Eksekusi Harga",
      key: "prices",
      render: (_, record) => (
        <div className="text-xs text-slate-600">
          <div>
            Entry:{" "}
            <span className="font-medium">${record.open.toLocaleString()}</span>
          </div>
          <div>
            Exit:{" "}
            <span className="font-medium">
              {record.close ? `$${record.close.toLocaleString()}` : "—"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Target",
      key: "targets",
      render: (_, record) => (
        <div className="text-xs space-y-0.5">
          <div className="text-emerald-600 font-medium">
            TP: ${record.tp_price?.toLocaleString() || "—"}
          </div>
          <div className="text-rose-500 font-medium">
            SL: ${record.sl_price?.toLocaleString() || "—"}
          </div>
        </div>
      ),
    },
    {
      title: "PnL ($)",
      dataIndex: "pnl",
      key: "pnl",
      render: (pnl, record) => (
        <span
          className={`font-bold text-sm ${pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}
        >
          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
          {!record.close_time && (
            <span className="text-[9px] block font-normal text-slate-400 italic">
              (floating)
            </span>
          )}
        </span>
      ),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      render: (reason) => (
        <Tooltip title={reason}>
          <div className="text-xs text-slate-400 truncate max-w-37.5">
            {reason || "—"}
          </div>
        </Tooltip>
      ),
    },
  ];

  const logColumns: ColumnsType<IBotLog> = [
    {
      title: "Timestamp Log",
      dataIndex: "date",
      key: "date",
      width: 180,
      render: (date) => (
        <span className="text-xs font-mono text-slate-400">
          {new Date(date).toLocaleString()}
        </span>
      ),
    },
    {
      title: "System Internal Message / Operational Reason",
      dataIndex: "reason",
      key: "reason",
      render: (reason) => (
        <div className="text-xs font-mono text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre-wrap">
          {reason}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-100 flex flex-col items-center justify-center gap-2">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-400 text-sm">
          Mengompilasi catatan riwayat instans bot...
        </p>
      </div>
    );
  }

  if (!botData)
    return (
      <div className="text-center p-8 text-slate-400">
        Instance bot tidak ditemukan.
      </div>
    );

  return (
    <div className="space-y-6">
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
              <h1 className="text-xl font-bold ">{botData.name}</h1>
              <Tag color={botData.active ? "success" : "default"}>
                {botData.active ? "RUNNING" : "IDLE"}
              </Tag>
              <Tag color="blue">{botData.type}</Tag>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {botData.description || "Tidak ada deskripsi operasional."}
            </p>
          </div>
        </div>

        {/* METODE UTOR REFRESH INFO */}
        <div className="flex items-center gap-3">
          <div className="text-right text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
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
                  Total Realized PnL
                </span>
              }
              value={totalPnL}
              precision={2}
              valueStyle={{
                color: totalPnL >= 0 ? "#10b981" : "#f43f5e",
                fontWeight: "bold",
              }}
              prefix={
                totalPnL >= 0 ? (
                  <TrendingUp size={18} className="mr-1" />
                ) : (
                  <TrendingDown size={18} className="mr-1" />
                )
              }
              suffix={
                <span className="text-xs text-slate-400 font-normal ml-0.5">
                  USD
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
                  Instance Win Rate
                </span>
              }
              value={winRate}
              precision={1}
              valueStyle={{ color: "#4f46e5", fontWeight: "bold" }}
              suffix="%"
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
                  Open Floating Positions
                </span>
              }
              value={activePositions}
              valueStyle={{
                color: activePositions > 0 ? "#2563eb" : "#64748b",
                fontWeight: "bold",
              }}
              suffix={
                <span className="text-xs text-slate-400 font-normal ml-1">
                  Trades
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* TABS CONTROLLER (TRADES vs LOGS) */}
      <div className=" rounded-xl shadow-sm border border-slate-100 p-5">
        <Tabs
          defaultActiveKey="1"
          type="line"
          items={[
            {
              key: "1",
              label: (
                <span className="flex items-center gap-1.5 font-medium px-1">
                  <Activity size={15} /> Execution Trades ({trades.length})
                </span>
              ),
              children: (
                <div className="pt-2">
                  <Table
                    dataSource={trades}
                    columns={tradeColumns}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    scroll={{ x: true }}
                    size="small"
                  />
                </div>
              ),
            },
            {
              key: "2",
              label: (
                <span className="flex items-center gap-1.5 font-medium px-1">
                  <Terminal size={15} /> Core Engine Logs (
                  {botData.BotLogs?.length || 0})
                </span>
              ),
              children: (
                <div className="pt-2">
                  <Table
                    dataSource={botData.BotLogs || []}
                    columns={logColumns}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
