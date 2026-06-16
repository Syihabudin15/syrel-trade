import { GetHourslyReport, ValidateActiveTrades } from "./services/order.js";
import { ValidatePumpScanner } from "./services/scanner.js";

(async () => {
  setInterval(
    async () => {
      await ValidateActiveTrades();
    },
    1000 * 60 * 1,
  );
})();

(async () => {
  setInterval(
    async () => {
      await ValidatePumpScanner();
    },
    1000 * 60 * 2,
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
