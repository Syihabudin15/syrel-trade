import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ConfigProvider, App as AntApp } from "antd";
import "antd/dist/reset.css";
import App from "./App.tsx";
import { appTheme } from "./components/themeconfig.ts";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <ConfigProvider theme={appTheme}>
        <AntApp>
          <App />
        </AntApp>
      </ConfigProvider>
    </HelmetProvider>
  </StrictMode>,
);
