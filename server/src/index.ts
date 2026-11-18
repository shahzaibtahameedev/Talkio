import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { ALLOWED_ORIGINS, DEFAULT_PORT } from "./constants/server.constants.js";
import { messageRoute } from "./routes/message.route.js";

const app = new Hono();

app.use("/api/*", cors({ origin: ALLOWED_ORIGINS }));

app.route("/api/messages", messageRoute);

const configuredPort = Number(process.env.PORT);
const isValidPort = Number.isInteger(configuredPort) && configuredPort > 0;
const port = isValidPort ? configuredPort : DEFAULT_PORT;

serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Talkio server is running on http://localhost:${info.port}`);
});
