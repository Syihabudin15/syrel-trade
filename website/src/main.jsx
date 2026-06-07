import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ConfigProvider, App as AntApp } from "antd";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans/700.css";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App.tsx";
import { getAppTheme } from "./components/themeconfig.ts";

function RootApp() {
  const [mode, setMode] = useState(
    localStorage.getItem("themeMode") === "dark" ||
      localStorage.getItem("themeMode") === "light"
      ? localStorage.getItem("themeMode")
      : "light",
  );

  useEffect(() => {
    localStorage.setItem("themeMode", mode);

    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [mode]);

  return (
    <StrictMode>
      <HelmetProvider>
        <ConfigProvider theme={getAppTheme(mode)}>
          <AntApp>
            <App mode={mode} setMode={setMode} />
          </AntApp>
        </ConfigProvider>
      </HelmetProvider>
    </StrictMode>
  );
}
createRoot(document.getElementById("root")).render(<RootApp />);
