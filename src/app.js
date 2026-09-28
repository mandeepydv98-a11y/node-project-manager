import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import healthCheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import projectRouter from "./routes/project.routes.js";
import taskRouter from "./routes/task.routes.js";
import noteRouter from "./routes/note.routes.js";
import { Apierror } from "./utils/api-error.js";

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: configuredOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/notes", noteRouter);

app.get("/", (_req, res) => {
  res
    .status(200)
    .json({ success: true, message: "Project Camp API is running" });
});

app.use((_req, _res, next) => {
  next(new Apierror(404, "Route not found"));
});

app.use((error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";
  let errors = error.errors || [];

  if (error instanceof multer.MulterError) {
    statusCode = 400;
    message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Each attachment must be 5MB or smaller"
        : error.message;
  } else if (error.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(error.keyPattern || error.keyValue || {});
    message = `A record with the same ${fields.join(", ")} already exists`;
  } else if (error.name === "ValidationError") {
    statusCode = 422;
    errors = Object.values(error.errors).map((item) => item.message);
    message = "Validation failed";
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${error.path}`;
  }

  const response = {
    success: false,
    statusCode,
    message,
    errors,
  };

  if (process.env.NODE_ENV !== "production") {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
});

export default app;
