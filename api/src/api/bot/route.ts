import { Router } from "express";
import * as repo from "./repo.js";

const router = Router();

router.get("/", repo.GET);
router.post("/", repo.POST);
router.put("/:id", repo.PUT);
router.patch("/:id", repo.PATCH);
router.delete("/:id", repo.DELETE);
router.put("/:id/start", repo.STARTBOT);
router.put("/:id/stop", repo.STOPBOT);

export default router;
