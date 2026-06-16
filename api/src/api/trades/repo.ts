import type { Request, Response } from "express";
import { ResponseServer } from "../../libs/util.js";
import type { Prisma } from "@prisma/client";
import moment from "moment";
import prisma from "../../libs/prisma.js";

export const GET = async (req: Request, res: Response) => {
  let {
    page = 1,
    limit = 100,
    pairId,
    search,
    backdate,
    status,
    botId,
  } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.TradeWhereInput = {
      ...(pairId && { pairId: pairId as string }),
      ...(botId && { botId: botId as string }),
      ...(status && { close_time: status === "active" ? { not: null } : null }),
      ...(backdate && {
        open_time: {
          gte: moment((backdate as string).split(",")[0])
            .startOf("day")
            .toDate(),
          lte: moment((backdate as string).split(",")[1])
            .endOf("day")
            .toDate(),
        },
      }),
      ...(search && { Pair: { name: { contains: search as string } } }),
    };
    const data = await prisma.trade.findMany({
      where,
      skip,
      take: limit,
      orderBy: { open_time: "desc" },
      include: {
        Pair: true,
        Bot: {
          include: { BotLogs: true },
        },
      },
    });
    const all = await prisma.trade.findMany({ where });

    const total = await prisma.trade.count({ where });
    const profit = all.filter((d) => d.pnl > 0);
    const loss = all
      .filter((d) => d.pnl < 0)
      .reduce((acc, curr) => acc + curr.pnl, 0);
    const closeds = all.filter((d) => d.close_time !== null);
    const actives = all.filter((d) => d.close_time == null);

    return ResponseServer(res, 200, {
      data,
      total,
      profit,
      loss,
      pnl: profit.reduce((acc, curr) => acc + curr.pnl, 0) - loss,
      actives,
      closeds,
      winrate: profit.length / closeds.length,
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, { msg: err });
  }
};
