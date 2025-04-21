// src/modules/system/menu/menu.service.ts
import { prisma } from "@/db/prisma";
import { logger } from "@/utils/logger.utils";
import { redisUtils } from "@/utils/redis.utils";
import { CreateMenuDto, UpdateMenuDto, MenuQueryDto } from "./menu.schema";

export class MenuService {
  /**
   * 创建菜单
   */
  async create(data: CreateMenuDto) {
    try {
      return await prisma.menu.create({
        data,
      });
    } catch (error) {
      logger.error("创建菜单失败:", error);
      throw error;
    }
  }

  /**
   * 更新菜单
   */
  async update(id: number, data: UpdateMenuDto) {
    try {
      const result = await prisma.menu.update({
        where: { id },
        data,
      });

      // 清除相关缓存
      await this.clearMenuCache();

      return result;
    } catch (error) {
      logger.error("更新菜单失败:", error);
      throw error;
    }
  }

  /**
   * 删除菜单
   */
  async delete(id: number) {
    try {
      // 检查是否有子菜单
      const childCount = await prisma.menu.count({
        where: { parentId: id },
      });

      if (childCount > 0) {
        throw new Error("该菜单下存在子菜单，无法删除");
      }

      // 检查是否有角色关联
      const roleMenuCount = await prisma.roleMenu.count({
        where: { menuId: id },
      });

      if (roleMenuCount > 0) {
        throw new Error("该菜单已被角色引用，无法删除");
      }

      const result = await prisma.menu.delete({
        where: { id },
      });

      // 清除相关缓存
      await this.clearMenuCache();

      return result;
    } catch (error) {
      logger.error("删除菜单失败:", error);
      throw error;
    }
  }

  /**
   * 查询菜单树
   */
  async findTree(query: MenuQueryDto) {
    try {
      const where: any = {};

      if (query.name) {
        where.name = { contains: query.name };
      }

      if (query.path) {
        where.path = { contains: query.path };
      }

      if (query.permission) {
        where.permission = { contains: query.permission };
      }

      if (query.type !== undefined) {
        where.type = query.type;
      }

      if (query.status !== undefined) {
        where.status = query.status;
      }

      // 查询所有菜单
      const menus = await prisma.menu.findMany({
        where,
        orderBy: { orderNo: "asc" },
      });

      // 构建树结构
      return this.buildTree(menus);
    } catch (error) {
      logger.error("查询菜单树失败:", error);
      throw error;
    }
  }

  /**
   * 查询菜单详情
   */
  async findById(id: number) {
    try {
      return await prisma.menu.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error("查询菜单详情失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户菜单权限
   */
  async getUserMenus(userId: number) {
    try {
      // 从缓存获取用户菜单
      const cacheKey = `user:${userId}:menus`;
      const cachedMenus = await redisUtils.get(cacheKey, true);

      if (cachedMenus) {
        return cachedMenus;
      }

      // 获取用户角色
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        select: { roleId: true },
      });

      const roleIds = userRoles.map((ur) => ur.roleId);

      // 如果用户没有角色，返回空数组
      if (roleIds.length === 0) {
        return [];
      }

      // 获取角色菜单
      const roleMenus = await prisma.roleMenu.findMany({
        where: { roleId: { in: roleIds } },
        select: { menuId: true },
      });

      const menuIds = [...new Set(roleMenus.map((rm) => rm.menuId))];

      // 获取菜单信息
      const menus = await prisma.menu.findMany({
        where: {
          id: { in: menuIds },
          status: 1, // 只获取启用的菜单
        },
        orderBy: { orderNo: "asc" },
      });

      // 构建菜单树
      const menuTree = this.buildTree(menus);

      // 缓存用户菜单，有效期1小时
      await redisUtils.set(cacheKey, menuTree, 3600);

      return menuTree;
    } catch (error) {
      logger.error("获取用户菜单失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户权限标识
   */
  async getUserPermissions(userId: number) {
    try {
      // 从缓存获取用户权限
      const cacheKey = `user:${userId}:permissions`;
      const cachedPermissions = await redisUtils.get(cacheKey, true);

      if (cachedPermissions) {
        return cachedPermissions;
      }

      // 获取用户角色
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        select: { roleId: true },
      });

      const roleIds = userRoles.map((ur) => ur.roleId);

      // 如果用户没有角色，返回空数组
      if (roleIds.length === 0) {
        return [];
      }

      // 获取角色菜单
      const roleMenus = await prisma.roleMenu.findMany({
        where: { roleId: { in: roleIds } },
        include: { menu: true },
      });

      // 提取权限标识
      const permissions = roleMenus
        .map((rm) => rm.menu.permission)
        .filter(Boolean);

      // 权限去重
      const uniquePermissions = [...new Set(permissions)];

      // 缓存用户权限，有效期1小时
      await redisUtils.set(cacheKey, uniquePermissions, 3600);

      return uniquePermissions;
    } catch (error) {
      logger.error("获取用户权限失败:", error);
      throw error;
    }
  }

  /**
   * 构建树结构
   */
  private buildTree(menus: any[]) {
    const menuMap = new Map();
    const result: any[] = [];

    // 创建映射
    menus.forEach((menu) => {
      menuMap.set(menu.id, { ...menu, children: [] });
    });

    // 构建树
    menus.forEach((menu) => {
      const node = menuMap.get(menu.id);

      if (menu.parentId === null) {
        // 根节点
        result.push(node);
      } else {
        // 子节点，添加到父节点的children
        const parent = menuMap.get(menu.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    // 清理空的children数组
    this.cleanupEmptyChildren(result);

    return result;
  }

  /**
   * 清理空的children数组
   */
  private cleanupEmptyChildren(nodes: any[]) {
    nodes.forEach((node) => {
      if (node.children.length === 0) {
        delete node.children;
      } else {
        this.cleanupEmptyChildren(node.children);
      }
    });
  }

  /**
   * 清除菜单相关缓存
   */
  async clearMenuCache() {
    try {
      // 清除所有用户的菜单和权限缓存
      const userMenuKeys = await redisUtils.execute("KEYS", "user:*:menus");
      const userPermKeys = await redisUtils.execute(
        "KEYS",
        "user:*:permissions"
      );

      if (userMenuKeys.length > 0) {
        await redisUtils.del(userMenuKeys);
      }

      if (userPermKeys.length > 0) {
        await redisUtils.del(userPermKeys);
      }
    } catch (error) {
      logger.error("清除菜单缓存失败:", error);
      throw error;
    }
  }
}
