import { Router, type IRouter } from "express";
import healthRouter from "./health";
import messagesRouter from "./messages";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/chat", messagesRouter);

export default router;
