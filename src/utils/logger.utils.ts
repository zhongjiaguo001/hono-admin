import { config } from "../config";
import { format, transports, createLogger } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

// 创建日志目录
const logDir = config.logger.dir;

// 定义日志格式
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// 控制台输出格式
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ level, message, timestamp, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ""
    }`;
  })
);

// 创建传输通道
const logTransports = [];

// 添加文件传输通道（如果启用）
if (config.logger.file.enabled) {
  logTransports.push(
    new DailyRotateFile({
      filename: path.join(logDir, config.logger.file.filename),
      datePattern: config.logger.file.datePattern,
      maxSize: config.logger.file.maxSize,
      maxFiles: config.logger.file.maxFiles,
      format: logFormat,
    })
  );
}

// 添加控制台传输通道（如果启用）
if (config.logger.console.enabled) {
  logTransports.push(
    new transports.Console({
      format: consoleFormat,
    })
  );
}

// 创建日志记录器
export const logger = createLogger({
  level: config.logger.level,
  format: logFormat,
  transports: logTransports,
  exitOnError: false,
});

// 捕获未处理的异常和拒绝
if (config.logger.error.captureUncaught) {
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception:", error);
  });
}

if (config.logger.error.captureRejections) {
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection:", reason);
  });
}
