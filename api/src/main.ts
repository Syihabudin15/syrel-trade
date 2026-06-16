import { GetHourslyReport, ValidateActiveTrades } from "./services/order.js";
import { ValidatePumpScanner } from "./services/scanner.js";

(async () => {
  await ValidateActiveTrades();
  await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 3));
  setInterval(
    async () => {
      await ValidateActiveTrades();
    },
    1000 * 60 * 1,
  );
})();

(async () => {
  await ValidatePumpScanner();
  await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 3));
  setInterval(
    async () => {
      await ValidatePumpScanner();
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
