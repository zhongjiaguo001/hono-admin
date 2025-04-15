// src/db/prisma.ts  (这就是封装 prisma 的地方)
import { PrismaClient } from "@prisma/client";

// 实例化 PrismaClient
export const prisma = new PrismaClient();
// 你可以在这里添加一些全局配置，例如日志
// {
//   log: ['query', 'info', 'warn', 'error'],
// }
