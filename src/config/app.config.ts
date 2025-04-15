// 应用配置
export const appConfig = {
  name: "Hono Admin",
  env: process.env.NODE_ENV || "development",
  host: process.env.HOST || "0.0.0.0",
  port: parseInt(process.env.PORT || "3000", 10),
  version: process.env.APP_VERSION || "1.0.0",
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  apiPrefix: process.env.API_PREFIX || "",
  timezone: process.env.TIMEZONE || "Asia/Shanghai",
};
