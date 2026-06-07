import React from "react";
import {
  BellOutlined,
  MenuOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
} from "@ant-design/icons";
import { Badge, Button } from "antd";

interface HeaderProps {
  onMenuToggleMobile: () => void;
  onMenuToggleDesktop: () => void;
  desktopCollapsed: boolean;
  changetheme: React.Dispatch<React.SetStateAction<"light" | "dark">>;
  theme: "dark" | "light";
}

export default function Header({
  onMenuToggleMobile,
  onMenuToggleDesktop,
  desktopCollapsed,
  changetheme,
  theme,
}: HeaderProps) {
  return (
    <header className="bg-white dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800 h-16 px-6 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {/* Tombol Pemicu Mobile Drawer */}
        <button
          onClick={onMenuToggleMobile}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
        >
          <MenuOutlined className="text-lg" />
        </button>

        {/* Tombol Pemicu Desktop Collapse */}
        <button
          onClick={onMenuToggleDesktop}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg hidden lg:block cursor-pointer"
        >
          {desktopCollapsed ? (
            <MenuUnfoldOutlined className="text-base" />
          ) : (
            <MenuFoldOutlined className="text-base" />
          )}
        </button>
        <Button
          type="text"
          size="small"
          icon={theme === "dark" ? <SunOutlined /> : <MoonOutlined />}
          onClick={() => changetheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "Light" : "Dark"}
        </Button>
      </div>

      <div className="flex items-center gap-5">
        <button className="p-2 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all relative">
          <Badge dot color="#ef4444" offset={[-2, 2]}>
            <BellOutlined className="text-xl" />
          </Badge>
        </button>
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <span className="block text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
              Admin Syrel
            </span>
            <div className="text-xs text-slate-400 dark:text-slate-500 opacity-70">
              Premium Account
            </div>
          </div>
          <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-blue-100 to-indigo-100 text-blue-600 font-extrabold flex items-center justify-center text-sm border border-blue-200 shadow-inner">
            AS
          </div>
        </div>
      </div>
    </header>
  );
}
