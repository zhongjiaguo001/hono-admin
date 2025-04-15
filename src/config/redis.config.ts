// Redis配置
export const redisConfig = {
  host: process.env.REDIS_HOST || "redis://localhost:6379",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || "",
  db: parseInt(process.env.REDIS_DB || "0", 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || "hono:admin:",
  connectionTimeout: 10000,

  // 缓存配置
  cacheEnabled: process.env.CACHE_ENABLED === "true",
  cacheExpiresIn: parseInt(process.env.CACHE_EXPIRES_IN || "3600", 10), // 默认1小时

  // 需要缓存的键格式
  cacheKeyFormats: {
    user: "user:{id}:info",
    userPermissions: "user:{id}:permissions",
    menu: "menu:list",
    dict: "dict:{code}",
  },
};
