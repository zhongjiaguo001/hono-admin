import { Hono } from "hono";
import { zValidator } from "@/middleware/validtor-wrapper";
import { PrismaClient } from "@prisma/client";
import {
  createMenuSchema,
  updateMenuSchema,
  assignMenusSchema,
} from "./validation";
import { QueryBuilder } from "@/utils/query";
import { authMiddleware } from "@/middleware/auth";

const menus = new Hono();
const prisma = new PrismaClient();

// 使用认证中间件
menus.use("*", authMiddleware);

// 获取菜单列表
menus.get("/", async (c) => {
  try {
    // 获取查询参数
    const query = c.req.query();

    // 使用QueryBuilder.paginate方法进行分页查询
    const result = await QueryBuilder.paginate(prisma.menu, query, {
      fuzzyFields: ["name", "path", "component", "permission"],
      numberFields: ["status", "type"],
      dateRangeFields: ["createdAt", "updatedAt"],
      orderBy: [{ orderNo: "asc" }, { id: "asc" }],
    });

    return c.json({
      code: 200,
      message: "获取菜单列表成功",
      data: result,
    });
  } catch (error) {
    console.error("Get menus error:", error);
    return c.json(
      {
        code: 500,
        message: "获取菜单列表失败",
      },
      500
    );
  }
});

// 获取菜单树形结构
menus.get("/tree", async (c) => {
  try {
    // 获取所有菜单
    const allMenus = await prisma.menu.findMany({
      orderBy: [
        {
          orderNo: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

    // 构建树形结构
    const buildTree = (parentId: number | null = null) => {
      return allMenus
        .filter((menu) => menu.parentId === parentId)
        .map((menu) => {
          const children = buildTree(menu.id);
          return {
            ...menu,
            children: children.length > 0 ? children : undefined,
          };
        });
    };

    const menuTree = buildTree();

    return c.json({
      code: 200,
      message: "获取菜单树形结构成功",
      data: menuTree,
    });
  } catch (error) {
    console.error("Get menu tree error:", error);
    return c.json(
      {
        code: 500,
        message: "获取菜单树形结构失败",
      },
      500
    );
  }
});

// 创建菜单
menus.post("/", zValidator("json", createMenuSchema), async (c) => {
  try {
    const data = c.req.valid("json");

    // 如果有父菜单ID，检查父菜单是否存在
    if (data.parentId) {
      const parentMenu = await prisma.menu.findUnique({
        where: { id: data.parentId },
      });

      if (!parentMenu) {
        return c.json(
          {
            code: 400,
            message: "父菜单不存在",
          },
          400
        );
      }
    }

    // 创建菜单
    const menu = await prisma.menu.create({
      data,
    });

    return c.json({
      code: 200,
      data: menu,
      message: "创建菜单成功",
    });
  } catch (error) {
    console.error("Create menu error:", error);
    return c.json(
      {
        code: 500,
        message: "创建菜单失败",
      },
      500
    );
  }
});

// 更新菜单
menus.put("/:id", zValidator("json", updateMenuSchema), async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const data = c.req.valid("json");

    // 检查菜单是否存在
    const menu = await prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      return c.json(
        {
          code: 404,
          message: "菜单不存在",
        },
        404
      );
    }

    // 如果有父菜单ID，检查父菜单是否存在
    if (data.parentId) {
      // 不能将自己设为自己的父菜单
      if (data.parentId === id) {
        return c.json(
          {
            code: 400,
            message: "不能将菜单设为自己的父菜单",
          },
          400
        );
      }

      const parentMenu = await prisma.menu.findUnique({
        where: { id: data.parentId },
      });

      if (!parentMenu) {
        return c.json(
          {
            code: 400,
            message: "父菜单不存在",
          },
          400
        );
      }

      // 检查是否会形成循环引用
      let currentParentId = parentMenu.parentId;
      while (currentParentId) {
        if (currentParentId === id) {
          return c.json(
            {
              code: 400,
              message: "不能将子菜单设为父菜单，会形成循环引用",
            },
            400
          );
        }

        const parent = await prisma.menu.findUnique({
          where: { id: currentParentId },
        });
        if (!parent) break;
        currentParentId = parent.parentId;
      }
    }

    // 更新菜单
    const updatedMenu = await prisma.menu.update({
      where: { id },
      data,
    });

    return c.json({
      code: 200,
      data: updatedMenu,
      message: "更新菜单成功",
    });
  } catch (error) {
    console.error("Update menu error:", error);
    return c.json(
      {
        code: 500,
        message: "更新菜单失败",
      },
      500
    );
  }
});

// 删除菜单
menus.delete("/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));

    // 检查菜单是否存在
    const menu = await prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      return c.json(
        {
          code: 404,
          message: "菜单不存在",
        },
        404
      );
    }

    // 检查是否有子菜单
    const childMenus = await prisma.menu.findMany({
      where: { parentId: id },
    });

    if (childMenus.length > 0) {
      return c.json(
        {
          code: 400,
          message: "该菜单下有子菜单，不能删除",
        },
        400
      );
    }

    // 删除菜单
    await prisma.menu.delete({ where: { id } });

    return c.json({
      code: 200,
      message: "删除菜单成功",
    });
  } catch (error) {
    console.error("Delete menu error:", error);
    return c.json(
      {
        code: 500,
        message: "删除菜单失败",
      },
      500
    );
  }
});

// 获取角色的菜单权限
menus.get("/role/:roleId", async (c) => {
  try {
    const roleId = Number(c.req.param("roleId"));

    // 检查角色是否存在
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { menus: true },
    });

    if (!role) {
      return c.json(
        {
          code: 404,
          message: "角色不存在",
        },
        404
      );
    }

    // 获取角色的菜单ID列表
    const menuIds = role.menus.map((menu) => menu.id);

    return c.json({
      code: 200,
      data: menuIds,
      message: "获取角色菜单权限成功",
    });
  } catch (error) {
    console.error("Get role menus error:", error);
    return c.json(
      {
        code: 500,
        message: "获取角色菜单权限失败",
      },
      500
    );
  }
});

// 为角色分配菜单权限
menus.post(
  "/role/:roleId",
  zValidator("json", assignMenusSchema),
  async (c) => {
    try {
      const roleId = Number(c.req.param("roleId"));
      const { menuIds } = c.req.valid("json");

      // 检查角色是否存在
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        return c.json(
          {
            code: 404,
            message: "角色不存在",
          },
          404
        );
      }

      // 检查菜单是否都存在
      const menus = await prisma.menu.findMany({
        where: {
          id: {
            in: menuIds,
          },
        },
      });

      if (menus.length !== menuIds.length) {
        return c.json(
          {
            code: 400,
            message: "存在无效的菜单ID",
          },
          400
        );
      }

      // 更新角色的菜单权限
      await prisma.role.update({
        where: { id: roleId },
        data: {
          menus: {
            set: menuIds.map((id) => ({ id })),
          },
        },
      });

      return c.json({
        code: 200,
        message: "分配菜单权限成功",
      });
    } catch (error) {
      console.error("Assign menus to role error:", error);
      return c.json(
        {
          code: 500,
          message: "分配菜单权限失败",
        },
        500
      );
    }
  }
);

export default menus;
