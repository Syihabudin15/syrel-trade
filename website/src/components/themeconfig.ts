// components/themeconfig.ts
import { theme, type ThemeConfig } from "antd";

export const getAppTheme = (mode: "light" | "dark"): ThemeConfig => ({
  algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,

  token: {
    fontFamily: `"JetBrains Mono", monospace, "Cambria", "Times New Roman", serif`,
    colorPrimary: "#1677ff",
    borderRadius: 10,

    colorBgLayout: mode === "dark" ? "#020617" : "#f4f7fb",
    colorBgContainer: mode === "dark" ? "#0f172a" : "#ffffff",
    colorText: mode === "dark" ? "#e5e7eb" : "#1f2937",
  },

  components: {
    Button: {
      borderRadius: 999,
      controlHeight: 42,
      fontWeight: 700,
    },
    Input: {
      borderRadius: 14,
      controlHeight: 44,
    },
    Card: {
      borderRadiusLG: 28,
    },
  },
});
