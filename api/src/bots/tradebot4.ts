import { TOP_N } from "../libs/config.js";
import { GetCandles, GetTopFutureVolume } from "../libs/exchange.js";
import type { IPumpScanner } from "../libs/interfaces.js";
import { CreatePumpScanner } from "../services/scanner.js";
import { MarketScanner } from "../services/strategy.js";

const id = process.argv[2]! as string;

const Main = async () => {
  const tradedata: IPumpScanner[] = [];
  const topVolumeData = await GetTopFutureVolume(TOP_N);

  for (const symbol of topVolumeData) {
    try {
      const c1 = await GetCandles(symbol.symbol, "15m", 200);
      const c2 = await GetCandles(symbol.symbol, "1h", 200);
      if (c1.candles.length < 200) continue;

      const signal = MarketScanner(symbol.symbol, c1, c2);
      if (!signal) continue;

      tradedata.push({ ...signal, botId: id });
    } catch (err) {
      console.log(err);
      continue;
    }
  }
  if (tradedata.length !== 0) {
    await CreatePumpScanner(tradedata);
  }
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
