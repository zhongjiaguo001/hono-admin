import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import userRoutes from "@/modules/users";
import authRoutes from "@/modules/auth";
import emailRoutes from "@/modules/email";
import roleRoutes from "@/modules/roles";
import menuRoutes from "@/modules/menus";

const app = new Hono();

// 使用日志中间件
app.use("*", logger());
// 使用 CORS 中间件
app.use("/api/*", cors());

// --- 挂载路由 ---
app.route("/api/system/users", userRoutes); // 用户路由
app.route("/api/system/roles", roleRoutes); // 角色路由
app.route("/api/system/menus", menuRoutes); // 菜单路由
app.route("/api/auth", authRoutes); // 认证路由
app.route("/api/email", emailRoutes); // 邮件路由

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
