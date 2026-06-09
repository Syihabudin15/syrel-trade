import { TIMEFRAME, TIMEFRAME_HIGHER, TOP_N } from "../libs/config.js";
import { GetCandles, GetTopFutureVolume } from "../libs/exchange.js";
import type { ITrade } from "../libs/interfaces.js";
import {
  GetAllActiveTrades,
  GetHourslyReport,
  ValidateActiveTrades,
  ValidateBeforeTrade,
} from "../services/order.js";
import { MeanReversionStrategy } from "../services/strategy.js";
import { ClosePositions, OpenOrders } from "../services/trades.js";

const id = process.argv[2]! as string;

const Main = async () => {
  const tradedata: ITrade[] = [];
  const topVolumeData = await GetTopFutureVolume(TOP_N);
  const actives = await GetAllActiveTrades();
  const closetrades: { order: ITrade[]; price: number }[] = [];

  for (const symbol of topVolumeData) {
    try {
      const c1 = await GetCandles(symbol.symbol, TIMEFRAME, 200);
      const c2 = await GetCandles(symbol.symbol, TIMEFRAME_HIGHER, 200);
      if (c1.candles.length < 200) continue;

      const signal = MeanReversionStrategy(symbol.symbol, c1, c2);
      if (!signal) continue;

      const longs = actives.filter(
        (a) => a.Pair.name === symbol.symbol && a.side === "buy",
      );
      const shorts = actives.filter(
        (a) => a.Pair.name === symbol.symbol && a.side === "sell",
      );
      if (signal.side === "buy" && shorts.length !== 0) {
        closetrades.push({ order: shorts, price: signal.open });
      } else if (signal.side === "sell" && longs.length !== 0) {
        closetrades.push({ order: longs, price: signal.open });
      }

      const validates = await ValidateBeforeTrade(symbol.symbol);
      if (validates.length !== 0) continue;

      if (
        (signal.side === "buy" && longs.length !== 0) ||
        (signal.side === "sell" && shorts.length !== 0)
      )
        continue;
      tradedata.push({ ...signal, botId: id });
    } catch (err) {
      console.log(err);
      continue;
    }
  }
  if (tradedata.length !== 0) {
    await OpenOrders(tradedata.slice(0, 3));
  }
  if (closetrades.length !== 0)
    await Promise.all(closetrades.map((c) => ClosePositions(c.order, c.price)));
};

(async () => {
  await Main();
  await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 5));
  setInterval(
    async () => {
      await Main();
    },
    1000 * 60 * 5,
  );
})();
