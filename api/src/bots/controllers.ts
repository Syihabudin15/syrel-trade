import type { Bot } from "@prisma/client";
import { ChildProcess, spawn } from "child_process";
import path from "path";
import prisma from "../libs/prisma.js";

type BotProcessMap = Record<string, ChildProcess>;
const runningBots: BotProcessMap = {};
const botFiles = ["tradebot1", "tradebot2", "tradebot3", "tradebot4"];

export async function StartBot(bot: Bot) {
  if (runningBots[bot.id])
    return {
      msg: `Bot ${bot.name} (${bot.id}) sudah berjalan`,
      success: false,
    };

  const find = botFiles.find((f) => f === bot.id);
  if (!find) return { msg: "File tidak ditemukan", success: false };

  const botFile = path.join(process.cwd(), "dist", "src", "bots", `${find}.js`);

  const child = spawn("node", [botFile, bot.id], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  runningBots[bot.id] = child;

  child.stdout.on("data", async (data) => {
    const message = data.toString().trim();
    console.log(`[${bot.id} LOG]: ${message}`);
  });

  child.stderr.on("data", async (data) => {
    const message = data.toString().trim();
    console.error(`[${bot.id} ERROR]: ${message}`);
    await prisma.botLog.create({
      data: { reason: message, date: new Date(), botId: bot.id },
    });
  });

  child.on("close", async (code) => {
    delete runningBots[bot.id];
    if (code) {
      await Promise.all([
        prisma.bot.update({
          where: { id: bot.id },
          data: { active: false, updated_at: new Date() },
        }),
        prisma.botLog.create({
          data: {
            reason: `Bot berhenti dengan kode status ${code}`,
            date: new Date(),
            botId: bot.id,
          },
        }),
      ]);
    }
  });

  await Promise.all([
    prisma.bot.update({
      where: { id: bot.id },
      data: { active: true, updated_at: new Date() },
    }),
    prisma.botLog.create({
      data: { reason: "Bot dimulai", date: new Date(), botId: bot.id },
    }),
  ]);

  return { msg: `Bot ${bot.name} berhasil dijalankan`, success: true };
}

export async function StopBot(bot: Bot) {
  const process = runningBots[bot.id];

  if (!process)
    return { msg: `Bot ${bot.name} belum dijalankan`, success: false };

  process.kill("SIGTERM");

  delete runningBots[bot.id];

  await Promise.all([
    prisma.bot.update({
      where: {
        id: bot.id,
      },
      data: {
        active: false,
        updated_at: new Date(),
      },
    }),
    await prisma.botLog.create({
      data: {
        reason: "Bot dihentikan manual",
        date: new Date(),
        botId: bot.id,
      },
    }),
  ]);

  return { msg: "Bot berhasil dihentikan", success: true };
}
