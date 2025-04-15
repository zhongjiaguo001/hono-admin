import { appConfig } from "./app.config";
import { authConfig } from "./auth.config";
import { dbConfig } from "./db.config";
import { redisConfig } from "./redis.config";
import { corsConfig } from "./cors.config";
import { uploadConfig } from "./upload.config";
import { loggerConfig } from "./logger.config";

// 集中导出所有配置
export const config = {
  app: appConfig,
  auth: authConfig,
  db: dbConfig,
  redis: redisConfig,
  cors: corsConfig,
  upload: uploadConfig,
  logger: loggerConfig,
};
