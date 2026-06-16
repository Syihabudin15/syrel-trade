import moment from "moment";
import { GetCurrentPrice } from "../libs/exchange.js";
import type { ITrade } from "../libs/interfaces.js";
import prisma from "../libs/prisma.js";
import { SendTelegramMessage } from "../libs/messages.js";
import type { Prisma } from "@prisma/client";

export const CreateBulkOrder = async (payload: ITrade[]) => {
  for (const data of payload) {
    await prisma.$transaction(async (tx) => {
      const findOrSavePair = await tx.pair.upsert({
        where: { name: data.Pair.name },
        update: {},
        create: { name: data.Pair.name },
      });
      const { Pair, ...d } = data;
      await prisma.trade.create({
        data: { ...d, pairId: findOrSavePair.id },
      });
      return true;
    });
  }
  return payload;
};

export const CreateOrder = async (payload: ITrade) => {
  const { id, Pair, ...data } = payload;
  const result = await prisma.$transaction(async (tx) => {
    const findOrSavePair = await tx.pair.upsert({
      where: { name: Pair.name },
      update: {},
      create: { name: Pair.name },
    });
    const saved = await tx.trade.create({
      data: { ...data, pairId: findOrSavePair.id },
    });
    return saved;
  });
  return result;
};

export const CloseOrder = async (payload: ITrade) => {
  if (payload.close_time) return payload;
  const { Pair, ...data } = payload;
  await prisma.trade.update({ where: { id: payload.id }, data: data });
  return payload;
};

export const UpsertOrders = async (payload: ITrade[]) => {
  const mapping = payload.map((m) => {
    const { Pair, ...data } = m;
    return data;
  });
  await prisma.$transaction(
    mapping.map((p) =>
      prisma.trade.upsert({ where: { id: p.id }, create: p, update: p }),
    ),
  );
  return mapping;
};

export const GetActiveTrades = async (
  symbol: string,
  side?: "buy" | "sell",
) => {
  const where: Prisma.TradeWhereInput = {
    Pair: { name: symbol },
    close_time: null,
    ...(side && { side }),
  };

  const finds = await prisma.trade.findMany({
    where,
    include: { Pair: true },
  });
  return finds;
};

export function CalcPnl(
  side: "buy" | "sell",
  open: number,
  close: number,
  amount: number,
) {
  if (side === "buy") {
    return Number(((close - open) * amount).toFixed(4));
  }

  return Number(((open - close) * amount).toFixed(4));
}

export const ValidateBeforeTrade = async (symbol?: string) => {
  const where: Prisma.TradeWhereInput = {
    open_time: {
      gte: moment().subtract(4, "hours").toDate(),
    },
    ...(symbol && { Pair: { name: symbol } }),
  };

  const finds = await prisma.trade.findMany({
    where,
    include: { Pair: true },
  });
  return finds;
};

export const GetAllActiveTrades = async () => {
  const where: Prisma.TradeWhereInput = {
    close_time: null,
  };

  const finds = await prisma.trade.findMany({
    where,
    include: { Pair: true },
  });
  return finds;
};

export const ValidateActiveTrades = async () => {
  try {
    const data = await prisma.trade.findMany({
      where: { close_time: null },
      include: { Pair: true },
    });
    const updated: ITrade[] = [];
    for (const trade of data) {
      const ticker = await GetCurrentPrice(trade.Pair.name);
      if (!ticker || !trade.sl_price || !trade.tp_price) continue;

      if (trade.side === "buy") {
        const hitTP = ticker >= trade.tp_price;
        const hitSL = ticker <= trade.sl_price;

        if (hitTP || hitSL) {
          const closePrice = hitTP ? trade.tp_price : trade.sl_price;
          const closeReason = hitTP ? "TP" : "SL";

          updated.push({
            ...trade,
            close: closePrice,
            close_time: new Date(),
            reason: closeReason,
            pnl: CalcPnl(trade.side, trade.open, closePrice, trade.amount),
          });
        }
      }

      if (trade.side === "sell") {
        const hitTP = ticker <= trade.tp_price;
        const hitSL = ticker >= trade.sl_price;

        if (hitTP || hitSL) {
          const closePrice = hitTP ? trade.tp_price : trade.sl_price;
          const closeReason = hitTP ? "TP" : "SL";

          updated.push({
            ...trade,
            close: closePrice,
            close_time: new Date(),
            reason: closeReason,
            pnl: CalcPnl(
              trade.side as "buy" | "sell",
              trade.open,
              closePrice,
              trade.amount,
            ),
          });
        }
      }
    }
    if (updated.length !== 0) {
      await prisma.$transaction(
        updated
          .map((d) => {
            const { Pair, ...data } = d;
            return data;
          })
          .map((d) =>
            prisma.trade.updateMany({ where: { id: d.id }, data: d }),
          ),
      );
      SendTelegramMessage(`
📋 <b>Closed Trade</b>
${updated.map((d) => `${d.reason} (${d.side}) ${d.Pair.name}: ${d.pnl.toFixed(2)}`).join("\n")}
        `);
    }
  } catch (err) {
    console.log(err);
    SendTelegramMessage(`
⚠️ <b>VALIDATE ACTIVE TRADES FAILED</b>
Time: <b>${new Date().toLocaleDateString()}</b>
Error: <code>${err instanceof Error ? err.message : String(err)}</code>
    `);
  }
};

export const GetHourslyReport = async () => {
  try {
    const actives = await prisma.trade.findMany({
      where: { close_time: null },
      include: { Pair: true },
    });
    const alls = await prisma.trade.findMany({
      where: {
        close_time: { not: null },
        // open_time: {
        //   gte: moment().startOf("day").toDate(),
        //   lte: moment().endOf("day").toDate(),
        // },
      },
      include: { Pair: true },
    });
    const PnL = alls.reduce((acc, curr) => acc + curr.pnl, 0);

    SendTelegramMessage(`
📊 <b>REPORT TRADES</b>

✅ Active Trade: ${actives.length}
📋 Closed Trade: ${alls.length}
💰 PnL : ${PnL.toFixed(2)}
    `);
  } catch (err) {
    console.log(err);
    SendTelegramMessage(`
⚠️ <b>REPORT FAILED</b>
Time: <b>${new Date().toLocaleDateString()}</b>
Error: <code>${err instanceof Error ? err.message : String(err)}</code>
    `);
  }
};
