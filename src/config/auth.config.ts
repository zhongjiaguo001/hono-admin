// 认证配置
export const authConfig = {
  jwtSecret:
    process.env.JWT_SECRET ||
    "your-super-secret-key-please-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  defaultPassword: process.env.DEFAULT_PASSWORD || "123456",
  saltRounds: parseInt(process.env.SALT_ROUNDS || "10", 10),

  // 忽略认证的路径
  ignoreAuthPaths: [
    "/auth/login",
    "/auth/captcha",
    "/",
    "/uploads",
    "/swagger",
  ],
};
