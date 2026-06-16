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

export const ThirdStarategy = (
  symbol: string,
  c1: IGetCandles,
  c2: IGetCandles,
): ITrade | null => {
  if (
    c1.closes.length < 200 ||
    c1.highs.length < 200 ||
    c1.lows.length < 200 ||
    c1.opens.length < 200 ||
    c1.volumes.length < 200 ||
    c2.closes.length < 200 ||
    c2.highs.length < 200
  ) {
    return null;
  }

  // 2. Kalkulasi Indikator TF Utama
  const ema20 = CalculateEMA(c1.closes, 20);
  const ema50 = CalculateEMA(c1.closes, 50);
  const ema200 = CalculateEMA(c1.closes, 200);
  const rsi14 = CalculateRSI(c1.closes, 14);
  const atr14 = CalculateATR(c1.highs, c1.lows, c1.closes, 14);
  const stockRSI = CalculateStockRSI(c1.closes, 9, 9, 3, 3);

  // 3. Ambil Data Candle yang SUDAH CLOSE (Index length - 2) untuk Menghindari Ghost Signals
  const idx = c1.closes.length - 2;
  const close = c1.closes[idx];
  const open = c1.opens[idx];
  const high = c1.highs[idx];
  const low = c1.lows[idx];

  const emaFast = ema20[idx];
  const emaMid = ema50[idx];
  const emaSlow = ema200[idx];
  const rsi = rsi14[idx];
  const atr = atr14[idx];

  if (
    !close ||
    !open ||
    !high ||
    !low ||
    !emaFast ||
    !emaMid ||
    !emaSlow ||
    !rsi ||
    !atr ||
    atr <= 0
  ) {
    return null;
  }

  // 4. Kalkulasi Indikator HTF (Mencegah Lookahead Bias / Repainting)
  const htfEma200 = CalculateEMA(c2.closes, 200);
  const htfEma50 = CalculateEMA(c2.closes, 50);

  const htfIdx = c2.closes.length - 2; // Candle HTF yang sudah fix close
  const htfClose = c2.closes[htfIdx];
  const htfFast = htfEma50[htfIdx];
  const htfSlow = htfEma200[htfIdx];

  if (!htfClose || !htfFast || !htfSlow) return null;

  // 5. Kondisi Filter Utama (Arah Tren Besar)
  const htfTrendLong = htfClose > htfSlow && htfFast >= htfSlow * 0.995;
  const htfTrendShort = htfClose < htfSlow && htfFast <= htfSlow * 1.005;

  const emaBullish = emaFast > emaMid && emaMid > emaSlow;
  const emaBearish = emaFast < emaMid && emaMid < emaSlow;

  const rsiBullish = rsi > 50 && rsi < 72;
  const rsiBearish = rsi < 50 && rsi > 28;

  // 6. Stochastic RSI Cross Over/Under pada Candle Terkonfirmasi
  const stochRsiK = stockRSI.map((d) => d.k);
  const stochRsiD = stockRSI.map((d) => d.d);

  const stochBullish = StockHasticCross(
    { fast: stochRsiK[idx], slow: stochRsiK[idx - 1] },
    { fast: stochRsiD[idx], slow: stochRsiD[idx - 1] },
    { over: 30, under: 70 },
    "over",
  );

  const stochBearish = StockHasticCross(
    { fast: stochRsiK[idx], slow: stochRsiK[idx - 1] },
    { fast: stochRsiD[idx], slow: stochRsiD[idx - 1] },
    { over: 30, under: 70 },
    "under",
  );

  // 7. Filter Volatilitas & Volume Spike
  const atrPercent = (atr / close) * 100;
  const validVolatility = atrPercent >= 0.1 && atrPercent <= 1.2;
  const volumeSpike = isVolumeSpike(c1.volumes, 20, 1);
  if (!validVolatility || !volumeSpike) return null;

  // 8. Struktur Market & Divergence
  const structure = getMarketStructure(c1.highs, c1.lows);
  const bullishDivergence = hasBullishDivergence(c1.lows, rsi14);
  const bearishDivergence = hasBearishDivergence(c1.highs, rsi14);

  // 9. Anatomi Candle & Pullback
  const candleBody = Math.abs(close - open);
  const candleRange = high - low;
  if (candleRange <= 0) return null;

  const strongBullishCandle =
    close > open && candleBody >= candleRange * 0.4 && close > emaFast;
  const strongBearishCandle =
    close < open && candleBody >= candleRange * 0.4 && close < emaFast;

  const pullbackLong =
    close > emaMid && low <= emaFast + atr * 0.3 && close > emaFast - atr * 0.2;
  const pullbackShort =
    close < emaMid &&
    high >= emaFast - atr * 0.3 &&
    close < emaFast + atr * 0.2;

  // ==========================================
  // 10. CONFLUENCE MATRIX SCORING (DIOPTIMALKAN)
  // ==========================================
  let longScore = 0;
  let shortScore = 0;

  if (volumeSpike) {
    longScore += 1;
    shortScore += 1;
  }

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

  // Triggers score
  if (stochBullish) longScore += 1;
  if (stochBearish) shortScore += 1;

  if (pullbackLong) longScore += 1;
  if (pullbackShort) shortScore += 1;

  if (strongBullishCandle) longScore += 1;
  if (strongBearishCandle) shortScore += 1;

  // Keamanan Divergence (Pengurang Skor Dinamis)
  if (bearishDivergence) longScore -= 2;
  if (bullishDivergence) shortScore -= 2;

  // Hitung jumlah trigger aktif
  const longTriggerCount = [
    stochBullish,
    pullbackLong,
    strongBullishCandle,
  ].filter(Boolean).length;
  const shortTriggerCount = [
    stochBearish,
    pullbackShort,
    strongBearishCandle,
  ].filter(Boolean).length;

  // ==========================================
  // 11. EKSEKUSI KONDISI SINYAL (DIPERBAIKI)
  // ==========================================
  // Menggunakan sistem murni gabungan passing score & syarat wajib tren makro
  const validLong =
    longScore >= 5 &&
    longScore > shortScore &&
    htfTrendLong &&
    longTriggerCount >= 1 &&
    !bearishDivergence;

  const validShort =
    shortScore >= 5 &&
    shortScore > longScore &&
    htfTrendShort &&
    shortTriggerCount >= 1 &&
    !bullishDivergence;

  const signal = validLong ? "LONG" : validShort ? "SHORT" : "WAIT";
  if (signal === "WAIT") return null;

  // 12. Manajemen Sizing & Eksekusi Harga (Dinamis Berdasarkan Config)
  const pricing = GetSLTPPrice(close, atr, signal === "LONG" ? "buy" : "sell");
  if (!pricing || pricing.amount <= 0) return null;

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
    summary: `Longscore ${longScore} / Shortscore ${shortScore}`,
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
  // 3. Kondisi Jenuh (RSI) & Toleransi Band Touch
  const oversoldRSI = rsi <= 35;
  const overboughtRSI = rsi >= 65;
  const bandTolerance = atr * 0.08;

  const touchLowerBand = low <= lowerBand + bandTolerance;
  const touchUpperBand = high >= upperBand - bandTolerance;

  // 4. Kalkulasi Karakteristik Candle (Anatomi Body & Wick)
  const totalRange = high - low;
  if (totalRange <= 0) return null;

  const body = Math.abs(close - open);
  const lowerWick = Math.min(open, close) - low;
  const upperWick = high - Math.max(open, close);

  const lowerWickRatio = lowerWick / totalRange;
  const upperWickRatio = upperWick / totalRange;
  const bodyRatio = body / totalRange;

  // Deteksi Rejection Terkonfirmasi (Sudah include Close di dalam Band & Reclaim)
  const bullishReject =
    lowerWickRatio >= 0.4 &&
    bodyRatio <= 0.45 &&
    close > open &&
    close > lowerBand;
  const bearishReject =
    upperWickRatio >= 0.4 &&
    bodyRatio <= 0.45 &&
    close < open &&
    close < upperBand;

  // Reclaim standar (Tanpa wick panjang)
  const standardReclaimLower =
    low <= lowerBand && close > lowerBand && close > open && bodyRatio >= 0.25;
  const standardRejectUpper =
    high >= upperBand && close < upperBand && close < open && bodyRatio >= 0.25;

  // 5. Filter HTF (DIPERBAIKI: Mencegah Repainting)
  let htfBullish = true;
  let htfBearish = true;

  if (c2.closes.length >= 200) {
    const htfEma200 = CalculateEMA(c2.closes, 200);
    const htfClose = c2.closes[c2.closes.length - 2]; // Ambil candle yang sudah close
    const ema200 = htfEma200[htfEma200.length - 2];

    if (htfClose && ema200) {
      htfBullish = htfClose >= ema200 * 0.995;
      htfBearish = htfClose <= ema200 * 1.005;
    }
  }
  const prevClose = c1.closes[c1.closes.length - 2];
  // const prevOpen = c1.opens[c1.opens.length - 2];
  const bullishConfirmation = close > open && close > prevClose;
  const bearishConfirmation = close < open && close < prevClose;

  const ema50Arr = CalculateEMA(c1.closes, 50);
  const ema50 = LastNumber(ema50Arr);
  const notStrongDowntrend = close >= ema50 * 0.97;
  const notStrongUptrend = close <= ema50 * 1.03;

  // 6. Penentuan Sinyal (DIPERBAIKI: Mengikuti Logika Komentar Asli Anda)
  // JIKA HTF Bullish -> Cukup Standard Reclaim. JIKA HTF Bearish -> Wajib Bullish Rejection Kuat.
  const validLong =
    oversoldRSI &&
    touchLowerBand &&
    notStrongDowntrend &&
    bullishConfirmation &&
    (htfBullish ? standardReclaimLower : bullishReject);

  const validShort =
    overboughtRSI &&
    touchUpperBand &&
    notStrongUptrend &&
    bearishConfirmation &&
    (htfBearish ? standardRejectUpper : bearishReject);

  const signal = validLong ? "LONG" : validShort ? "SHORT" : "WAIT";
  if (signal === "WAIT") return null;

  // 7. Penentuan Entry & Keluar (SL/TP)
  const entryPrice = close;
  let stopLossPrice = 0;
  let takeProfitPrice = 0;

  if (signal === "LONG") {
    stopLossPrice = Math.min(low, lowerBand) - atr * 1.5;
    const targets = [middleBand, lastVWAP].filter((tp) => tp > entryPrice);
    if (targets.length === 0) return null;

    // Optimasi Target: Ambil target terjauh jika RR target terdekat terlalu busuk
    takeProfitPrice = Math.min(...targets);
    if (
      (takeProfitPrice - entryPrice) / Math.abs(entryPrice - stopLossPrice) <
      0.8
    ) {
      takeProfitPrice = Math.max(...targets); // Switch ke target terjauh (misal VWAP)
    }
  } else {
    stopLossPrice = Math.max(high, upperBand) + atr * 1.5;
    const targets = [middleBand, lastVWAP].filter((tp) => tp < entryPrice);
    if (targets.length === 0) return null;

    takeProfitPrice = Math.max(...targets);
    if (
      (entryPrice - takeProfitPrice) / Math.abs(stopLossPrice - entryPrice) <
      0.8
    ) {
      takeProfitPrice = Math.min(...targets);
    }
  }

  const riskPrice = Math.abs(entryPrice - stopLossPrice);
  const rewardPrice = Math.abs(takeProfitPrice - entryPrice);
  if (riskPrice <= 0 || rewardPrice <= 0) return null;

  const rr = rewardPrice / riskPrice;
  if (rr > 1.3) return null;

  // 8. Dynamic Position Sizing
  const riskUSDT = 10 * (RISK_PERCENT / 100);
  const amount = riskUSDT / riskPrice;

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
    summary: `Mean Reversion ${signal} | RSI=${rsi.toFixed(2)} | RR=${rr.toFixed(2)}`,
    open_time: new Date(),
    open: Number(entryPrice.toFixed(4)),
    amount: Number(amount.toFixed(6)),
    sl_price: Number(stopLossPrice.toFixed(4)),
    tp_price: Number(takeProfitPrice.toFixed(4)),
    pnl: 0,
    reason: null,
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
  const bbWidthRatio = (prevUpperBand - prevLowerBand) / prevMiddleBand;
  const isCompression = bbWidthRatio <= 0.045;

  if (!isCompression) return null;

  // ===============================
  // Compression harus terjadi beberapa candle sebelumnya
  // Exclude candle breakout terakhir
  // ===============================
  const lookbackCompression = 5;

  const upperSlice = bb.upper.slice(-lookbackCompression - 1, -1);
  const lowerSlice = bb.lower.slice(-lookbackCompression - 1, -1);
  const middleSlice = bb.middle.slice(-lookbackCompression - 1, -1);

  if (upperSlice.length < lookbackCompression) return null;

  const compressionCount = upperSlice.filter((upper, index) => {
    const lower = lowerSlice[index];
    const middle = middleSlice[index];
    if (!upper || !lower || !middle || middle <= 0) return false;
    return (upper - lower) / middle <= 0.045;
  }).length;

  if (compressionCount < 3) return null;

  const volumePeriod = 20;
  const recentVolumes = c1.volumes.slice(-volumePeriod - 1, -1);
  if (recentVolumes.length < volumePeriod) return null;

  const avgVolume =
    recentVolumes.reduce((sum, v) => sum + v, 0) / recentVolumes.length;
  if (avgVolume <= 0 || volume / avgVolume < 1.2) return null;

  // 5. Price Range Breakout
  const rangeLookback = 20;
  const prevHighRange = Math.max(...c1.highs.slice(-rangeLookback - 1, -1));
  const prevLowRange = Math.min(...c1.lows.slice(-rangeLookback - 1, -1));

  if (prevHighRange <= prevLowRange || prevLowRange <= 0) return null;

  const totalRange = high - low;
  if (totalRange <= 0) return null;

  const body = Math.abs(close - open);
  const bodyRatio = body / totalRange;
  const closeLocation = (close - low) / totalRange;

  if (bodyRatio < 0.55) return null; // Reject candle doji/buntut panjang

  // 7. Volatilitas & Jarak Maksimal (Disesuaikan menjadi sedikit lebih longgar)
  if (totalRange > prevAtr * 2.5) return null;
  if (Math.abs(close - lastEma20) / close > 0.015) return null;

  // 8. Eksekusi Kondisi Breakout
  const breakoutBuffer = prevAtr * 0.08;
  const bullishCandle = close > open;
  const bearishCandle = close < open;

  const breakoutLong =
    close > prevUpperBand + breakoutBuffer &&
    close > prevHighRange + breakoutBuffer &&
    bullishCandle &&
    closeLocation >= 0.75;

  const breakoutShort =
    close < prevLowerBand - breakoutBuffer &&
    close < prevLowRange - breakoutBuffer &&
    bearishCandle &&
    closeLocation <= 0.25;

  if (!breakoutLong && !breakoutShort) return null;

  // 9. Trend Filter TF Utama
  if (breakoutLong && !(close > lastEma20 && close > lastEma50)) return null;

  if (breakoutShort && !(close < lastEma20 && close < lastEma50)) return null;

  // 10. Trend Filter HTF (DIPERBAIKI: Menggunakan index -2 untuk mencegah repainting)
  const htfEma20 = CalculateEMA(c2.closes, 20);
  const htfEma50 = CalculateEMA(c2.closes, 50);

  const htfClose = c2.closes[c2.closes.length - 2];
  const lastHtfEma20 = htfEma20[htfEma20.length - 2];
  const lastHtfEma50 = htfEma50[htfEma50.length - 2];

  if (!htfClose || !lastHtfEma20 || !lastHtfEma50) return null;

  const htfBullish = htfClose > lastHtfEma20 && lastHtfEma20 > lastHtfEma50;
  const htfBearish = htfClose < lastHtfEma20 && lastHtfEma20 < lastHtfEma50;
  // const htfBullish = htfClose > lastHtfEma20 || htfClose > lastHtfEma50;
  // const htfBearish = htfClose < lastHtfEma20 || htfClose < lastHtfEma50;

  const signal =
    breakoutLong && htfBullish
      ? "LONG"
      : breakoutShort && htfBearish
        ? "SHORT"
        : "WAIT";
  if (signal === "WAIT") return null;

  // 11. Manajemen Risiko & Penentuan SL/TP
  const entryPrice = close;
  let stopLossPrice = 0;
  let takeProfitPrice = 0;

  if (signal === "LONG") {
    // PERBAIKAN: SL diletakkan di bawah garis tengah BB atau di bawah lower range untuk keamanan dari retest
    // const safeSupport = Math.min(prevMiddleBand, prevLowRange);
    stopLossPrice = Math.min(prevUpperBand, prevHighRange) - prevAtr * 0.8;

    const risk = entryPrice - stopLossPrice;
    if (risk <= 0) return null;

    // Menaikkan Reward Ratio ke 1:2 karena strategi breakout membutuhkan RR tinggi untuk menutup akurasi yang rendah
    takeProfitPrice = entryPrice + risk * 1.5;
  } else {
    // PERBAIKAN: SL diletakkan di atas garis tengah BB atau di atas upper range
    // const safeResistance = Math.max(prevMiddleBand, prevHighRange);
    stopLossPrice = Math.max(prevLowerBand, prevLowRange) + prevAtr * 0.8;

    const risk = stopLossPrice - entryPrice;
    if (risk <= 0) return null;

    takeProfitPrice = entryPrice - risk * 1.5;
  }

  const riskPrice = Math.abs(entryPrice - stopLossPrice);
  const rr = Math.abs(takeProfitPrice - entryPrice) / riskPrice;

  // Mengunci minimal Risk-to-Reward Ratio di 1.5 agar secara matematis tetap profitable dalam jangka panjang
  if (rr < 1.5) return null;

  const riskPercentFromEntry = riskPrice / entryPrice;

  // Melonggarkan sedikit batas maksimal risk persentase karena SL kita sekarang lebih lebar dan aman
  if (riskPercentFromEntry > 0.04 || riskPercentFromEntry < 0.0025) return null;

  // 12. Dynamic Position Sizing (DIPERBAIKI: Menggunakan dynamic balance)
  const riskUSDT = 10 * (RISK_PERCENT / 100);
  const amount = riskUSDT / riskPrice;

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
    open: Number(entryPrice.toFixed(6)),
    amount: Number(amount.toFixed(6)),
    sl_price: Number(stopLossPrice.toFixed(6)),
    tp_price: Number(takeProfitPrice.toFixed(6)),
    pnl: 0,
    reason: null,
    summary: `Range Breakout Compression ${signal} | BBWidth=${bbWidthRatio.toFixed(4)} | VolRatio=${(volume / avgVolume).toFixed(2)}x | Risk=${(riskPercentFromEntry * 100).toFixed(2)}%`,
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
// const MIN_RSI = 50;

// const MAX_DISTANCE_FROM_EMA20_ATR = 1.5;
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
  const avgVolume20 = average(volumes.slice(-(AVG_VOLUME_PERIOD + 2), -2));
  const volumeSpike = avgVolume20 > 0 ? last.volume / avgVolume20 : 0;

  const candleRange = last.high - last.low;
  const candleBody = Math.abs(last.close - last.open);

  const bodyRatio = candleRange > 0 ? candleBody / candleRange : 0;
  const closePosition =
    candleRange > 0 ? (last.close - last.low) / candleRange : 0;

  const isBullishCandle = last.close > last.open;
  const isStrongBullishCandle =
    isBullishCandle && bodyRatio >= 0.35 && closePosition >= 0.6;

  // Mencari high tertinggi dari range sebelum candle breakout terbentuk
  const recentHigh = Math.max(...highs.slice(-(RECENT_HIGH_PERIOD + 2), -2));
  const isBreakRecentHigh = price > recentHigh;

  // Anti entry telat (Dilonggarkan menjadi 2.2 ATR karena momentum breakout membutuhkan ruang lebih lebar)
  const distanceFromEma20Atr = (price - nowEma20) / nowAtr;
  const isTooFarFromEma20 = distanceFromEma20Atr > 2.2;

  // Trend HTF
  const isHtfBullish =
    nowHtfEma20 > nowHtfEma50 &&
    nowHtfEma20 > prevHtfEma20 &&
    nowHtfEma50 >= prevHtfEma50;

  // ===============================
  // Rejection filter
  // ===============================

  // Hindari candle merah / volume dump
  if (!isStrongBullishCandle) return null;

  // 2. Hindari entry jika benar-benar sudah overextended (terlalu jauh dari rata-rata)
  if (isTooFarFromEma20) return null;

  // 3. PERBAIKAN: Untuk strategi PUMP SCANNER, batasan RSI maksimal dinaikkan ke 82.
  // Sinyal kuat justru lahir saat RSI melompat ekstrem ke area overbought.
  if (nowRsi > 82) return null;

  // 4. Batasan bawah RSI diturunkan ke 48 agar koin yang baru berbalik arah (reversal) bisa ikut terscan
  if (nowRsi < 48) return null;

  // 5. HTF wajib mendukung tren besarnya
  if (!isHtfBullish) return null;

  // 6. Validitas konfirmasi breakout harga atas
  if (!isBreakRecentHigh) return null;

  // 7. Minimal volume masuk pasar
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
    open: Number(price.toFixed(6)),
    sl: Number(sl.toFixed(6)),
    tp: Number(tp.toFixed(6)),
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
