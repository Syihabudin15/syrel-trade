import type { Request, Response } from "express";
import { ResponseServer } from "../../libs/util.js";
import type { Prisma } from "@prisma/client";
import moment from "moment";
import prisma from "../../libs/prisma.js";

export const GET = async (req: Request, res: Response) => {
  let { page = 1, limit = 100, backdate, botId } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.BotLogWhereInput = {
      ...(botId && { botId: botId as string }),
      ...(backdate && {
        date: {
          gte: moment((backdate as string).split(",")[0])
            .startOf("day")
            .toDate(),
          lte: moment((backdate as string).split(",")[1])
            .endOf("day")
            .toDate(),
        },
      }),
    };
    const data = await prisma.botLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
      include: {
        Bot: {
          include: { BotLogs: true },
        },
      },
    });
    const total = await prisma.botLog.count({ where });

    return ResponseServer(res, 200, {
      data,
      total,
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, { msg: err });
  }
};
