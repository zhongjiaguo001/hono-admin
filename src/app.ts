// src/app.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { serveStatic } from "hono/bun";
import { errorMiddleware } from "@/middleware/error.middleware";
import { operationLogMiddleware } from "@/middleware/logger.middleware";
import { config } from "./config";
import { createRoutes } from "./routes";

const app = new Hono();

// 全局中间件
app.use("*", errorMiddleware);
app.use("*", logger());
// app.use(
//   "*",
//   cors({
//     origin: config.cors.allowOrigins,
//     allowHeaders: ["Authorization", "Content-Type"],
//     allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     maxAge: 86400,
//     credentials: true,
//   })
// );
app.use("*", cors());
app.use("*", secureHeaders());
app.use("*", prettyJSON());

// 静态文件服务
app.use("/uploads/*", serveStatic({ root: "./" }));

// 操作日志记录 - 排除特定路径
app.use("*", (c, next) => {
  const path = c.req.path;
  // 排除登录、静态资源等路径的日志记录
  if (
    path.startsWith("/auth/login") ||
    path.startsWith("/uploads/") ||
    path === "/"
  ) {
    return next();
  }
  return operationLogMiddleware(c, next);
});

// 注册所有路由
app.route("/", createRoutes());

// 健康检查
app.get("/", (c) =>
  c.json({
    status: "ok",
    message: "Hono Admin API is running",
    version: config.app.version,
    timestamp: new Date().toISOString(),
  })
);

// 404处理
app.notFound((c) => {
  return c.json(
    {
      code: 404,
      message: "请求的资源不存在",
    },
    404
  );
});

export default app;
