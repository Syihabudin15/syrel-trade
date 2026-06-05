import React from "react";
import {
  CloudServerOutlined,
  CreditCardOutlined,
  SettingOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  HistoryOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Menu } from "antd";

interface SidebarProps {
  activeKey: string;
  onChangeKey: (key: string) => void;
  collapsed?: boolean;
}

export default function Sidebar({
  activeKey,
  onChangeKey,
  collapsed = false,
}: SidebarProps) {
  const menuItems = [
    {
      key: "dashboard",
      icon: <AppstoreOutlined className="!text-lg" />,
      label: "Dashboard Utama",
    },
    { type: "divider" as const },
    {
      key: "products-group",
      label: collapsed ? "" : "PRODUK & LAYANAN",
      type: "group" as const,
      children: [
        {
          key: "instances",
          icon: <CloudServerOutlined />,
          label: "Instance Saya",
        },
        { key: "buy", icon: <ShoppingCartOutlined />, label: "Beli Produk" },
      ],
    },
    {
      key: "billing-group",
      label: collapsed ? "" : "KEUANGAN",
      type: "group" as const,
      children: [
        {
          key: "subscription",
          icon: <CreditCardOutlined />,
          label: "Langganan",
        },
        {
          key: "history",
          icon: <HistoryOutlined />,
          label: "Riwayat Pembayaran",
        },
      ],
    },
    { type: "divider" as const },
    { key: "settings", icon: <SettingOutlined />, label: "Pengaturan Akun" },
  ];

  return (
    <aside
      className={`h-screen bg-white border-r border-slate-200 flex flex-col justify-between sticky top-0 hidden lg:flex select-none transition-all duration-300 z-30
        ${collapsed ? "w-20" : "w-64"}`}
    >
      <div>
        {/* Logo Brand Area (Sekarang Putih Bersih) */}
        <div
          className={`p-6 flex items-center border-b border-slate-100 ${collapsed ? "justify-center" : "gap-3"}`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-lg font-black text-white shadow-md shadow-blue-500/20">
            S
          </div>
          {!collapsed && (
            <span className="text-slate-900 font-extrabold text-base tracking-tight whitespace-nowrap">
              syrel<span className="text-blue-600 font-light">digital</span>
            </span>
          )}
        </div>

        {/* Ant Design Menu Element - Diubah ke Light Theme & Mengikuti Lebar Kontainer */}
        <div className="px-3 py-4 flex justify-center">
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[activeKey]}
            onClick={(e) => onChangeKey(e.key)}
            items={menuItems}
            theme="light" // <-- Mengubah tema internal Antd menjadi Light
            className="bg-transparent border-none !text-slate-600 font-medium !w-full
                       [&.ant-menu-inline-collapsed]:!w-full
                       [&_.ant-menu-item]:!rounded-xl [&_.ant-menu-item]:my-1
                       [&_.ant-menu-item-selected]:!bg-blue-50 [&_.ant-menu-item-selected]:!text-blue-600
                       [&_.ant-menu-item-selected_.anticon]:!text-blue-600
                       [&_.ant-menu-item-group-title]:!text-slate-400 [&_.ant-menu-item-group-title]:!text-[10px] 
                       [&_.ant-menu-item-group-title]:!font-bold [&_.ant-menu-item-group-title]:!tracking-widest"
          />
        </div>
      </div>
    </aside>
  );
}
