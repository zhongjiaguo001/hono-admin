// src/modules/system/menu/menu.service.ts
import { prisma } from "@/db/prisma";
import { logger } from "@/utils/logger.utils";
import { redisUtils } from "@/utils/redis.utils";
import {
  CreateMenuDto,
  UpdateMenuDto,
  MenuQueryDto,
  MenuTypeEnum,
} from "./menu.schema";

export class MenuService {
  /**
   * 查询菜单列表
   */
  async findAll(query: MenuQueryDto = {}) {
    try {
      // 构建查询条件
      const where: any = {};

      if (query.name) {
        where.name = { contains: query.name };
      }

      if (query.status !== undefined) {
        where.status = query.status;
      }

      if (query.type !== undefined) {
        where.type = query.type;
      }

      if (query.permission) {
        where.permission = { contains: query.permission };
      }

      if (query.path) {
        where.path = { contains: query.path };
      }

      // 查询所有菜单
      const menus = await prisma.menu.findMany({
        where,
        orderBy: [{ orderNo: "asc" }, { id: "asc" }],
      });

      return menus;
    } catch (error) {
      logger.error("查询菜单列表失败:", error);
      throw error;
    }
  }

  /**
   * 查询菜单树形列表
   */
  async findTree(query: MenuQueryDto = {}) {
    try {
      const menus = await this.findAll(query);
      return this.buildTree(menus);
    } catch (error) {
      logger.error("查询菜单树形列表失败:", error);
      throw error;
    }
  }

  /**
   * 创建菜单
   */
  async create(data: CreateMenuDto) {
    try {
      // 验证上级菜单类型
      if (data.parentId) {
        await this.validateParentMenu(data.parentId, data.type);
      }

      // 创建菜单
      const menu = await prisma.menu.create({
        data,
      });

      // 清除菜单缓存
      await this.clearMenuCache();

      return menu;
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
      // 检查菜单是否存在
      const menu = await prisma.menu.findUnique({
        where: { id },
      });

      if (!menu) {
        throw new Error("菜单不存在");
      }

      // 不能将菜单更改为自己的子菜单
      if (data.parentId === id) {
        throw new Error("上级菜单不能选择自己");
      }

      // 验证上级菜单类型
      if (data.parentId !== undefined && data.parentId !== menu.parentId) {
        // 检查是否将菜单改为其子菜单
        if (data.parentId) {
          const childMenus = await this.findChildMenus(id);
          if (childMenus.some((m) => m.id === data.parentId)) {
            throw new Error("上级菜单不能选择自己的子菜单");
          }

          // 验证上级菜单类型
          await this.validateParentMenu(data.parentId, data.type || menu.type);
        }
      }

      // 更新菜单
      const updatedMenu = await prisma.menu.update({
        where: { id },
        data,
      });

      // 清除菜单缓存
      await this.clearMenuCache();

      return updatedMenu;
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
        throw new Error("存在子菜单，不允许删除");
      }

      // 检查是否有角色关联
      const roleMenuCount = await prisma.roleMenu.count({
        where: { menuId: id },
      });

      if (roleMenuCount > 0) {
        throw new Error("菜单已被角色引用，不允许删除");
      }

      // 删除菜单
      await prisma.menu.delete({
        where: { id },
      });

      // 清除菜单缓存
      await this.clearMenuCache();

      return true;
    } catch (error) {
      logger.error("删除菜单失败:", error);
      throw error;
    }
  }

  /**
   * 查询菜单详情
   */
  async findById(id: number) {
    try {
      const menu = await prisma.menu.findUnique({
        where: { id },
      });

      if (!menu) {
        throw new Error("菜单不存在");
      }

      return menu;
    } catch (error) {
      logger.error("查询菜单详情失败:", error);
      throw error;
    }
  }

  /**
   * 获取菜单下拉树列表
   */
  async treeselect() {
    try {
      const menus = await prisma.menu.findMany({
        where: { status: 1 }, // 只查询正常状态的菜单
        orderBy: [{ orderNo: "asc" }, { id: "asc" }],
      });

      return this.buildTreeSelect(menus);
    } catch (error) {
      logger.error("获取菜单下拉树列表失败:", error);
      throw error;
    }
  }

  /**
   * 根据角色ID查询菜单树结构
   */
  async roleMenuTreeselect(roleId: number) {
    try {
      // 查询所有菜单
      const menus = await prisma.menu.findMany({
        where: { status: 1 }, // 只查询正常状态的菜单
        orderBy: [{ orderNo: "asc" }, { id: "asc" }],
      });

      // 查询角色已有菜单
      const roleMenus = await prisma.roleMenu.findMany({
        where: { roleId },
        select: { menuId: true },
      });

      const checkedKeys = roleMenus.map((rm) => rm.menuId);

      return {
        menus: this.buildTreeSelect(menus),
        checkedKeys,
      };
    } catch (error) {
      logger.error("根据角色ID查询菜单树结构失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户菜单列表
   */
  async getUserMenus(userId: number) {
    try {
      // 从缓存获取用户菜单
      const cacheKey = `user:${userId}:menus`;
      const cachedMenus = await redisUtils.get(cacheKey, true);

      if (cachedMenus) {
        return cachedMenus;
      }

      // 查询用户角色
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
          role: true,
        },
      });

      // 检查是否有超级管理员角色
      const isAdmin = userRoles.some((ur) => ur.role.key === "admin");

      // 获取菜单
      let menus;
      if (isAdmin) {
        // 超级管理员可以访问所有菜单
        menus = await prisma.menu.findMany({
          where: {
            status: 1, // 只查询正常状态的菜单
            type: { in: [0, 1] }, // 只获取目录(0)和菜单(1)，不包括按钮(2)
          },
          orderBy: [{ orderNo: "asc" }, { id: "asc" }],
        });
      } else {
        // 普通用户根据角色获取菜单
        const roleIds = userRoles.map((ur) => ur.role.id);

        // 查询角色菜单
        const roleMenus = await prisma.roleMenu.findMany({
          where: { roleId: { in: roleIds } },
          select: { menuId: true },
        });

        const menuIds = [...new Set(roleMenus.map((rm) => rm.menuId))];

        menus = await prisma.menu.findMany({
          where: {
            id: { in: menuIds },
            status: 1, // 只查询正常状态的菜单
            type: { in: [0, 1] }, // 只获取目录(0)和菜单(1)，不包括按钮(2)
          },
          orderBy: [{ orderNo: "asc" }, { id: "asc" }],
        });
      }

      // 构建树形结构
      const menuTree = this.buildTree(menus);

      // 缓存用户菜单，有效期1小时
      await redisUtils.set(cacheKey, menuTree, 3600);

      return menuTree;
    } catch (error) {
      logger.error("获取用户菜单列表失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户权限列表
   */
  async getUserPermissions(userId: number) {
    try {
      // 从缓存获取用户权限
      const cacheKey = `user:${userId}:permissions`;
      const cachedPermissions = await redisUtils.get(cacheKey, true);

      if (cachedPermissions) {
        return cachedPermissions;
      }

      // 查询用户角色
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
          role: true,
        },
      });

      // 检查是否有超级管理员角色
      const isAdmin = userRoles.some((ur) => ur.role.key === "admin");

      let permissions: string[] = [];

      if (isAdmin) {
        // 超级管理员拥有所有权限
        permissions = ["*"];
      } else {
        // 普通用户根据角色获取权限
        const roleIds = userRoles.map((ur) => ur.role.id);

        // 查询角色菜单
        const roleMenus = await prisma.roleMenu.findMany({
          where: { roleId: { in: roleIds } },
          include: {
            menu: {
              select: {
                permission: true,
              },
            },
          },
        });

        // 提取权限标识并过滤掉空值
        permissions = roleMenus
          .map((rm) => rm.menu.permission)
          .filter(Boolean) as string[];

        // 去重
        permissions = [...new Set(permissions)];
      }

      // 缓存用户权限，有效期1小时
      await redisUtils.set(cacheKey, permissions, 3600);

      return permissions;
    } catch (error) {
      logger.error("获取用户权限列表失败:", error);
      throw error;
    }
  }

  /**
   * 构建树形结构
   */
  private buildTree(menus: any[], parentId: number | null = null) {
    const result: any[] = [];

    menus.forEach((menu) => {
      // 兼容parentId为null或0的情况
      if (
        (parentId === null &&
          (menu.parentId === null || menu.parentId === 0)) ||
        menu.parentId === parentId
      ) {
        const node = { ...menu };

        // 递归构建子菜单
        const children = this.buildTree(menus, menu.id);
        if (children.length > 0) {
          node.children = children;
        }

        result.push(node);
      }
    });

    return result;
  }

  /**
   * 构建下拉树结构
   */
  private buildTreeSelect(menus: any[]) {
    return this.buildTree(
      menus.map((menu) => ({
        ...menu,
        label: menu.name,
        value: menu.id,
      }))
    );
  }

  /**
   * 查找所有子菜单
   */
  private async findChildMenus(menuId: number) {
    const allMenus = await prisma.menu.findMany();
    const result: any[] = [];

    // 递归查找子菜单
    const findChildren = (pid: number) => {
      const children = allMenus.filter((m) => m.parentId === pid);
      if (children.length > 0) {
        result.push(...children);
        children.forEach((child) => findChildren(child.id));
      }
    };

    findChildren(menuId);
    return result;
  }

  /**
   * 验证上级菜单类型
   */
  private async validateParentMenu(parentId: number, type: number) {
    // 查询上级菜单
    const parentMenu = await prisma.menu.findUnique({
      where: { id: parentId },
    });

    if (!parentMenu) {
      throw new Error("上级菜单不存在");
    }

    // 目录类型只能选择顶级菜单或者目录类型
    if (
      type === MenuTypeEnum.DIRECTORY &&
      parentMenu.type !== MenuTypeEnum.DIRECTORY
    ) {
      throw new Error("目录类型的菜单上级只能是目录类型");
    }

    // 菜单类型只能选择目录类型
    if (
      type === MenuTypeEnum.MENU &&
      parentMenu.type !== MenuTypeEnum.DIRECTORY
    ) {
      throw new Error("菜单类型的菜单上级只能是目录类型");
    }

    // 按钮类型只能选择菜单类型
    if (type === MenuTypeEnum.BUTTON && parentMenu.type !== MenuTypeEnum.MENU) {
      throw new Error("按钮类型的菜单上级只能是菜单类型");
    }
  }

  /**
   * 清除菜单缓存
   */
  private async clearMenuCache() {
    try {
      // 查询所有用户
      const users = await prisma.user.findMany({
        select: { id: true },
      });

      // 清除所有用户的菜单和权限缓存
      for (const user of users) {
        await redisUtils.del(`user:${user.id}:menus`);
        await redisUtils.del(`user:${user.id}:permissions`);
      }
    } catch (error) {
      logger.error("清除菜单缓存失败:", error);
      // 不抛出异常，避免影响主业务
    }
  }
}
