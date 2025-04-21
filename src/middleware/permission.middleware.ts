import { Context, Next } from "hono";
import { redisUtils } from "@/utils/redis.utils";
import { logger } from "@/utils/logger.utils";
import { prisma } from "@/db/prisma";

/**
 * 权限检查中间件
 * @param requiredPermission 要求的权限标识（如 'system:user:list'）
 */
export function requirePermission(requiredPermission: string) {
  return async (c: Context, next: Next) => {
    // 1. 确保已有 Authentication 中间件设置了 user
    const user = c.get("user");
    if (!user) {
      return c.json({ code: 401, message: "未授权访问" }, 401);
    }

    // 2. 从缓存读取
    const cacheKey = `user:${user.id}:permissions`;
    let permissions: string[] | null = null;
    try {
      const cached = await redisUtils.get(cacheKey);
      if (cached) {
        // 缓存中存储的是 JSON 字符串
        permissions = JSON.parse(cached) as string[];
      }
    } catch (err) {
      logger.warn(`解析权限缓存失败，Key=${cacheKey}，Error=`, err);
      // 解析失败时当作缓存未命中，继续走数据库查询
      permissions = null;
    }

    // 3. 缓存未命中或格式异常，查询数据库
    if (!Array.isArray(permissions)) {
      try {
        // 3.1 查询用户的角色以及角色对应的菜单权限
        const userRoles = await prisma.userRole.findMany({
          where: { userId: user.id },
          include: {
            role: {
              include: {
                roleMenus: {
                  include: { menu: true },
                },
              },
            },
          },
        });

        // 3.2 检查是否有超级管理员角色
        const isAdmin = userRoles.some((ur) => ur.role.key === "admin");

        // 3.3 扁平化提取所有 permission 字段，过滤空值并去重
        const permsSet = new Set<string>();
        // 如果是超级管理员，添加特殊标识
        if (isAdmin) {
          permsSet.add("*");
        }

        userRoles.forEach((ur) => {
          ur.role.roleMenus.forEach((rm) => {
            if (rm.menu.permission) {
              permsSet.add(rm.menu.permission);
            }
          });
        });
        permissions = Array.from(permsSet);

        // 3.4 写入缓存（JSON 字符串），过期时间 1 小时
        await redisUtils.set(cacheKey, JSON.stringify(permissions), 3600);
      } catch (error) {
        logger.error("获取用户权限失败:", error);
        return c.json({ code: 500, message: "获取权限失败" }, 500);
      }
    }

    // 4. 权限校验：包含指定权限或超级管理员通配符 '*'
    const hasPerm =
      permissions.includes(requiredPermission) || permissions.includes("*");
    if (!hasPerm) {
      logger.warn(
        `用户 ${
          user.id
        } 无权限访问资源 [${requiredPermission}]，当前权限：${permissions.join(
          ","
        )}`
      );
      return c.json({ code: 403, message: "权限不足" }, 403);
    }

    // 5. 放行
    await next();
  };
}

/**
 * 清除用户权限缓存
 * @param userId 用户 ID
 */
export async function clearPermissionCache(userId: number): Promise<void> {
  const cacheKey = `user:${userId}:permissions`;
  await redisUtils.del(cacheKey);
  logger.info(`已清除用户 ${userId} 的权限缓存，Key=${cacheKey}`);
}
