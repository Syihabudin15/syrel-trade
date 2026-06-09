import { GetHourslyReport, ValidateActiveTrades } from "./services/order.js";

(async () => {
  await ValidateActiveTrades();
  await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 3));
  setInterval(
    async () => {
      await ValidateActiveTrades();
    },
    1000 * 60 * 3,
  );
})();

(async () => {
  setInterval(
    async () => {
      await GetHourslyReport();
    },
    1000 * 60 * 60 * 4,
  );
})();
