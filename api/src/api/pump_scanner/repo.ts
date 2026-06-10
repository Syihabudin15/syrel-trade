import type { Request, Response } from "express";
import { ResponseServer } from "../../libs/util.js";
import type { Prisma } from "@prisma/client";
import prisma from "../../libs/prisma.js";

export const GET = async (req: Request, res: Response) => {
  let { page = 1, limit = 100, search, active, botId } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.PumpScannerWhereInput = {
      ...(search && { Pair: { name: { contains: search as string } } }),
      ...(botId && { botId: botId as string }),
      ...(active && { active: active === "true" ? true : false }),
      status: true,
    };
    const data = await prisma.pumpScanner.findMany({
      where,
      skip,
      take: limit,
      include: {
        Pair: true,
        Bot: {
          include: { BotLogs: true },
        },
      },
    });
    const bot = await prisma.bot.findFirst({ where: { id: botId as string } });

    return ResponseServer(res, 200, { data, bot });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, { msg: err });
  }
};
