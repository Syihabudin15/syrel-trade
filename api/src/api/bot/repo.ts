import type { Request, Response } from "express";
import { ResponseServer } from "../../libs/util.js";
import type { Bot, Prisma } from "@prisma/client";
import prisma from "../../libs/prisma.js";
import { StartBot, StopBot } from "../../bots/controllers.js";

export const GET = async (req: Request, res: Response) => {
  let { page = 1, limit = 100, name, active } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;
  try {
    const where: Prisma.BotWhereInput = {
      status: true,
      ...(name && { name: { contains: name as string } }),
      ...(active && { active: active === "1" ? true : false }),
    };
    const [data, total] = await prisma.$transaction([
      prisma.bot.findMany({
        where,
        skip,
        take: limit,
        include: { BotLogs: true },
      }),
      prisma.bot.count({ where }),
    ]);

    return ResponseServer(res, 200, { data, total });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, { msg: err });
  }
};

export const POST = async (req: Request, res: Response) => {
  const data: Bot = await req.body;
  try {
    await prisma.bot.create({ data });
    return ResponseServer(res, 200, { msg: "Berhasil" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, { msg: err });
  }
};

export const PUT = async (req: Request, res: Response) => {
  const id = req.params.id;
  const data: Bot = await req.body;

  try {
    await prisma.bot.update({
      where: { id: id as string },
      data: { ...data, updated_at: new Date() },
    });
    return ResponseServer(res, 200, { msg: "Berhasil" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, { msg: err });
  }
};

export const DELETE = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    await prisma.bot.update({
      where: { id: id as string },
      data: { updated_at: new Date(), status: false },
    });
    return ResponseServer(res, 200, { msg: "Berhasil" });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, { msg: err });
  }
};

export const PATCH = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const finds = await prisma.bot.findFirst({
      where: { id: id as string },
      include: { BotLogs: true, Trades: { include: { Pair: true } } },
    });
    return ResponseServer(res, 200, { msg: "Berhasil", data: finds });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, { msg: err });
  }
};

export const STARTBOT = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const find = await prisma.bot.findFirst({ where: { id: id as string } });
    if (!find) return ResponseServer(res, 404, { msg: "Bot tidak ditemukan" });
    const { msg, success } = await StartBot(find);

    return ResponseServer(res, success ? 200 : 400, { msg: msg });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, { msg: err });
  }
};

export const STOPBOT = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const find = await prisma.bot.findFirst({ where: { id: id as string } });
    if (!find) return ResponseServer(res, 404, { msg: "Bot tidak ditemukan" });

    const { msg, success } = await StopBot(find);

    return ResponseServer(res, success ? 200 : 400, { msg: msg });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, { msg: err });
  }
};
