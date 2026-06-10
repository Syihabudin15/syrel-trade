export enum EBotType {
  TRADING = "TRADING",
  SCANNER = "SCANNER",
  SMC = "SMC",
}

export interface IBot {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  type: EBotType;

  status: boolean;
  created_at: Date;
  updated_at: Date;
  BotLogs: IBotLog[];
  Trades: ITrade[];
}
export interface IPair {
  id: string;
  name: string;

  status: boolean;
  created_at: Date;
  updated_at: Date;
  Trades: ITrade[];
  // PumpScanners PumpScanner[]
}
export interface ITrade {
  id: string;
  side: "buy" | "sell";
  open: number;
  close: number | null;
  amount: number;
  lev: number;
  tp_price: number | null;
  sl_price: number | null;
  pnl: number;
  reason: string | null;

  open_time: Date;
  close_time: Date | null;
  Pair: IPair;
  pairId: string;
  Bot: IBot | null;
  botId: string | null;
}

export interface IPumpScanner {
  id: string;
  reason: string | null;
  open: number;
  sl: number;
  tp: number;
  summary: string;
  active: boolean;

  status: boolean;
  created_at: Date;
  updated_at: Date;
  Pair: IPair;
  pairId: string;
  Bot: IBot;
  botId: string;
}

export interface IBotLog {
  id: string;
  reason: string;
  date: Date;
  Bot: IBot;
  botId: string;
}
