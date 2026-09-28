import mongoose from "mongoose";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

const healthCheck = asyncHandler(async (_req, res) => {
  const isDatabaseConnected = mongoose.connection.readyState === 1;
  const statusCode = isDatabaseConnected ? 200 : 503;

  return res.status(statusCode).json(
    new ApiResponse(
      statusCode,
      {
        status: isDatabaseConnected ? "ok" : "degraded",
        database: isDatabaseConnected ? "connected" : "disconnected",
        uptime: process.uptime(),
      },
      isDatabaseConnected ? "Health check passed" : "Database unavailable",
    ),
  );
});

export { healthCheck };
