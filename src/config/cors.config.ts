// CORS配置
export const corsConfig = {
  enabled: process.env.CORS_ENABLED !== "false",
  allowOrigins: process.env.CORS_ALLOW_ORIGINS
    ? process.env.CORS_ALLOW_ORIGINS.split(",")
    : ["*"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
  maxAge: 86400, // 1天内不再发送预检请求
};
