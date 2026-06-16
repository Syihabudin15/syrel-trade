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

    // 1. Ambil transaksi yang sudah selesai (closed) saja untuk menghitung statistik win/loss
    const closeds = all.filter((d) => d.close_time !== null);
    const actives = all.filter((d) => d.close_time === null);

    // 2. Filter mana yang menang dan mana yang kalah dari transaksi yang SUDAH SELESAI
    const profitTrades = closeds.filter((d) => d.pnl > 0);
    const lossTrades = closeds.filter((d) => d.pnl < 0);

    // 3. Hitung total uang nominal profit dan loss
    const totalProfitAmount = profitTrades.reduce(
      (acc, curr) => acc + curr.pnl,
      0,
    );
    const totalLossAmount = lossTrades.reduce((acc, curr) => acc + curr.pnl, 0); // hasilnya negatif, misal -500

    // 4. Hitung Win Rate dengan aman (antisipasi jika belum ada trade yang closed)
    const totalClosed = closeds.length;
    const winrate =
      totalClosed > 0 ? (profitTrades.length / totalClosed) * 100 : 0;

    return ResponseServer(res, 200, {
      data,
      total: all.length,
      profitCount: profitTrades.length, // jumlah berapa kali menang
      lossCount: lossTrades.length, // jumlah berapa kali kalah
      totalProfitAmount,
      totalLossAmount,
      pnl: totalProfitAmount + totalLossAmount, // Ditambah karena totalLossAmount sudah negatif (e.g., 1000 + (-500) = 500)
      actives,
      closeds,
      winrate: Math.round(winrate), // Ditampilkan dalam bentuk persen bulat (e.g., 60%)
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, { msg: err });
  }
};
