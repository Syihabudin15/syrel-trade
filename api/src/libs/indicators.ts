import {
  bullish,
  bearish,
  vwap,
  ema,
  rsi,
  atr,
  stochasticrsi,
  bollingerbands,
  BollingerBands,
  VWAP,
} from "technicalindicators";

export const CalculateEMA = (values: number[], period: number) => {
  return ema({ values, period });
};

export const CalculateRSI = (values: number[], period: number) => {
  return rsi({ values, period });
};

export const CalculateATR = (
  high: number[],
  low: number[],
  close: number[],
  period: number,
) => {
  return atr({ high, low, close, period });
};

export const CalculateVWAP = (
  high: number[],
  low: number[],
  close: number[],
  volume: number[],
) => {
  return vwap({ high, low, close, volume });
};

export const CalculateStockRSI = (
  close: number[],
  rsiPeriod = 14,
  stochasticPeriod = 14,
  kPeriod = 3,
  dPeriod = 3,
) => {
  return stochasticrsi({
    values: close,
    rsiPeriod,
    stochasticPeriod,
    kPeriod,
    dPeriod,
  });
};

export const CalculateBB = (
  closes: number[],
  period: number,
  stdDev: number,
) => {
  const input = {
    period: period,
    values: closes,
    stdDev: stdDev,
  };

  // Kalkulasi menggunakan technicalindicators
  const result = BollingerBands.calculate(input);

  // Menghitung selisih panjang array asli vs hasil kalkulasi
  const paddingLength = closes.length - result.length;

  // Membuat padding untuk menyelaraskan indeks (menggunakan 0 atau bisa juga null)
  const padding = Array(paddingLength).fill({
    upper: 0,
    middle: 0,
    lower: 0,
  });

  // Menggabungkan padding dengan hasil kalkulasi
  const paddedResult = [...padding, ...result];

  // Memecah menjadi array terpisah agar lebih mudah diakses menggunakan LastNumber()
  return {
    upper: paddedResult.map((r) => r.upper),
    middle: paddedResult.map((r) => r.middle),
    lower: paddedResult.map((r) => r.lower),
  };
};

export const CalculateVWAPV2 = (
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[],
): number[] => {
  const input = {
    high: highs,
    low: lows,
    close: closes,
    volume: volumes,
  };

  // Kalkulasi menggunakan technicalindicators
  const result = VWAP.calculate(input);

  // VWAP biasanya menghasilkan array yang panjangnya hampir sama dengan input,
  // tetapi kita tetap memberikan safety padding untuk menghindari error pergeseran indeks.
  const paddingLength = closes.length - result.length;
  const padding = Array(paddingLength).fill(0);

  return [...padding, ...result];
};

export const CalculateTrend = (
  open: number[],
  high: number[],
  low: number[],
  close: number[],
) => {
  const bull = bullish({ open, high, low, close, reversedInput: false });
  const bear = bearish({ open, high, low, close, reversedInput: false });

  return bull ? "LONG" : bear ? "SHORT" : "HOLD";
};
