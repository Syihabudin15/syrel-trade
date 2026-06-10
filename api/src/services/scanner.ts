import type { PumpScanner } from "@prisma/client";
import type { IPumpScanner } from "../libs/interfaces.js";
import prisma from "../libs/prisma.js";
import { GetCurrentPrice } from "../libs/exchange.js";
import { SendTelegramMessage } from "../libs/messages.js";

export const CreatePumpScanner = async (data: IPumpScanner[]) => {
  const pumps: PumpScanner[] = [];
  for (const record of data) {
    const { Bot, Pair, ...saved } = record;
    const findOrSavePair = await prisma.pair.upsert({
      where: { name: Pair.name },
      update: {},
      create: { name: Pair.name },
    });
    pumps.push({ ...saved, pairId: findOrSavePair.id });
  }
  if (pumps.length !== 0) {
    await prisma.pumpScanner.createMany({ data: pumps });
  }
  return pumps;
};

export const ValidatePumpScanner = async () => {
  try {
    const finds = await prisma.pumpScanner.findMany({
      where: { active: true },
      include: { Pair: true },
    });
    const records = [];
    for (const record of finds) {
      const ticker = await GetCurrentPrice(record.Pair.name);
      if (!ticker || !record.sl || !record.tp) continue;
      if (ticker < record.sl || ticker > record.tp) {
        // const { Pair, ...saved } = record;
        records.push({
          ...record,
          reason: ticker < record.sl ? "SL" : "TP",
          active: false,
        });
      }
    }
    if (records.length !== 0) {
      await prisma.$transaction(
        records.map((r) => {
          const { Pair, ...saved } = r;
          return prisma.pumpScanner.update({
            where: { id: r.id },
            data: saved,
          });
        }),
      );
      SendTelegramMessage(`
📋 <b>Scanner Update</b>
${records.map((d) => `${d.reason} ${d.Pair.name}`).join("\n")}
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
