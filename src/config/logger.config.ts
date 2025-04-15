// 日志配置
export const loggerConfig = {
  level: process.env.LOG_LEVEL || "info",
  dir: process.env.LOG_DIR || "logs",

  // 日志文件
  file: {
    enabled: process.env.LOG_FILE_ENABLED === "true",
    filename: "%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "14d",
  },

  // 控制台输出
  console: {
    enabled: process.env.LOG_CONSOLE_ENABLED !== "false",
    colorize: true,
  },

  // 操作日志
  operation: {
    enabled: process.env.OPERATION_LOG_ENABLED !== "false",
    excludePaths: [
      "/auth/login",
      "/auth/logout",
      "/auth/refresh",
      "/uploads",
      "/",
    ],
  },

  // 错误日志
  error: {
    captureUncaught: true,
    captureRejections: true,
  },
};
