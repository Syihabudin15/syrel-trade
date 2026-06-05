import React from "react";
import {
  BellOutlined,
  SearchOutlined,
  MenuOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Input, Badge, Typography } from "antd";

const { Text } = Typography;

interface HeaderProps {
  onMenuToggleMobile: () => void;
  onMenuToggleDesktop: () => void;
  desktopCollapsed: boolean;
}

export default function Header({
  onMenuToggleMobile,
  onMenuToggleDesktop,
  desktopCollapsed,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200/80 h-16 px-6 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md bg-white/95">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {/* Tombol Pemicu Mobile Drawer */}
        <button
          onClick={onMenuToggleMobile}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <MenuOutlined className="text-lg" />
        </button>

        {/* Tombol Pemicu Desktop Collapse */}
        <button
          onClick={onMenuToggleDesktop}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg hidden lg:block"
        >
          {desktopCollapsed ? (
            <MenuUnfoldOutlined className="text-base" />
          ) : (
            <MenuFoldOutlined className="text-base" />
          )}
        </button>

        <Input
          prefix={<SearchOutlined className="text-slate-400 mr-1.5" />}
          placeholder="Cari..."
          bordered={false}
          className="bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-transparent focus:border-slate-200 h-10 rounded-xl transition-all hidden sm:flex"
        />
      </div>

      <div className="flex items-center gap-5">
        <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all relative">
          <Badge dot color="#ef4444" offset={[-2, 2]}>
            <BellOutlined className="text-xl" />
          </Badge>
        </button>
        <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <span className="block text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              Admin Syrel
            </span>
            <Text className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
              Premium Account
            </Text>
          </div>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-600 font-extrabold flex items-center justify-center text-sm border border-blue-200 shadow-inner">
            AS
          </div>
        </div>
      </div>
    </header>
  );
}
