import { BrowserRouter, Route, Routes } from "react-router-dom";
import ILayout from "./components/layouts/ILayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import BotPage from "./pages/BotPage";
import TradePage from "./pages/TradePage";
import BotDetailPage from "./pages/BotDetailPage";

type AppProps = {
  mode: "light" | "dark";
  setMode: React.Dispatch<React.SetStateAction<"light" | "dark">>;
};
export default function App({ mode, setMode }: AppProps) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={<ILayout theme={mode} changetheme={setMode} />}
        >
          <Route index element={<DashboardPage />} />
          <Route path="/bot" element={<BotPage />} />
          <Route path="/bot/detail/:id" element={<BotDetailPage />} />
          <Route path="/trade" element={<TradePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
