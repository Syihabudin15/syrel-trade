// import moment from "moment";
// import { TIMEFRAME, TIMEFRAME_HIGHER, TOP_N } from "./libs/config.js";
// import { GetCandles, GetTopFutureVolume } from "./libs/exchange.js";
// import type { ITrade } from "./libs/interfaces.js";
// import { SendTelegramMessage } from "./libs/messages.js";
// import {
//   GetAllActiveTrades,
//   GetHourslyReport,
//   ValidateActiveTrades,
// } from "./services/order.js";
// import { TwoStarategy } from "./services/strategy.js";
// import { ClosePositions, OpenOrders } from "./services/trades.js";

// const MainTrade = async () => {
//   const tradedata: ITrade[] = [];
//   const topVolumeData = await GetTopFutureVolume(TOP_N);
//   const actives = await GetAllActiveTrades();
//   const closetrades: { order: ITrade[]; price: number }[] = [];

//   for (const symbol of topVolumeData) {
//     try {
//       const c1 = await GetCandles(symbol.symbol, TIMEFRAME, 200);
//       const c2 = await GetCandles(symbol.symbol, TIMEFRAME_HIGHER, 200);
//       if (c1.candles.length < 200 || c2.candles.length < 200) continue;

//       // const signal = await FirstStrategy(symbol.symbol, c1, c2);
//       const signal = TwoStarategy(symbol.symbol, c1, c2);
//       if (!signal) continue;

//       const longs = actives.filter(
//         (a) => a.Pair.name === symbol.symbol && a.side === "buy",
//       );
//       const shorts = actives.filter(
//         (a) => a.Pair.name === symbol.symbol && a.side === "sell",
//       );
//       if (signal.side === "buy" && shorts.length !== 0) {
//         closetrades.push({ order: shorts, price: signal.open });
//       } else if (signal.side === "sell" && longs.length !== 0) {
//         closetrades.push({ order: longs, price: signal.open });
//       }
//       const find = actives.find((a) =>
//         moment(a.close_time).isAfter(moment().subtract(4, "hour")),
//       );
//       if (find) continue;

//       if (
//         (signal.side === "buy" && longs.length !== 0) ||
//         (signal.side === "sell" && shorts.length !== 0)
//       )
//         continue;
//       tradedata.push(signal);
//     } catch (err) {
//       console.log(err);
//       continue;
//     }
//   }
//   if (tradedata.length !== 0) {
//     await OpenOrders(tradedata);
//     await SendTelegramMessage(`
// <b>🚀 Order Dibuat</b>
// Jumlah Order: <b>${tradedata.length}</b>
// <b>${tradedata.map((t) => `${t.side} - ${t.Pair.name}: ${t.open}`).join("\n")}</b>
//       `);
//   }
//   if (closetrades.length !== 0) {
//     const closeds = await Promise.all(
//       closetrades.map((c) => ClosePositions(c.order, c.price)),
//     );
//     await SendTelegramMessage(`
// <b>❌ Order Closed</b>
// Pair:  <b>${closetrades
//       .flatMap((c) => c.order)
//       .map((t) => t.Pair.name)
//       .join("\n")}</b>
// Total PnL: <b>${closeds
//       .flatMap((c) => c.flatMap((f) => f.pnl))
//       .reduce((acc, curr) => acc + curr, 0)
//       .toFixed(4)}</b>
//       `);
//   }
// };

// (async () => {
//   console.log("Automatic Trade is starting with FirstStrategy Function");
//   await MainTrade();
//   await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 5));
//   setInterval(
//     async () => {
//       await MainTrade();
//     },
//     1000 * 60 * 5,
//   );
// })();

// (async () => {
//   await ValidateActiveTrades();
//   await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 3));
//   setInterval(
//     async () => {
//       await ValidateActiveTrades();
//     },
//     1000 * 60 * 3,
//   );
// })();

// (async () => {
//   setInterval(
//     async () => {
//       await GetHourslyReport();
//     },
//     1000 * 60 * 60 * 1,
//   );
// })();
