import "dotenv/config";
import "./main.js";
import express, { type Request, type Response } from "express";
import cors from "cors";
import moment from "moment";

import tradeRoute from "./api/trades/route.js";
import botRoute from "./api/bot/route.js";
import pairRoute from "./api/pump_scanner/route.js";
import pumpScannerRoute from "./api/pump_scanner/route.js";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);
app.use(express.json());

app.use("/api/test", async (req: Request, res: Response) => {
  return res.status(200).json({
    msg: "OK",
    trade_bot: true,
    server_time: moment().format("DD/MM/YYYY HH:mm"),
  });
});

app.use("/api/trade", tradeRoute);
app.use("/api/bot", botRoute);
app.use("/api/pair", pairRoute);
app.use("/api/pump_scanner", pumpScannerRoute);

const PORT = process.env.APP_PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Server ready at port: ${PORT}`);
});
