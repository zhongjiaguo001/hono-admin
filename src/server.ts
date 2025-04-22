import { prisma } from "@/db/prisma";
import { redisUtils } from "./utils/redis.utils";
import { logger } from "@/utils/logger.utils";
import { config } from "@/config";
import app from "./app";

const PORT = config.app.port;
const HOST = config.app.host;

// 启动服务器前进行连接检查
async function startServer() {
  try {
    // 检查数据库连接
    await prisma.$connect();
    logger.info("✅ 数据库连接已建立");

    // 检查Redis连接
    await redisUtils.execute("PING");
    logger.info("✅ Redis连接已建立");

    // 使用Bun的服务器API启动HTTP服务器
    const server = Bun.serve({
      fetch: app.fetch,
      port: PORT,
      hostname: HOST,
      development: config.app.env === "development",
      error(error) {
        logger.error("服务器错误:", error);
        return new Response("服务器错误", { status: 500 });
      },
    });

    logger.info(`✨ 服务器运行在 http://${server.hostname}:${server.port}`);
    logger.info(`🔧 环境: ${config.app.env}`);
    logger.info(`🔖 版本: ${config.app.version}`);

    if (config.app.env === "development") {
      logger.info("⚠️ 正在开发模式下运行");
    }
  } catch (error) {
    logger.error("服务器启动失败:", error);
    process.exit(1);
  }
}

// 优雅关闭服务
process.on("SIGINT", async () => {
  logger.info("👋 正在关闭服务器...");

  try {
    await prisma.$disconnect();
    logger.info("✅ 数据库连接已关闭");

    await redisUtils.execute("QUIT");
    logger.info("✅ Redis连接已关闭");

    process.exit(0);
  } catch (error) {
    logger.error("❌ 关闭过程中出错:", error);
    process.exit(1);
  }
});

// 处理未捕获的异常
process.on("uncaughtException", (error) => {
  logger.error("未捕获的异常:", error);
});

// 处理未处理的Promise拒绝
process.on("unhandledRejection", (reason) => {
  logger.error("未处理的Promise拒绝:", reason);
});

// 启动服务器
startServer();
