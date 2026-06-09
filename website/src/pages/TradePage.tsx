import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Tooltip,
  Space,
  Badge,
  message,
} from "antd";
import {
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Percent,
  Zap,
  Clock,
  HelpCircle,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";

// Import interfaces dari file eksternal kamu
import { ITrade, EBotType } from "../libs/IInterfaces";

export default function TradeHistory() {
  const [trades, setTrades] = useState<ITrade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // State untuk Filter & Pencarian
  const [searchPair, setSearchPair] = useState<string>("");
  const [sideFilter, setSideFilter] = useState<string>("ALL");
  const [botTypeFilter, setBotTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Fetch data dari API /api/trade
  useEffect(() => {
    async function fetchTrades() {
      try {
        setLoading(true);
        const res = await fetch("/api/trade");
        const { data } = await res.json();
        setTrades(data);
      } catch (error) {
        message.error("Gagal memuat history trade.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrades();
  }, []);

  // ==========================================
  // KALKULASI METRIK STATISTIK (DARI DATA API)
  // ==========================================
  const totalTrades = trades.length;
  const closedTrades = trades.filter((t) => t.close_time !== null);
  const openTradesCount = totalTrades - closedTrades.length;

  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);

  const winTrades = closedTrades.filter((t) => t.pnl > 0).length;
  const winRate =
    closedTrades.length > 0 ? (winTrades / closedTrades.length) * 100 : 0;

  const avgLeverage =
    totalTrades > 0
      ? trades.reduce((sum, t) => sum + t.lev, 0) / totalTrades
      : 0;

  // ==========================================
  // LOGIKA FILTERING DATA
  // ==========================================
  const filteredTrades = trades.filter((trade) => {
    const matchPair = trade.Pair?.name
      .toLowerCase()
      .includes(searchPair.toLowerCase());
    const matchSide = sideFilter === "ALL" || trade.side === sideFilter;
    const matchBotType =
      botTypeFilter === "ALL" || trade.Bot?.type === botTypeFilter;

    let matchStatus = true;
    if (statusFilter === "OPEN") matchStatus = trade.close_time === null;
    if (statusFilter === "CLOSED") matchStatus = trade.close_time !== null;

    return matchPair && matchSide && matchBotType && matchStatus;
  });

  // ==========================================
  // CONFIGURASI KOLOM TABEL ANTD
  // ==========================================
  const columns: ColumnsType<ITrade> = [
    {
      title: "Waktu Eksekusi",
      key: "timestamps",
      width: 200,
      render: (_, record) => (
        <div className="text-xs space-y-1 text-slate-500">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-700 w-12">Open:</span>
            <span>
              {new Date(record.open_time).toLocaleString("id-ID", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-700 w-12">Close:</span>
            {record.close_time ? (
              <span>
                {new Date(record.close_time).toLocaleString("id-ID", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            ) : (
              <Badge
                status="processing"
                text={
                  <span className="text-indigo-600 font-medium animate-pulse text-[11px]">
                    RUNNING
                  </span>
                }
              />
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Pasar / Sistem",
      key: "market_system",
      render: (_, record) => (
        <div>
          <div className="font-bold  text-sm tracking-wide">
            {record.Pair?.name || "N/A"}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <span>{record.Bot?.name || "Manual Execution"}</span>
            {record.Bot?.type && (
              <Tag
                // size="small"
                className="text-[9px] px-1 py-0 border-none bg-slate-100 text-slate-500"
              >
                {record.Bot.type}
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Aksi",
      dataIndex: "side",
      key: "side",
      align: "center",
      render: (side: "buy" | "sell") => (
        <Tag
          color={side === "buy" ? "green" : "red"}
          className="font-bold uppercase px-2.5 py-0.5 rounded border-none text-xs"
        >
          {side.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Lev Margin",
      key: "leverage_margin",
      render: (_, record) => (
        <div>
          <div className="font-bold text-amber-600 flex items-center gap-0.5 text-sm">
            {record.lev}x{" "}
            <Zap size={12} className="fill-amber-500 text-amber-500" />
          </div>
          <div className="text-xs text-slate-400">
            ${record.amount.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: "Harga Pengikatan",
      key: "execution_prices",
      render: (_, record) => (
        <div className="text-xs space-y-0.5 text-slate-600">
          <div>
            <span className="text-slate-400">Entry:</span>{" "}
            <span className="font-medium">${record.open.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400">Exit:</span>{" "}
            <span className="font-medium">
              {record.close ? `$${record.close.toLocaleString()}` : "—"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Target TP / SL",
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
      title: "Realized PnL",
      dataIndex: "pnl",
      key: "pnl",
      sorter: (a, b) => a.pnl - b.pnl,
      render: (pnl: number, record) => {
        const isProfit = pnl >= 0;
        const isLive = !record.close_time;
        return (
          <div>
            <span
              className={`font-bold text-sm ${isProfit ? "text-emerald-600" : "text-rose-600"}`}
            >
              {isProfit ? "+" : ""}${pnl.toFixed(2)}
            </span>
            {isLive && (
              <span className="block text-[10px] text-slate-400 font-normal italic mt-0.5">
                (unrealized PnL)
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      width: 100,
      render: (reason: string | null) => (
        <Tooltip title={reason} placement="topLeft">
          <div className="text-xs text-slate-400 truncate max-w-50 italic font-serif">
            {reason || <span className="text-slate-300">-</span>}
          </div>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="min-h-screen  font-sans">
      {/* HEADER UTAMA */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold  flex items-center gap-2">
          <Clock className="text-indigo-600" size={26} /> Historical Trade
          Ledger
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Audit transparansi penuh dari performa mitigasi risiko, eksekusi bot,
          dan profitabilitas pasar.
        </p>
      </div>

      {/* METRIC PANEL (SUMMARY CARDS) */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="shadow-sm border-none rounded-xl"
            bodyStyle={{ padding: "20px" }}
          >
            <Statistic
              title={
                <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Net Profit / Loss
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
                  <TrendingUp size={20} className="mr-1.5" />
                ) : (
                  <TrendingDown size={20} className="mr-1.5" />
                )
              }
              suffix={
                <span className="text-xs font-normal text-slate-400 ml-1">
                  USD
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="shadow-sm border-none rounded-xl"
            bodyStyle={{ padding: "20px" }}
          >
            <Statistic
              title={
                <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Bot Strategy Win Rate
                </span>
              }
              value={winRate}
              precision={1}
              valueStyle={{ color: "#4f46e5", fontWeight: "bold" }}
              prefix={<Percent size={18} className="text-indigo-600 mr-1.5" />}
              suffix={
                <span className="text-xs font-normal text-slate-400 ml-0.5">
                  %
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="shadow-sm border-none rounded-xl"
            bodyStyle={{ padding: "20px" }}
          >
            <Statistic
              title={
                <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Active Floating Positions
                </span>
              }
              value={openTradesCount}
              valueStyle={{
                color: openTradesCount > 0 ? "#2563eb" : "#64748b",
                fontWeight: "bold",
              }}
              suffix={
                <span className="text-xs font-normal text-slate-400 ml-1">
                  Trades open
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="shadow-sm border-none rounded-xl"
            bodyStyle={{ padding: "20px" }}
          >
            <Statistic
              title={
                <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Average Leverage Multiplier
                </span>
              }
              value={avgLeverage}
              precision={1}
              valueStyle={{ color: "#d97706", fontWeight: "bold" }}
              suffix={
                <span className="text-xs font-normal text-slate-400 ml-1">
                  x factor
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* FILTER PANEL */}
      <div className=" p-4 rounded-xl shadow-sm border border-slate-100 mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Input
            placeholder="Cari Pair (misal: BTC/USDT)..."
            prefix={<Search size={15} className="text-slate-400" />}
            className="w-full sm:w-56 rounded-lg"
            allowClear
            value={searchPair}
            onChange={(e) => setSearchPair(e.target.value)}
          />

          <Select
            defaultValue="ALL"
            className="w-full sm:w-36"
            onChange={(val) => setSideFilter(val)}
            options={[
              { value: "ALL", label: "Semua Aksi (Side)" },
              { value: "buy", label: "Long / Buy" },
              { value: "sell", label: "Short / Sell" },
            ]}
          />

          <Select
            defaultValue="ALL"
            className="w-full sm:w-44"
            onChange={(val) => setBotTypeFilter(val)}
            options={[
              { value: "ALL", label: "Semua Strategi Bot" },
              { value: EBotType.SMC, label: "Smart Money (SMC)" },
              { value: EBotType.TRADING, label: "Direct Trading" },
              { value: EBotType.SCANNER, label: "Market Scanner" },
            ]}
          />

          <Select
            defaultValue="ALL"
            className="w-full sm:w-40"
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: "ALL", label: "Semua Status" },
              { value: "OPEN", label: "Posisi Aktif (Live)" },
              { value: "CLOSED", label: "Selesai (Closed)" },
            ]}
          />
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1">
          <Filter size={12} /> Menampilkan <b>{filteredTrades.length}</b>{" "}
          rekaman data
        </div>
      </div>

      {/* MAIN DATA TABLE */}
      <div className=" rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <Table
          dataSource={filteredTrades}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            className: "px-6 py-3 border-t border-slate-50",
          }}
          scroll={{ x: 1300 }}
          className="custom-history-table"
        />
      </div>
    </div>
  );
}
