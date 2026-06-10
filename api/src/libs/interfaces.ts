import type { Bot, Pair, PumpScanner, Trade } from "@prisma/client";

export interface ICandle {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
  volume: number;
}

export interface ITrade extends Trade {
  Pair: Pair;
}
export interface IPumpScanner extends PumpScanner {
  Pair: Pair;
  Bot: Bot;
}

export interface IGetCandles {
  candles: ICandle[];
  timestamps: number[];
  opens: number[];
  highs: number[];
  lows: number[];
  closes: number[];
  volumes: number[];
}
