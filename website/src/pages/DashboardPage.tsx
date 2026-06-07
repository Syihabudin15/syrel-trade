import React, { useState } from "react";
import { Card, Table, Tag, Switch, Button } from "antd";
import {
  Activity,
  DollarSign,
  TrendingUp,
  Power,
  BarChart2,
  ShieldAlert,
} from "lucide-react";

// --- Mock Data ---
const activePositions = [
  {
    key: "1",
    symbol: "BTC/USDT",
    type: "LONG",
    entry: 64500.5,
    currentPrice: 65200.0,
    pnl: "+ 1.08%",
    isProfit: true,
    size: 0.15,
  },
  {
    key: "2",
    symbol: "ETH/USDT",
    type: "LONG",
    entry: 3450.0,
    currentPrice: 3410.2,
    pnl: "- 1.15%",
    isProfit: false,
    size: 2.5,
  },
];

const recentSignals = [
  {
    time: "10:45:12",
    symbol: "SOL/USDT",
    msg: "Rejected: ADX < 25 (Sideways)",
  },
  { time: "10:42:05", symbol: "BNB/USDT", msg: "Rejected: Price < EMA 200" },
  {
    time: "10:15:30",
    symbol: "BTC/USDT",
    msg: "BUY Executed: Volume Spike 2.1x & RSI 65",
  },
];

export default function DashboardPage() {
  const [botActive, setBotActive] = useState(true);

  // Konfigurasi Kolom Tabel AntD
  const columns = [
    {
      title: "Symbol",
      dataIndex: "symbol",
      key: "symbol",
      render: (text: string) => (
        <span className="font-bold text-gray-800">{text}</span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "LONG" ? "green" : "red"} className="font-bold">
          {type}
        </Tag>
      ),
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "Entry Price",
      dataIndex: "entry",
      key: "entry",
      render: (val: number) => `$${val.toLocaleString()}`,
    },
    {
      title: "Current Price",
      dataIndex: "currentPrice",
      key: "currentPrice",
      render: (val: number) => `$${val.toLocaleString()}`,
    },
    {
      title: "Unrealized PnL",
      dataIndex: "pnl",
      key: "pnl",
      render: (pnl: string, record: any) => (
        <span
          className={`font-semibold ${record.isProfit ? "text-green-600" : "text-red-500"}`}
        >
          {pnl}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: () => (
        <Button danger size="small">
          Close
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 mb-1">Total Saldo</p>
              <h2 className="text-3xl font-bold text-gray-800">$10,450.00</h2>
            </div>
            <div className="p-2 text-green-600 rounded-lg">
              <DollarSign size={24} />
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 mb-1">Total PnL</p>
              <h2 className="text-3xl font-bold text-green-600">+$124.50</h2>
            </div>
            <div className="p-2 text-blue-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 mb-1">Estimasi PnL (Hari ini)</p>
              <h2 className="text-3xl font-bold text-green-600">+$124.50</h2>
            </div>
            <div className="p-2 text-blue-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 mb-1">Bot Aktif</p>
              <h2 className="text-3xl font-bold text-gray-800">2</h2>
            </div>
            <div className="p-2  text-purple-600 rounded-lg">
              <BarChart2 size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ACTIVE POSITIONS TABLE (Takes up 2/3 of space on large screens) */}
        <div className="lg:col-span-2">
          <Card
            title={<span className="text-lg font-bold">Active Positions</span>}
            className="shadow-sm border-gray-100 h-full"
          >
            <Table
              dataSource={activePositions}
              columns={columns}
              pagination={false}
              className="overflow-x-auto"
            />
          </Card>
        </div>

        {/* SYSTEM LOGS & SIGNALS */}
        <div className="lg:col-span-1">
          <Card
            title={<span className="text-lg font-bold">System Logs</span>}
            className="shadow-sm border-gray-100 h-full"
          >
            <div className="flex flex-col gap-3">
              {recentSignals.map((log, index) => (
                <div
                  key={index}
                  className="flex gap-3 text-sm p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <span className="text-gray-400 whitespace-nowrap">
                    {log.time}
                  </span>
                  <div>
                    <span className="font-bold text-gray-700 mr-2">
                      {log.symbol}
                    </span>
                    <span
                      className={`${log.msg.includes("BUY") ? "text-green-600 font-medium" : "text-gray-600"}`}
                    >
                      {log.msg}
                    </span>
                  </div>
                </div>
              ))}

              <Button type="dashed" className="w-full mt-2">
                View All Logs
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
