import express from "express";

import { MAX_BODY_SIZE, PORT } from "@/global/config";
import { logger } from "@/global/logger";
import { globalErrorHandler } from "@/middlewares/globalErrorHandler";
import { jsonErrorHandler } from "@/middlewares/jsonErrorHandler";
import { zodErrorHandler } from "@/middlewares/zodErrorHandler";
import { notificationRouter } from "@/whatsapp/router";

const app = express();

app.use(
  express.json({
    limit: MAX_BODY_SIZE,
  }),
);

app.use(jsonErrorHandler);

app.use(notificationRouter);

app.use(zodErrorHandler);
app.use(globalErrorHandler);

app.listen(PORT, () => {
  logger.info(`Web server listening on port ${PORT}`);
});

export default app;
