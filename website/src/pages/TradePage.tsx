import { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Tooltip,
  Badge,
} from "antd";
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Percent,
  Zap,
  Clock,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";

// Import interfaces dari file eksternal kamu
import { ITrade, EBotType, IPageProps } from "../libs/IInterfaces";

export default function TradeHistory() {
  const [data, setData] = useState<IPageProps<ITrade>>({
    data: [],
    total: 0,
    page: 1,
    winrate: 0,
    pnl: 0,
    actives: 0,
    closeds: 0,
    limit: 20,
    search: "",
  });
  const [loading, setLoading] = useState<boolean>(true);

  const getData = async () => {
    setLoading(true);
    const params = {
      limit: data.limit,
      page: data.page,
      search: data.search,
    };
    await fetch("/api/trade?" + new URLSearchParams(params).toString())
      .then((res) => res.json())
      .then((res) =>
        setData((prev) => ({
          ...prev,
          data: res.data,
          total: res.total,
          winrate: res.winrate,
          actives: res.actives.length,
          closeds: res.closeds.length,
          pnl: res.pnl,
        })),
      );
    setLoading(false);
  };

  useEffect(() => {
    setInterval(() => {
      getData();
    }, 1000 * 60);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [data.page, data.limit, data.search]);

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
      render: (reason: string | null) => (
        <div className="text-xs text-slate-400 truncate max-w-50 italic font-serif">
          {reason || <span className="text-slate-300">-</span>}
        </div>
      ),
    },
    {
      title: "Summary",
      dataIndex: "summary",
      key: "summary",
      width: 150,
      render: (summary: string | null) => (
        <Tooltip title={summary} placement="topLeft">
          <div className="text-xs text-slate-400 truncate max-w-50 italic font-serif">
            {summary || <span className="text-slate-300">-</span>}
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
              value={data.pnl}
              precision={2}
              valueStyle={{
                color: data.pnl >= 0 ? "#10b981" : "#f43f5e",
                fontWeight: "bold",
              }}
              prefix={
                data.pnl >= 0 ? (
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
              value={data.winrate}
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
              value={data.actives}
              valueStyle={{
                color: data.actives > 0 ? "#2563eb" : "#64748b",
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
              value={5}
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
            value={data.search}
            onChange={(e) =>
              setData((prev) => ({ ...prev, search: e.target.value }))
            }
          />

          {/* <Select
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
          /> */}

          {/* <Select
            defaultValue="ALL"
            className="w-full sm:w-40"
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: "ALL", label: "Semua Status" },
              { value: "OPEN", label: "Posisi Aktif (Live)" },
              { value: "CLOSED", label: "Selesai (Closed)" },
            ]}
          /> */}
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1">
          <Filter size={12} /> Menampilkan <b>{data.total}</b> rekaman data
        </div>
      </div>

      {/* MAIN DATA TABLE */}
      <div className=" rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <Table
          dataSource={data.data}
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
