import { Router, type IRouter } from "express";
import healthRouter from "./health";
import messagesRouter from "./messages";
import storeRouter from "./store";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/chat", messagesRouter);
router.use(storeRouter);

export default router;
