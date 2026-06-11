import type { Bot } from "@prisma/client";
import { MAX_LEV, RISK_PERCENT, TIMEFRAME_HIGHER } from "../libs/config.js";
import {
  CalculateATR,
  CalculateBB,
  CalculateEMA,
  CalculateRSI,
  CalculateStockRSI,
  CalculateVWAPV2,
} from "../libs/indicators.js";
import type { IGetCandles, IPumpScanner, ITrade } from "../libs/interfaces.js";
import { GetSLTPPrice } from "./risks.js";
import {
  average,
  crossedOver,
  // FindDefaultTrend,
  getMarketStructure,
  hasBearishDivergence,
  hasBullishDivergence,
  isVolumeSpike,
  LastNumber,
  // PriceCross,
  StockHasticCross,
} from "./signal.js";

// export const FirstStrategy = async (
//   symbol: string,
//   c1: IGetCandles,
//   c2: IGetCandles,
// ): Promise<ITrade | null> => {
//   const ema20 = CalculateEMA(c1.closes, 20);
//   const ema50 = CalculateEMA(c1.closes, 50);
//   const ema200 = CalculateEMA(c1.closes, 200);
//   const rsi14 = CalculateRSI(c1.closes, 14);
//   const atr14 = CalculateATR(c1.highs, c1.lows, c1.closes, 14);
//   const stockRSI = CalculateStockRSI(c1.closes, 14, 14, 3, 3);
//   const stochRsiK = stockRSI.map((d) => d.k);
//   const stochRsiD = stockRSI.map((d) => d.d);
//   const close = LastNumber(c1.closes);
//   // const prevclose = c1.closes.at(-2) || 0;

//   const emaFast = LastNumber(ema20);
//   const emaMid = LastNumber(ema50);
//   const emaSlow = LastNumber(ema200);
//   const rsi = LastNumber(rsi14);

//   // Trend confirmation
//   const isMacroUptrend = PriceCross(close, emaSlow, "over");
//   const isMacroDowntrend = PriceCross(close, emaSlow, "under");

//   // EMA alignment for confluence
//   const emaAgmBul =
//     PriceCross(emaFast, emaMid, "over") && PriceCross(emaMid, emaSlow, "over");
//   const emaAgmBear =
//     PriceCross(emaFast, emaMid, "under") &&
//     PriceCross(emaMid, emaSlow, "under");

//   // RSI Strength
//   const rsiStrBul = PriceCross(rsi, 45, "over") && PriceCross(rsi, 70, "under");
//   const rsiStrBear =
//     PriceCross(rsi, 55, "under") && PriceCross(rsi, 30, "over");

//   // Stochastic cross
//   const stochBul = StockHasticCross(
//     { fast: stochRsiK.at(-1) || 0, slow: stochRsiK.at(-2) || 0 },
//     { fast: stochRsiD.at(-1) || 0, slow: stochRsiD.at(-2) || 0 },
//     { over: 40, under: 60 },
//     "over",
//   );
//   const stochBear = StockHasticCross(
//     { fast: stochRsiK.at(-1) || 0, slow: stochRsiK.at(-2) || 0 },
//     { fast: stochRsiD.at(-1) || 0, slow: stochRsiD.at(-2) || 0 },
//     { over: 40, under: 60 },
//     "under",
//   );

//   // Trend Market
//   const trendC1 = FindDefaultTrend(c1.opens, c1.highs, c1.lows, c1.closes);
//   const trendC2 = FindDefaultTrend(c2.opens, c2.highs, c2.lows, c2.closes);

//   // Volatility
//   const atrPercent = ((atr14.at(-1) || 0) / close) * 100;
//   const validVolatility = atrPercent >= 0.3 && atrPercent <= 1.5;

//   const pullbackLong =
//     close > emaMid && close >= emaFast * 0.995 && close <= emaFast * 1.01;
//   const pullbackShort =
//     close < emaMid && close <= emaFast * 1.005 && close >= emaFast * 0.99;

//   const validLong =
//     isMacroUptrend &&
//     emaAgmBul &&
//     rsiStrBul &&
//     stochBul &&
//     trendC1 === "LONG" &&
//     trendC2 === "LONG" &&
//     validVolatility &&
//     pullbackLong;

//   const validShort =
//     isMacroDowntrend &&
//     emaAgmBear &&
//     rsiStrBear &&
//     stochBear &&
//     trendC1 === "SHORT" &&
//     trendC2 === "SHORT" &&
//     validVolatility &&
//     pullbackShort;

//   const signal = validLong ? "LONG" : validShort ? "SHORT" : "WAIT";
//   const pricing = GetSLTPPrice(
//     close,
//     atr14.at(-1) || 0,
//     signal === "LONG" ? "buy" : "sell",
//   );

//   if (signal !== "WAIT") {
//     return {
//       id: "",
//       pairId: "",
//       Pair: {
//         name: symbol,
//         id: "",
//         status: true,
//         created_at: new Date(),
//         updated_at: new Date(),
//       },
//       side: signal === "LONG" ? "buy" : "sell",
//       open_time: new Date(),
//       open: pricing.open,
//       amount: pricing.amount,
//       sl_price: pricing.sl,
//       tp_price: pricing.tp,
//       pnl: 0,
//       reason: null,
//       lev: pricing.lev,
//       close: null,
//       close_time: null,
//       botId: null,
//     };
//   }
//   return null;
// };

// export const TwoStarategy = (
//   symbol: string,
//   c1: IGetCandles,
//   c2: IGetCandles,
// ): ITrade | null => {
//   const ema20 = CalculateEMA(c1.closes, 20);
//   const ema50 = CalculateEMA(c1.closes, 50);
//   const ema200 = CalculateEMA(c1.closes, 200);
//   const rsi14 = CalculateRSI(c1.closes, 14);
//   const atr14 = CalculateATR(c1.highs, c1.lows, c1.closes, 14);
//   const stockRSI = CalculateStockRSI(c1.closes, 14, 14, 3, 3);

//   const stochRsiK = stockRSI.map((d) => d.k);
//   const stochRsiD = stockRSI.map((d) => d.d);

//   const close = LastNumber(c1.closes);
//   const open = LastNumber(c1.opens);
//   const emaFast = LastNumber(ema20);
//   const emaMid = LastNumber(ema50);
//   const emaSlow = LastNumber(ema200);
//   const rsi = LastNumber(rsi14);
//   const atr = LastNumber(atr14);

//   const htfEma200 = CalculateEMA(c2.closes, 200);
//   const htfEma50 = CalculateEMA(c2.closes, 50);
//   const htfClose = LastNumber(c2.closes);
//   const htfFast = LastNumber(htfEma50);
//   const htfSlow = LastNumber(htfEma200);

//   const htfTrendLong = htfClose > htfSlow && htfFast > htfSlow;

//   const htfTrendShort = htfClose < htfSlow && htfFast < htfSlow;

//   const emaBullish = emaFast > emaMid && emaMid > emaSlow;
//   const emaBearish = emaFast < emaMid && emaMid < emaSlow;

//   const rsiBullish = rsi > 50 && rsi < 72;
//   const rsiBearish = rsi < 50 && rsi > 28;

//   const stochBullish = StockHasticCross(
//     { fast: stochRsiK.at(-1) || 0, slow: stochRsiK.at(-2) || 0 },
//     { fast: stochRsiD.at(-1) || 0, slow: stochRsiD.at(-2) || 0 },
//     { over: 40, under: 60 },
//     "over",
//   );

//   const stochBearish = StockHasticCross(
//     { fast: stochRsiK.at(-1) || 0, slow: stochRsiK.at(-2) || 0 },
//     { fast: stochRsiD.at(-1) || 0, slow: stochRsiD.at(-2) || 0 },
//     { over: 40, under: 60 },
//     "under",
//   );

//   const atrPercent = (atr / close) * 100;
//   const validVolatility = atrPercent >= 0.3 && atrPercent <= 1.8;

//   const volumeSpike = isVolumeSpike(c1.volumes, 20, 1.2);
//   const structure = getMarketStructure(c1.highs, c1.lows);

//   const bullishDivergence = hasBullishDivergence(c1.lows, rsi14);
//   const bearishDivergence = hasBearishDivergence(c1.highs, rsi14);

//   const bullishCandle = close > open;
//   const bearishCandle = close < open;
//   const atrDistance = Math.abs(close - emaFast);
//   const maxPullbackDistance = atr * 0.8;

//   const pullbackLong = close > emaMid && atrDistance <= maxPullbackDistance;

//   const pullbackShort = close < emaMid && atrDistance <= maxPullbackDistance;

//   let longScore = 0;
//   let shortScore = 0;

//   if (htfTrendLong) longScore += 2;
//   if (htfTrendShort) shortScore += 2;

//   if (emaBullish) longScore += 2;
//   if (emaBearish) shortScore += 2;

//   if (close > emaSlow) longScore += 1;
//   if (close < emaSlow) shortScore += 1;

//   if (rsiBullish) longScore += 1;
//   if (rsiBearish) shortScore += 1;

//   if (stochBullish) longScore += 1;
//   if (stochBearish) shortScore += 1;

//   if (validVolatility) {
//     longScore += 1;
//     shortScore += 1;
//   }

//   if (volumeSpike) {
//     longScore += 1;
//     shortScore += 1;
//   }

//   if (structure === "BULLISH") longScore += 1;
//   if (structure === "BEARISH") shortScore += 1;

//   if (pullbackLong) longScore += 1;
//   if (pullbackShort) shortScore += 1;

//   if (bullishCandle) longScore += 1;
//   if (bearishCandle) shortScore += 1;

//   if (bearishDivergence) longScore -= 2;
//   if (bullishDivergence) shortScore -= 2;
//   const validLong = longScore >= 10 && longScore > shortScore;
//   const validShort = shortScore >= 10 && shortScore > longScore;
//   const signal = validLong ? "LONG" : validShort ? "SHORT" : "WAIT";

//   if (signal === "WAIT") return null;

//   const pricing = GetSLTPPrice(close, atr, signal === "LONG" ? "buy" : "sell");

//   return {
//     id: "",
//     pairId: "",
//     Pair: {
//       name: symbol,
//       id: "",
//       status: true,
//       created_at: new Date(),
//       updated_at: new Date(),
//     },
//     side: signal === "LONG" ? "buy" : "sell",
//     open_time: new Date(),
//     open: pricing.open,
//     amount: pricing.amount,
//     sl_price: pricing.sl,
//     tp_price: pricing.tp,
//     pnl: 0,
//     reason: null,
//     lev: pricing.lev,
//     close: null,
//     close_time: null,
//     botId: null,
//   };
// };

export const ThirdStarategy = (
  symbol: string,
  c1: IGetCandles,
  c2: IGetCandles,
): ITrade | null => {
  const ema20 = CalculateEMA(c1.closes, 20);
  const ema50 = CalculateEMA(c1.closes, 50);
  const ema200 = CalculateEMA(c1.closes, 200);
  const rsi14 = CalculateRSI(c1.closes, 14);
  const atr14 = CalculateATR(c1.highs, c1.lows, c1.closes, 14);
  const stockRSI = CalculateStockRSI(c1.closes, 9, 9, 3, 3);

  const stochRsiK = stockRSI.map((d) => d.k);
  const stochRsiD = stockRSI.map((d) => d.d);

  const close = LastNumber(c1.closes);
  const open = LastNumber(c1.opens);
  const emaFast = LastNumber(ema20);
  const emaMid = LastNumber(ema50);
  const emaSlow = LastNumber(ema200);
  const rsi = LastNumber(rsi14);
  const atr = LastNumber(atr14);

  const htfEma200 = CalculateEMA(c2.closes, 200);
  const htfEma50 = CalculateEMA(c2.closes, 50);
  const htfClose = LastNumber(c2.closes);
  const htfFast = LastNumber(htfEma50);
  const htfSlow = LastNumber(htfEma200);

  const htfTrendLong = htfClose > htfSlow && htfFast > htfSlow;

  const htfTrendShort = htfClose < htfSlow && htfFast < htfSlow;

  const emaBullish = emaFast > emaMid && emaMid > emaSlow;
  const emaBearish = emaFast < emaMid && emaMid < emaSlow;

  const rsiBullish = rsi > 50 && rsi < 72;
  const rsiBearish = rsi < 50 && rsi > 28;

  const stochBullish = StockHasticCross(
    { fast: stochRsiK.at(-1) || 0, slow: stochRsiK.at(-2) || 0 },
    { fast: stochRsiD.at(-1) || 0, slow: stochRsiD.at(-2) || 0 },
    { over: 30, under: 70 },
    "over",
  );

  const stochBearish = StockHasticCross(
    { fast: stochRsiK.at(-1) || 0, slow: stochRsiK.at(-2) || 0 },
    { fast: stochRsiD.at(-1) || 0, slow: stochRsiD.at(-2) || 0 },
    { over: 30, under: 70 },
    "under",
  );

  const atrPercent = (atr / close) * 100;
  const validVolatility = atrPercent >= 0.1 && atrPercent <= 0.8;
  const volumeSpike = isVolumeSpike(c1.volumes, 20, 1.8);
  if (!validVolatility || !volumeSpike) return null;

  const structure = getMarketStructure(c1.highs, c1.lows);

  const bullishDivergence = hasBullishDivergence(c1.lows, rsi14);
  const bearishDivergence = hasBearishDivergence(c1.highs, rsi14);

  const candleBody = Math.abs(close - open);
  const candleRange = LastNumber(c1.highs) - LastNumber(c1.lows);

  const strongBullishCandle =
    close > open && candleBody >= candleRange * 0.4 && close > emaFast;

  const strongBearishCandle =
    close < open && candleBody >= candleRange * 0.4 && close < emaFast;

  const pullbackLong =
    close > emaMid &&
    close >= emaFast &&
    Math.abs(close - emaFast) <= atr * 1.2;

  const pullbackShort =
    close < emaMid &&
    close <= emaFast &&
    Math.abs(close - emaFast) <= atr * 1.2;

  let longScore = 0;
  let shortScore = 0;

  // 2. SCORING HANYA UNTUK TREN & KONFIRMASI ARAH
  if (htfTrendLong) longScore += 2;
  if (htfTrendShort) shortScore += 2;

  if (emaBullish) longScore += 2;
  if (emaBearish) shortScore += 2;

  if (close > emaSlow) longScore += 1;
  if (close < emaSlow) shortScore += 1;

  if (rsiBullish) longScore += 1;
  if (rsiBearish) shortScore += 1;

  if (structure === "BULLISH") longScore += 1;
  if (structure === "BEARISH") shortScore += 1;

  // const hasLongTrigger = stochBullish && pullbackLong && strongBullishCandle;
  // const hasShortTrigger = stochBearish && pullbackShort && strongBearishCandle;

  if (stochBullish) longScore += 1;
  if (stochBearish) shortScore += 1;

  if (pullbackLong) longScore += 1;
  if (pullbackShort) shortScore += 1;

  if (strongBullishCandle) longScore += 1;
  if (strongBearishCandle) shortScore += 1;

  if (bearishDivergence) longScore -= 2;
  if (bullishDivergence) shortScore -= 2;

  const longTriggers = [stochBullish, pullbackLong, strongBullishCandle];

  const shortTriggers = [stochBearish, pullbackShort, strongBearishCandle];

  const longTriggerCount = longTriggers.filter(Boolean).length;
  const shortTriggerCount = shortTriggers.filter(Boolean).length;

  const validLong =
    longScore >= 6 &&
    longScore > shortScore &&
    htfTrendLong &&
    emaBullish &&
    rsiBullish &&
    longTriggerCount >= 2 &&
    !bearishDivergence;

  const validShort =
    shortScore >= 6 &&
    shortScore > longScore &&
    htfTrendShort &&
    emaBearish &&
    rsiBearish &&
    shortTriggerCount >= 2 &&
    !bullishDivergence;

  const signal = validLong ? "LONG" : validShort ? "SHORT" : "WAIT";

  if (signal === "WAIT") return null;

  const pricing = GetSLTPPrice(close, atr, signal === "LONG" ? "buy" : "sell");

  return {
    id: "",
    pairId: "",
    Pair: {
      name: symbol,
      id: "",
      status: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    side: signal === "LONG" ? "buy" : "sell",
    open_time: new Date(),
    open: pricing.open,
    amount: pricing.amount,
    sl_price: pricing.sl,
    tp_price: pricing.tp,
    pnl: 0,
    reason: null,
    lev: pricing.lev,
    close: null,
    close_time: null,
    botId: null,
  };
};

export const MeanReversionStrategy = (
  symbol: string,
  c1: IGetCandles,
  c2: IGetCandles,
): ITrade | null => {
  if (
    c1.closes.length < 50 ||
    c1.highs.length < 50 ||
    c1.lows.length < 50 ||
    c1.opens.length < 50 ||
    c1.volumes.length < 50
  ) {
    return null;
  }

  const rsi14 = CalculateRSI(c1.closes, 14);
  const atr14 = CalculateATR(c1.highs, c1.lows, c1.closes, 14);
  const bb = CalculateBB(c1.closes, 20, 2);
  const vwap = CalculateVWAPV2(c1.highs, c1.lows, c1.closes, c1.volumes);

  const close = LastNumber(c1.closes);
  const open = LastNumber(c1.opens);
  const low = LastNumber(c1.lows);
  const high = LastNumber(c1.highs);

  const rsi = LastNumber(rsi14);
  const atr = LastNumber(atr14);

  const upperBand = LastNumber(bb.upper);
  const lowerBand = LastNumber(bb.lower);
  const middleBand = LastNumber(bb.middle);
  const lastVWAP = LastNumber(vwap);

  if (
    !close ||
    !open ||
    !low ||
    !high ||
    !rsi ||
    !atr ||
    !upperBand ||
    !lowerBand ||
    !middleBand ||
    !lastVWAP
  ) {
    return null;
  }

  if (atr <= 0) return null;

  // ===============================
  // 1. RSI dibuat lebih realistis
  // ===============================
  const oversoldRSI = rsi <= 35;
  const overboughtRSI = rsi >= 65;

  // ===============================
  // 2. Bollinger Band dengan toleransi
  // ===============================
  const bandTolerance = atr * 0.2;

  const touchLowerBand = low <= lowerBand + bandTolerance;
  const touchUpperBand = high >= upperBand - bandTolerance;

  // ===============================
  // 3. Candle rejection lebih longgar
  // ===============================
  const totalRange = high - low;
  if (totalRange <= 0) return null;

  const body = Math.abs(close - open);
  const lowerWick = Math.min(open, close) - low;
  const upperWick = high - Math.max(open, close);

  const lowerWickRatio = lowerWick / totalRange;
  const upperWickRatio = upperWick / totalRange;
  const bodyRatio = body / totalRange;

  // const bullishReject =
  //   lowerWickRatio >= 0.25 &&
  //   bodyRatio <= 0.75 &&
  //   close > low + totalRange * 0.35;

  // const bearishReject =
  //   upperWickRatio >= 0.25 &&
  //   bodyRatio <= 0.75 &&
  //   close < high - totalRange * 0.35;
  const bullishReject =
    lowerWickRatio >= 0.35 &&
    bodyRatio <= 0.55 &&
    close > open &&
    close > lowerBand;

  const bearishReject =
    upperWickRatio >= 0.35 &&
    bodyRatio <= 0.55 &&
    close < open &&
    close < upperBand;

  const reclaimLowerBand = touchLowerBand && close > lowerBand && close > open;

  // ===============================
  // 4. HTF filter dibuat tidak terlalu membunuh sinyal
  // ===============================
  const rejectUpperBand = touchUpperBand && close < upperBand && close < open;

  // ===============================
  // 4. HTF filter dibuat tidak terlalu membunuh sinyal
  // ===============================
  let htfBullish = true;
  let htfBearish = true;

  if (c2.closes.length >= 200) {
    const htfEma200 = CalculateEMA(c2.closes, 200);
    const htfClose = LastNumber(c2.closes);
    const ema200 = LastNumber(htfEma200);

    if (htfClose && ema200) {
      htfBullish = htfClose >= ema200 * 0.995;
      htfBearish = htfClose <= ema200 * 1.005;
    }
  }

  // Untuk mean reversion, jangan terlalu strict dengan HTF.
  // Long tetap boleh selama RSI oversold + sentuh lower BB.
  // Tapi kalau HTF bearish, candle rejection wajib ada.
  // const validLong =
  //   touchLowerBand && oversoldRSI && (bullishReject || htfBullish);

  // const validShort =
  //   touchUpperBand && overboughtRSI && (bearishReject || htfBearish);
  const validLong =
    oversoldRSI &&
    touchLowerBand &&
    reclaimLowerBand &&
    bullishReject &&
    htfBullish;

  const validShort =
    overboughtRSI &&
    touchUpperBand &&
    rejectUpperBand &&
    bearishReject &&
    htfBearish;

  const signal = validLong ? "LONG" : validShort ? "SHORT" : "WAIT";
  if (signal === "WAIT") return null;

  const entryPrice = close;

  let stopLossPrice = 0;
  let takeProfitPrice = 0;

  if (signal === "LONG") {
    stopLossPrice = Math.min(low, lowerBand) - atr * 1.5;

    // Ambil target yang berada di atas entry
    const targets = [middleBand, lastVWAP].filter((tp) => tp > entryPrice);

    if (targets.length === 0) return null;

    // Pilih target terdekat agar win rate lebih tinggi
    takeProfitPrice = Math.min(...targets);
  }

  if (signal === "SHORT") {
    stopLossPrice = Math.max(high, upperBand) + atr * 1.5;

    // Ambil target yang berada di bawah entry
    const targets = [middleBand, lastVWAP].filter((tp) => tp < entryPrice);

    if (targets.length === 0) return null;

    // Pilih target terdekat agar win rate lebih tinggi
    takeProfitPrice = Math.max(...targets);
  }

  const risk = Math.abs(entryPrice - stopLossPrice);
  const reward = Math.abs(takeProfitPrice - entryPrice);

  if (risk <= 0 || reward <= 0) return null;

  // Jangan terlalu ketat, tapi tetap hindari setup yang sangat buruk
  const rr = reward / risk;
  if (rr < 0.5) return null;

  const riskUSDT = 10 * (RISK_PERCENT / 100);
  const amount = riskUSDT / risk;

  if (!isFinite(amount) || amount <= 0) return null;

  return {
    id: "",
    pairId: "",
    Pair: {
      name: symbol,
      id: "",
      status: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    side: signal === "LONG" ? "buy" : "sell",
    open_time: new Date(),
    open: Number(entryPrice.toFixed(4)),
    amount: Number(amount.toFixed(6)),
    sl_price: Number(stopLossPrice.toFixed(4)),
    tp_price: Number(takeProfitPrice.toFixed(4)),
    pnl: 0,
    reason: `Mean Reversion ${signal} | RSI=${rsi.toFixed(2)} | RR=${rr.toFixed(2)}`,
    lev: MAX_LEV,
    close: null,
    close_time: null,
    botId: null,
  };
};

export const RangeBreakoutCompressionStrategy = (
  symbol: string,
  c1: IGetCandles, // TF utama, contoh 5m
  c2: IGetCandles, // HTF, contoh 15m atau 1h
): ITrade | null => {
  if (
    c1.closes.length < 120 ||
    c1.highs.length < 120 ||
    c1.lows.length < 120 ||
    c1.opens.length < 120 ||
    c1.volumes.length < 120
  ) {
    return null;
  }

  if (
    c2.closes.length < 60 ||
    c2.highs.length < 60 ||
    c2.lows.length < 60 ||
    c2.opens.length < 60
  ) {
    return null;
  }

  // ===============================
  // Indicator utama TF entry
  // ===============================
  const atr14 = CalculateATR(c1.highs, c1.lows, c1.closes, 14);
  const bb = CalculateBB(c1.closes, 20, 2);
  const ema20 = CalculateEMA(c1.closes, 20);
  const ema50 = CalculateEMA(c1.closes, 50);

  const close = LastNumber(c1.closes);
  const open = LastNumber(c1.opens);
  const high = LastNumber(c1.highs);
  const low = LastNumber(c1.lows);
  const volume = LastNumber(c1.volumes);

  const lastEma20 = LastNumber(ema20);
  const lastEma50 = LastNumber(ema50);

  if (!close || !open || !high || !low || !volume || !lastEma20 || !lastEma50) {
    return null;
  }

  // ===============================
  // Gunakan indicator candle sebelumnya
  // supaya candle breakout tidak ikut mengubah BB/ATR
  // ===============================
  const prevUpperBand = bb.upper[bb.upper.length - 2];
  const prevLowerBand = bb.lower[bb.lower.length - 2];
  const prevMiddleBand = bb.middle[bb.middle.length - 2];
  const prevAtr = atr14[atr14.length - 2];

  if (
    !prevUpperBand ||
    !prevLowerBand ||
    !prevMiddleBand ||
    !prevAtr ||
    prevMiddleBand <= 0 ||
    prevAtr <= 0
  ) {
    return null;
  }

  // ===============================
  // Bollinger Band Compression
  // ===============================
  const bbWidth = prevUpperBand - prevLowerBand;
  const bbWidthRatio = bbWidth / prevMiddleBand;

  // Untuk 5m crypto:
  // <= 0.025 sangat ketat
  // <= 0.035 normal compression
  // <= 0.050 longgar
  const isCompression = bbWidthRatio <= 0.035;

  if (!isCompression) return null;

  // ===============================
  // Compression harus terjadi beberapa candle sebelumnya
  // Exclude candle breakout terakhir
  // ===============================
  const lookbackCompression = 5;

  const upperSlice = bb.upper.slice(-lookbackCompression - 1, -1);
  const lowerSlice = bb.lower.slice(-lookbackCompression - 1, -1);
  const middleSlice = bb.middle.slice(-lookbackCompression - 1, -1);

  if (
    upperSlice.length < lookbackCompression ||
    lowerSlice.length < lookbackCompression ||
    middleSlice.length < lookbackCompression
  ) {
    return null;
  }

  const compressionCount = upperSlice.filter((upper, index) => {
    const lower = lowerSlice[index];
    const middle = middleSlice[index];

    if (!upper || !lower || !middle || middle <= 0) return false;

    const widthRatio = (upper - lower) / middle;

    return widthRatio <= 0.04;
  }).length;

  // Minimal 4 dari 5 candle sebelumnya dalam kondisi compression
  if (compressionCount < 4) return null;

  // ===============================
  // Volume average
  // Exclude candle terakhir agar candle breakout tidak masuk rata-rata
  // ===============================
  const volumePeriod = 20;
  const recentVolumes = c1.volumes.slice(-volumePeriod - 1, -1);

  if (recentVolumes.length < volumePeriod) return null;

  const avgVolume =
    recentVolumes.reduce((sum, v) => sum + v, 0) / recentVolumes.length;

  if (!avgVolume || avgVolume <= 0) return null;

  // Naikkan dari 1.4 ke 1.6 agar lebih selective
  const volumeRatio = volume / avgVolume;
  const volumeSpike = volumeRatio >= 1.5;

  if (!volumeSpike) return null;

  // ===============================
  // Range breakout confirmation
  // Harga harus break range, bukan hanya keluar BB
  // ===============================
  const rangeLookback = 20;

  const prevHighRange = Math.max(...c1.highs.slice(-rangeLookback - 1, -1));
  const prevLowRange = Math.min(...c1.lows.slice(-rangeLookback - 1, -1));

  if (
    !isFinite(prevHighRange) ||
    !isFinite(prevLowRange) ||
    prevHighRange <= 0 ||
    prevLowRange <= 0 ||
    prevHighRange <= prevLowRange
  ) {
    return null;
  }

  // ===============================
  // Candle strength
  // ===============================
  const totalRange = high - low;
  if (totalRange <= 0) return null;

  const body = Math.abs(close - open);
  const bodyRatio = body / totalRange;

  const bullishCandle = close > open;
  const bearishCandle = close < open;

  // Close location:
  // LONG bagus kalau close dekat high
  // SHORT bagus kalau close dekat low
  const closeLocation = (close - low) / totalRange;

  const strongBody = bodyRatio >= 0.55;
  const strongBullClose = closeLocation >= 0.75;
  const strongBearClose = closeLocation <= 0.25;

  if (!strongBody) return null;

  // ===============================
  // Hindari candle breakout terlalu besar
  // Kalau candle terlalu besar, entry di close biasanya telat
  // ===============================
  const candleTooLarge = totalRange > prevAtr * 2.2;

  if (candleTooLarge) return null;

  // ===============================
  // Hindari harga terlalu jauh dari EMA20
  // Supaya tidak entry setelah move terlalu jauh
  // ===============================
  const distanceFromEma20 = Math.abs(close - lastEma20) / close;

  // Untuk 5m crypto, 0.8% - 1.5% bisa diuji
  if (distanceFromEma20 > 0.012) return null;

  // ===============================
  // Breakout condition
  // ===============================
  const breakoutBuffer = prevAtr * 0.15;

  const breakoutLong =
    close > prevUpperBand + breakoutBuffer &&
    close > prevHighRange + breakoutBuffer &&
    bullishCandle &&
    strongBody &&
    strongBullClose;

  const breakoutShort =
    close < prevLowerBand - breakoutBuffer &&
    close < prevLowRange - breakoutBuffer &&
    bearishCandle &&
    strongBody &&
    strongBearClose;

  if (!breakoutLong && !breakoutShort) return null;

  // ===============================
  // Trend filter TF utama
  // Jangan long kalau EMA20 masih di bawah EMA50
  // Jangan short kalau EMA20 masih di atas EMA50
  // ===============================
  const entryTfBullish = close > lastEma20 && lastEma20 > lastEma50;
  const entryTfBearish = close < lastEma20 && lastEma20 < lastEma50;

  if (breakoutLong && !entryTfBullish) return null;
  if (breakoutShort && !entryTfBearish) return null;

  // ===============================
  // HTF filter
  // c2 disarankan 15m untuk entry 5m
  // ===============================
  const htfEma20 = CalculateEMA(c2.closes, 20);
  const htfEma50 = CalculateEMA(c2.closes, 50);

  const htfClose = LastNumber(c2.closes);
  const lastHtfEma20 = LastNumber(htfEma20);
  const lastHtfEma50 = LastNumber(htfEma50);

  if (!htfClose || !lastHtfEma20 || !lastHtfEma50) return null;

  const htfBullish = htfClose > lastHtfEma20 && lastHtfEma20 > lastHtfEma50;
  const htfBearish = htfClose < lastHtfEma20 && lastHtfEma20 < lastHtfEma50;

  const validLong = breakoutLong && htfBullish;
  const validShort = breakoutShort && htfBearish;

  const signal = validLong ? "LONG" : validShort ? "SHORT" : "WAIT";

  if (signal === "WAIT") return null;

  // ===============================
  // Entry
  // ===============================
  const entryPrice = close;

  let stopLossPrice = 0;
  let takeProfitPrice = 0;

  // ===============================
  // SL & TP
  // SL berbasis area breakout/range
  // ===============================
  if (signal === "LONG") {
    // SL di bawah area breakout atau low candle breakout
    stopLossPrice = Math.min(prevHighRange, low) - prevAtr * 0.3;

    const risk = entryPrice - stopLossPrice;
    if (risk <= 0) return null;

    takeProfitPrice = entryPrice + risk * 1.5;
  }

  if (signal === "SHORT") {
    // SL di atas area breakdown atau high candle breakout
    stopLossPrice = Math.max(prevLowRange, high) + prevAtr * 0.3;

    const risk = stopLossPrice - entryPrice;
    if (risk <= 0) return null;

    takeProfitPrice = entryPrice - risk * 1.5;
  }

  const risk = Math.abs(entryPrice - stopLossPrice);
  const reward = Math.abs(takeProfitPrice - entryPrice);

  if (risk <= 0 || reward <= 0) return null;

  const rr = reward / risk;

  // Minimal RR
  if (rr < 1.2) return null;

  // ===============================
  // Hindari SL terlalu jauh
  // ===============================
  const riskPercentFromEntry = risk / entryPrice;

  // Dari 2.5% diturunkan ke 2.0% agar lebih aman
  if (riskPercentFromEntry > 0.02) return null;

  // Hindari SL terlalu dekat juga
  // Kalau terlalu dekat, spread/noise mudah kena
  if (riskPercentFromEntry < 0.0025) return null;

  // ===============================
  // Position sizing
  // ===============================
  const riskUSDT = 10 * (RISK_PERCENT / 100);
  const amount = riskUSDT / risk;

  if (!isFinite(amount) || amount <= 0) return null;

  return {
    id: "",
    pairId: "",
    Pair: {
      name: symbol,
      id: "",
      status: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    side: signal === "LONG" ? "buy" : "sell",
    open_time: new Date(),
    open: Number(entryPrice.toFixed(4)),
    amount: Number(amount.toFixed(6)),
    sl_price: Number(stopLossPrice.toFixed(4)),
    tp_price: Number(takeProfitPrice.toFixed(4)),
    pnl: 0,
    reason: `Range Breakout Compression ${signal} | BBWidth=${bbWidthRatio.toFixed(
      4,
    )} | Volume=${volumeRatio.toFixed(2)}x | Body=${bodyRatio.toFixed(
      2,
    )} | CloseLoc=${closeLocation.toFixed(2)} | Risk=${(
      riskPercentFromEntry * 100
    ).toFixed(2)}% | RR=${rr.toFixed(2)}`,
    lev: MAX_LEV,
    close: null,
    close_time: null,
    botId: null,
  };
};

// const LIMIT = 150;

const MIN_VOLUME_SPIKE = 2.5;
const MIN_SCORE_ALERT = 10;

const ATR_SL_MULTIPLIER = 1.5;
const ATR_TP_MULTIPLIER = 3;

const RECENT_HIGH_PERIOD = 20;
const AVG_VOLUME_PERIOD = 20;

const MAX_RSI = 72;
const MIN_RSI = 50;

const MAX_DISTANCE_FROM_EMA20_ATR = 1.5;
const MAX_RISK_PERCENT = 3.5;

export const MarketScanner = (
  symbol: string,
  c1: IGetCandles, // TF utama, contoh 5m
  c2: IGetCandles, // HTF, contoh 15m / 1h
): IPumpScanner | null => {
  // ===============================
  // Validasi data
  // ===============================
  if (
    !c1 ||
    !c2 ||
    !c1.candles ||
    !c1.closes ||
    !c1.highs ||
    !c1.lows ||
    !c1.volumes ||
    !c2.closes ||
    c1.candles.length < 100 ||
    c1.closes.length < 100 ||
    c1.highs.length < 100 ||
    c1.lows.length < 100 ||
    c1.volumes.length < 100 ||
    c2.closes.length < 60
  ) {
    return null;
  }

  const closes = c1.closes;
  const highs = c1.highs;
  const lows = c1.lows;
  const volumes = c1.volumes;
  const htfCloses = c2.closes;

  // ===============================
  // Indicator TF utama
  // ===============================
  const ema20 = CalculateEMA(closes, 20);
  const ema50 = CalculateEMA(closes, 50);
  const rsi = CalculateRSI(closes, 14);
  const atr = CalculateATR(highs, lows, closes, 14);
  const stochRsi = CalculateStockRSI(closes, 14, 14, 3, 3);

  // ===============================
  // Indicator HTF
  // ===============================
  const htfEma20 = CalculateEMA(htfCloses, 20);
  const htfEma50 = CalculateEMA(htfCloses, 50);

  if (
    ema20.length < 3 ||
    ema50.length < 3 ||
    rsi.length < 3 ||
    atr.length < 3 ||
    stochRsi.length < 3 ||
    htfEma20.length < 3 ||
    htfEma50.length < 3
  ) {
    return null;
  }

  // ===============================
  // Candle terakhir
  // ===============================
  const last = c1.candles[c1.candles.length - 1];
  const prev = c1.candles[c1.candles.length - 2];

  if (!last || !prev) return null;

  const price = last.close;

  // ===============================
  // Nilai indicator sekarang
  // ===============================
  const nowEma20 = ema20[ema20.length - 1];
  const prevEma20 = ema20[ema20.length - 2];

  const nowEma50 = ema50[ema50.length - 1];
  const prevEma50 = ema50[ema50.length - 2];

  const nowRsi = rsi[rsi.length - 1];
  const prevRsi = rsi[rsi.length - 2];

  const nowAtr = atr[atr.length - 1];

  const nowStoch = stochRsi[stochRsi.length - 1];
  const prevStoch = stochRsi[stochRsi.length - 2];

  const nowHtfEma20 = htfEma20[htfEma20.length - 1];
  const prevHtfEma20 = htfEma20[htfEma20.length - 2];

  const nowHtfEma50 = htfEma50[htfEma50.length - 1];
  const prevHtfEma50 = htfEma50[htfEma50.length - 2];

  if (
    !Number.isFinite(price) ||
    !Number.isFinite(nowEma20) ||
    !Number.isFinite(nowEma50) ||
    !Number.isFinite(nowRsi) ||
    !Number.isFinite(nowAtr) ||
    nowAtr <= 0
  ) {
    return null;
  }

  // ===============================
  // Volume spike
  // ===============================
  const avgVolume20 = average(volumes.slice(-(AVG_VOLUME_PERIOD + 1), -1));
  const volumeSpike = avgVolume20 > 0 ? last.volume / avgVolume20 : 0;

  // ===============================
  // Struktur candle
  // ===============================
  const candleRange = last.high - last.low;
  const candleBody = Math.abs(last.close - last.open);

  const bodyRatio = candleRange > 0 ? candleBody / candleRange : 0;
  const closePosition =
    candleRange > 0 ? (last.close - last.low) / candleRange : 0;

  const isBullishCandle = last.close > last.open;
  const isStrongBullishCandle =
    isBullishCandle && bodyRatio >= 0.35 && closePosition >= 0.6;

  // ===============================
  // Breakout recent high
  // ===============================
  const recentHigh = Math.max(...highs.slice(-(RECENT_HIGH_PERIOD + 1), -1));
  const isBreakRecentHigh = price > recentHigh;

  // ===============================
  // Anti entry telat
  // ===============================
  const distanceFromEma20Atr = (price - nowEma20) / nowAtr;
  const isTooFarFromEma20 = distanceFromEma20Atr > MAX_DISTANCE_FROM_EMA20_ATR;

  // ===============================
  // Trend HTF
  // ===============================
  const isHtfBullish =
    nowHtfEma20 > nowHtfEma50 &&
    nowHtfEma20 > prevHtfEma20 &&
    nowHtfEma50 >= prevHtfEma50;

  // ===============================
  // Rejection filter
  // ===============================

  // Hindari candle merah / volume dump
  if (!isStrongBullishCandle) return null;

  // Hindari entry saat harga sudah terlalu jauh dari EMA20
  if (isTooFarFromEma20) return null;

  // Hindari RSI terlalu panas
  if (nowRsi > MAX_RSI) return null;

  // RSI wajib sudah bullish
  if (nowRsi < MIN_RSI) return null;

  // HTF wajib mendukung
  if (!isHtfBullish) return null;

  // Breakout wajib valid
  if (!isBreakRecentHigh) return null;

  // Volume wajib spike
  if (volumeSpike < MIN_VOLUME_SPIKE) return null;

  // ===============================
  // Scoring
  // ===============================
  let score = 0;
  const reasons: string[] = [];

  if (volumeSpike >= MIN_VOLUME_SPIKE) {
    score += 3;
    reasons.push(`Volume spike ${volumeSpike.toFixed(2)}x`);
  }

  if (isBreakRecentHigh) {
    score += 3;
    reasons.push(`Break recent high ${RECENT_HIGH_PERIOD} candle`);
  }

  if (crossedOver(prev.close, price, prevEma50, nowEma50)) {
    score += 2;
    reasons.push("Break EMA50");
  }

  if (price > nowEma20 && price > nowEma50) {
    score += 2;
    reasons.push("Harga di atas EMA20 & EMA50");
  }

  if (nowEma20 > nowEma50 && prevEma20 <= prevEma50) {
    score += 3;
    reasons.push("EMA20 golden cross EMA50");
  } else if (nowEma20 > nowEma50) {
    score += 1;
    reasons.push("EMA20 sudah di atas EMA50");
  }

  if (prevRsi < 45 && nowRsi > 50) {
    score += 2;
    reasons.push("RSI break ke atas 50");
  } else if (nowRsi >= 50 && nowRsi <= 65) {
    score += 2;
    reasons.push("RSI bullish sehat");
  } else if (nowRsi > 65 && nowRsi <= MAX_RSI) {
    score += 1;
    reasons.push("RSI bullish tapi mulai tinggi");
  }

  if (
    prevStoch.k <= prevStoch.d &&
    nowStoch.k > nowStoch.d &&
    nowStoch.k < 80
  ) {
    score += 2;
    reasons.push("Stoch RSI golden cross");
  }

  if (isHtfBullish) {
    score += 2;
    reasons.push(`HTF ${TIMEFRAME_HIGHER} bullish dan EMA naik`);
  }

  if (isStrongBullishCandle) {
    score += 2;
    reasons.push("Candle bullish kuat");
  }

  if (score < MIN_SCORE_ALERT) return null;

  // ===============================
  // SL / TP
  // ===============================
  const structureLow = Math.min(...lows.slice(-6, -1));

  const atrSl = price - nowAtr * ATR_SL_MULTIPLIER;

  // Pakai SL yang lebih aman antara ATR SL dan swing low kecil
  const sl = Math.min(atrSl, structureLow);

  const risk = price - sl;
  if (risk <= 0) return null;

  const riskPercent = (risk / price) * 100;

  // Hindari sinyal dengan SL terlalu jauh
  if (riskPercent > MAX_RISK_PERCENT) return null;

  const tp = price + nowAtr * ATR_TP_MULTIPLIER;

  return {
    id: "",
    reason: null,
    open: price,
    sl,
    tp,
    summary: JSON.stringify({
      score,
      reasons,
      metrics: {
        price,
        volumeSpike: Number(volumeSpike.toFixed(2)),
        rsi: Number(nowRsi.toFixed(2)),
        atr: Number(nowAtr.toFixed(8)),
        distanceFromEma20Atr: Number(distanceFromEma20Atr.toFixed(2)),
        riskPercent: Number(riskPercent.toFixed(2)),
        recentHigh,
        ema20: nowEma20,
        ema50: nowEma50,
        htfEma20: nowHtfEma20,
        htfEma50: nowHtfEma50,
      },
    }),
    active: true,

    status: true,
    created_at: new Date(),
    updated_at: new Date(),
    Pair: {
      id: "",
      name: symbol,
      status: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    pairId: "",
    botId: "",
    Bot: {} as Bot,
  };
};
