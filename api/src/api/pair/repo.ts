import type { Request, Response } from "express";
import { ResponseServer } from "../../libs/util.js";
import type { Bot, Prisma } from "@prisma/client";
import prisma from "../../libs/prisma.js";
import { StartBot, StopBot } from "../../bots/controllers.js";

export const GET = async (req: Request, res: Response) => {
  let { page = 1, limit = 100, name } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.PairWhereInput = {
      status: true,
      ...(name && { name: { contains: name as string } }),
    };
    const [data, total] = await prisma.$transaction([
      prisma.pair.findMany({
        where,
        skip,
        take: limit,
        include: {
          Trades: { include: { Bot: { include: { BotLogs: true } } } },
        },
      }),
      prisma.pair.count({ where }),
    ]);

    return ResponseServer(res, 200, { data, total });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, { msg: err });
  }
};
