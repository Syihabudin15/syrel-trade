import type { ThemeConfig } from "antd";

export const appTheme: ThemeConfig = {
  token: {
    fontFamily: `"Cambria", "Times New Roman", serif`,
    colorPrimary: "#1677ff",
    borderRadius: 14,
    colorBgLayout: "#f4f7fb",
    colorBgContainer: "#ffffff",
    colorText: "#1f2937",
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
};
