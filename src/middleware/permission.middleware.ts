import { Context, Next } from "hono";
import { PrismaClient } from "@prisma/client";
import { redisUtils } from "@/utils/redis.utils";
import { logger } from "@/utils/logger.utils";

const prisma = new PrismaClient();

/**
 * 权限检查中间件
 * @param permission 要求的权限标识
 * @returns 中间件函数
 */
export function requirePermission(permission: string) {
  return async function (c: Context, next: Next) {
    const user = c.get("user");

    if (!user) {
      return c.json({ code: 401, message: "未授权访问" }, 401);
    }

    // 尝试从缓存获取用户权限
    const cacheKey = `permissions:${user.id}`;
    let permissions = await redisUtils.get(cacheKey, true); // 使用parseJson=true

    // 缓存未命中，从数据库查询
    if (!permissions) {
      try {
        // 查询用户角色
        const userRoles = await prisma.userRole.findMany({
          where: { userId: user.id },
          include: {
            role: {
              include: {
                roleMenus: {
                  include: {
                    menu: true,
                  },
                },
              },
            },
          },
        });

        // 提取权限标识
        permissions = userRoles.flatMap((ur) =>
          ur.role.roleMenus.map((rm) => rm.menu.permission).filter(Boolean)
        );

        // 存入缓存，有效期1小时
        await redisUtils.set(cacheKey, permissions, 3600);
      } catch (error) {
        logger.error("获取用户权限失败:", error);
        return c.json({ code: 500, message: "获取权限失败" }, 500);
      }
    }

    // 检查是否有所需权限或超级管理员权限(*表示所有权限)
    if (
      Array.isArray(permissions) &&
      (permissions.includes(permission) || permissions.includes("*"))
    ) {
      await next();
    } else {
      logger.warn(`用户${user.id}尝试访问无权限的资源: ${permission}`);
      return c.json({ code: 403, message: "权限不足" }, 403);
    }
  };
}

/**
 * 清除用户权限缓存
 * @param userId 用户ID
 */
export async function clearPermissionCache(userId: number): Promise<void> {
  await redisUtils.del(`permissions:${userId}`);
}
