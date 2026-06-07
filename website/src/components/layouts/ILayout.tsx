import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useState } from "react";
import { Drawer } from "antd";

export default function ILayout({
  theme,
  changetheme,
}: {
  theme: "light" | "dark";
  changetheme: React.Dispatch<React.SetStateAction<"light" | "dark">>;
}) {
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const currentMenu = location.pathname.split("/")[1] || "dashboard";

  const handleMenuChange = (key: string) => {
    // if (key === "dashboard") {
    //   navigate("/");
    // } else {
    navigate(`/${key}`);
    // }
    setMobileOpen(false); // Otomatis tutup laci menu di mobile setelah diklik
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* SIDEBAR: Versi Layar Gede (Desktop) */}
      <Sidebar
        activeKey={currentMenu}
        onChangeKey={handleMenuChange}
        collapsed={desktopCollapsed}
      />

      {/* DRAWER: Versi Layar Kecil (Mobile & Tablet) */}
      <Drawer
        placement="left"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        closable={false}
        styles={{ body: { padding: 0, backgroundColor: "#020617" } }} // Menyatu dengan slate-950
        size={260}
      >
        {/* Kita panggil komponen Sidebar di dalam drawer dengan kondisi tidak terkunci mengecil */}
        <div className="[&_aside]:flex! [&_aside]:w-full">
          <Sidebar
            activeKey={currentMenu}
            onChangeKey={handleMenuChange}
            collapsed={false}
          />
        </div>
      </Drawer>

      {/* Sisi Konten Kanan */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuToggleMobile={() => setMobileOpen(true)}
          onMenuToggleDesktop={() => setDesktopCollapsed(!desktopCollapsed)}
          desktopCollapsed={desktopCollapsed}
          theme={theme}
          changetheme={changetheme}
        />

        <main className="flex-1 overflow-y-auto px-2 sm:px-4 lg:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
