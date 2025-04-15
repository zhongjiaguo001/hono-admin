// 数据库配置
export const dbConfig = {
  url:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/hono_admin",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "hono_admin",
};
