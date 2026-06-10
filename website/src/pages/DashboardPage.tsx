import React, { useState, useEffect } from "react";
import {
  Tabs,
  Table,
  Tag,
  Card,
  Statistic,
  Row,
  Col,
  Tooltip,
  Switch,
  message,
} from "antd";
import {
  Play,
  Square,
  Activity,
  TrendingUp,
  TrendingDown,
  Bot,
  Coins,
  History,
  LayoutDashboard,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";

// Import interfaces dari file eksternal sesuai struktur folder kamu
import { IBot, IPair, ITrade, EBotType } from "../libs/IInterfaces";

export default function App() {
  // State untuk menyimpan data dari API
  const [bots, setBots] = useState<IBot[]>([]);
  const [pairs, setPairs] = useState<IPair[]>([]);
  const [trades, setTrades] = useState<ITrade[]>([]);

  // State untuk loading indicator
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch semua data saat komponen pertama kali dimuat
  useEffect(() => {
    async function fetchAllData() {
      try {
        setLoading(true);
        const [resBots, resPairs, resTrades] = await Promise.all([
          fetch("/api/bot")
            .then((res) => res.json())
            .then((res) => res.data),
          fetch("/api/pair")
            .then((res) => res.json())
            .then((res) => res.data),
          fetch("/api/trade")
            .then((res) => res.json())
            .then((res) => res.data),
        ]);

        setBots(resBots);
        setPairs(resPairs);
        setTrades(resTrades);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        message.error("Gagal mengambil data dari server API.");
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, []);

  // Handler untuk mengubah status aktif Bot ke API
  const handleToggleBot = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      const response = await fetch(
        `/api/bot/${id}/${currentStatus ? "stop" : "start"}`,
        {
          method: "PUT", // atau PUT sesuaikan dengan backend kamu
          headers: { "Content-Type": "application/json" },
          // body: JSON.stringify({ active: newStatus }),
        },
      );

      if (!response.ok) throw new Error("Network response was not ok");

      // Update state lokal jika API berhasil
      setBots((prev) =>
        prev.map((bot) =>
          bot.id === id ? { ...bot, active: newStatus } : bot,
        ),
      );
      message.success(
        `Bot berhasil ${newStatus ? "diaktifkan" : "dinonaktifkan"}`,
      );
    } catch (error) {
      message.error("Gagal mengubah status bot.");
      console.error(error);
    }
  };

  // Hitung akumulasi PnL Hari Ini (Dari trade yang sudah close)
  const todayPnL = trades
    .filter(
      (t) =>
        t.close_time &&
        new Date(t.close_time).toDateString() === new Date().toDateString(),
    )
    .reduce((sum, t) => sum + t.pnl, 0);

  // Helper badge warna untuk tipe bot
  const getBotTypeTag = (type: EBotType) => {
    const config = {
      [EBotType.SMC]: { color: "gold", text: "SMC" },
      [EBotType.TRADING]: { color: "blue", text: "TRADING" },
      [EBotType.SCANNER]: { color: "purple", text: "SCANNER" },
    };
    return (
      <Tag color={config[type]?.color || "default"}>
        {config[type]?.text || type}
      </Tag>
    );
  };

  // ==========================================
  // CONFIG KOLOM TABEL ANTD
  // ==========================================
  const pairColumns: ColumnsType<IPair> = [
    {
      title: "Asset Pair",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span className="font-semibold text-slate-700">{text}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
          <span
            className={`h-2 w-2 rounded-full ${status ? "bg-emerald-500" : "bg-slate-300"}`}
          />
          {status ? "Active Monitoring" : "Paused"}
        </span>
      ),
    },
  ];

  const tradeColumns: ColumnsType<ITrade> = [
    {
      title: "Date / Time",
      key: "time",
      render: (_, record) => (
        <div className="text-xs text-slate-500">
          <div>
            <span className="font-medium text-slate-700">Open:</span>{" "}
            {new Date(record.open_time).toLocaleTimeString()}
          </div>
          {record.close_time ? (
            <div>
              <span className="font-medium text-slate-700">Close:</span>{" "}
              {new Date(record.close_time).toLocaleTimeString()}
            </div>
          ) : (
            <Tag color="processing" className="mt-1 animate-pulse">
              LIVE POSITION
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Market / System",
      key: "market",
      render: (_, record) => (
        <div>
          <div className="font-bold text-slate-800">
            {record.Pair?.name || "Unknown Pair"}
          </div>
          <div className="text-xs text-slate-400">
            {record.Bot?.name || "Manual / Deleted Bot"}
          </div>
        </div>
      ),
    },
    {
      title: "Side",
      dataIndex: "side",
      key: "side",
      render: (side) => (
        <Tag
          color={side === "buy" ? "green" : "red"}
          className="font-bold uppercase"
        >
          {side}
        </Tag>
      ),
    },
    {
      title: "Leverage & Margin",
      key: "leverage",
      render: (_, record) => (
        <div>
          <span className="font-semibold text-orange-600">{record.lev}x</span>
          <div className="text-xs text-slate-500">
            ${record.amount.toFixed(2)}
          </div>
        </div>
      ),
    },
    {
      title: "Execution Prices",
      key: "prices",
      render: (_, record) => (
        <div className="text-xs">
          <div>
            <span className="text-slate-400">Entry:</span>{" "}
            <span className="font-medium">${record.open.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400">Exit:</span>{" "}
            <span className="font-medium">
              ${record.close ? record.close.toLocaleString() : "—"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "TP / SL Target",
      key: "tpsl",
      render: (_, record) => (
        <div className="text-xs">
          <div className="text-emerald-600">
            TP: ${record.tp_price?.toLocaleString() || "—"}
          </div>
          <div className="text-rose-600">
            SL: ${record.sl_price?.toLocaleString() || "—"}
          </div>
        </div>
      ),
    },
    {
      title: "PnL ($)",
      dataIndex: "pnl",
      key: "pnl",
      render: (pnl, record) => {
        const isProfit = pnl >= 0;
        const isLive = !record.close_time;
        return (
          <div
            className={`font-bold text-sm ${isProfit ? "text-emerald-600" : "text-rose-600"}`}
          >
            {isProfit ? "+" : ""}${pnl.toFixed(2)}
            {isLive && (
              <span className="text-[10px] block font-normal text-slate-400 italic">
                (floating)
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Trigger Reason",
      dataIndex: "reason",
      key: "reason",
      width: 200,
      render: (reason) => (
        <Tooltip title={reason}>
          <div className="text-xs text-slate-500 truncate max-w-45">
            {reason || (
              <span className="text-slate-300 italic">No reason logged</span>
            )}
          </div>
        </Tooltip>
      ),
    },
  ];

  // Tampilan Loading Screen saat fetch pertama kali
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-medium">
          Sinkronisasi Ledger & API Engine...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-6 font-sans">
      {/* HEADER */}
      <header className="mb-8 flex items-center justify-between  p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="text-indigo-600 animate-pulse" size={28} />
            Algorithmic Trading Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sistem Otomasi Eksekusi & Monitoring Aset Real-time
          </p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>
            System Status: <Tag color="success">OPERATIONAL</Tag>
          </div>
        </div>
      </header>

      {/* TABS CONTAINER */}
      <Tabs
        defaultActiveKey="1"
        type="card"
        items={[
          {
            key: "1",
            label: (
              <span className="flex items-center gap-2 px-2 py-1 font-medium">
                <LayoutDashboard size={16} /> Dashboard
              </span>
            ),
            children: (
              <div className="space-y-6">
                {/* WIDGET METRICS */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Card className="shadow-sm border-none">
                      <Statistic
                        title={
                          <span className="text-slate-400 font-medium">
                            Total Active Bots
                          </span>
                        }
                        value={bots.filter((b) => b.active).length}
                        suffix={`/ ${bots.length}`}
                        prefix={
                          <Bot className="text-indigo-600 mr-2" size={20} />
                        }
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card className="shadow-sm border-none">
                      <Statistic
                        title={
                          <span className="text-slate-400 font-medium">
                            Accumulated PnL (Today)
                          </span>
                        }
                        value={todayPnL}
                        precision={2}
                        valueStyle={{
                          color: todayPnL >= 0 ? "#10b981" : "#f43f5e",
                        }}
                        prefix={
                          todayPnL >= 0 ? (
                            <TrendingUp className="mr-2" size={20} />
                          ) : (
                            <TrendingDown className="mr-2" size={20} />
                          )
                        }
                        suffix="$"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card className="shadow-sm border-none">
                      <Statistic
                        title={
                          <span className="text-slate-400 font-medium">
                            Monitored Pairs
                          </span>
                        }
                        value={pairs.filter((p) => p.status).length}
                        prefix={
                          <Coins className="text-amber-500 mr-2" size={20} />
                        }
                      />
                    </Card>
                  </Col>
                </Row>

                {/* BOT INSTANCES & WATCHLIST */}
                <Row gutter={[20, 20]}>
                  {/* Bots Grid */}
                  <Col xs={24} lg={16}>
                    <h2 className="text-lg font-bold text-slate-800 mb-4">
                      Engine Instances (`IBot[]`)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bots.map((bot) => (
                        <Card
                          key={bot.id}
                          className="shadow-sm border border-slate-100 rounded-xl hover:shadow-md transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base text-slate-800">
                                  {bot.name}
                                </h3>
                                {getBotTypeTag(bot.type)}
                              </div>
                              <p className="text-xs text-slate-400 mt-1 min-h-8">
                                {bot.description ||
                                  "No descriptions available."}
                              </p>
                            </div>
                            <Switch
                              checkedChildren={
                                <Play size={12} className="mt-1" />
                              }
                              unCheckedChildren={
                                <Square size={12} className="mt-1" />
                              }
                              checked={bot.active}
                              onChange={() =>
                                handleToggleBot(bot.id, bot.active)
                              }
                            />
                          </div>

                          {/* Bot Logs */}
                          <div className=" p-3 rounded-lg border border-slate-100 mt-2">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1 mb-1">
                              <AlertCircle size={10} /> Last System Log
                            </div>
                            {bot.BotLogs && bot.BotLogs.length > 0 ? (
                              <p className="text-xs text-slate-600 font-mono truncate">
                                {bot.BotLogs[0].reason}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 italic">
                                No dynamic logs active
                              </p>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Col>

                  {/* Pair Table */}
                  <Col xs={24} lg={8}>
                    <h2 className="text-lg font-bold text-slate-800 mb-4">
                      Pair Core Matrix (`IPair[]`)
                    </h2>
                    <div className=" rounded-xl shadow-sm border border-slate-100 p-2">
                      <Table
                        dataSource={pairs.slice(0, 5)}
                        columns={pairColumns}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    </div>
                  </Col>
                </Row>
              </div>
            ),
          },
          {
            key: "2",
            label: (
              <span className="flex items-center gap-2 px-2 py-1 font-medium">
                <History size={16} /> History Trade
              </span>
            ),
            children: (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-800">
                    Historical Operational Ledger (`ITrade[]`)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Seluruh rekaman aksi pasar, targets, leverage, dan performa
                    real-time.
                  </p>
                </div>
                <Table
                  dataSource={trades}
                  columns={tradeColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: true }}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
