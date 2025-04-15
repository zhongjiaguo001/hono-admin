import { Hono } from "hono";
import { zValidator } from "@/middleware/validtor-wrapper";
import { PrismaClient } from "@prisma/client";
import { createRoleSchema, updateRoleSchema } from "./validation";
import { QueryBuilder } from "@/utils/query";
import { format } from "date-fns";
import { authMiddleware } from "@/middleware/auth";

const roles = new Hono();
const prisma = new PrismaClient();

// 使用认证中间件
roles.use("*", authMiddleware);

// 获取角色列表
roles.get("/", async (c) => {
  try {
    // 获取查询参数
    const query = c.req.query();

    // 使用QueryBuilder.paginate方法进行分页查询
    const result = await QueryBuilder.paginate(prisma.role, query, {
      fuzzyFields: ["name", "value"],
      numberFields: ["status"],
      dateRangeFields: ["createdAt", "updatedAt"], // 添加时间筛选字段
      orderBy: [{ orderNo: "asc" }, { id: "desc" }],
    });

    return c.json({
      code: 200,
      message: "获取角色列表成功",
      data: result,
    });
  } catch (error) {
    console.error("Get roles error:", error);
    return c.json(
      {
        code: 500,
        message: "获取角色列表失败",
      },
      500
    );
  }
});

// 创建角色
roles.post("/", zValidator("json", createRoleSchema), async (c) => {
  try {
    const {
      name,
      value,
      remark,
      status = 1,
      isDefault = false,
      orderNo = 1,
    } = c.req.valid("json");

    // 检查角色名称是否已存在
    const existingRole = await prisma.role.findFirst({
      where: {
        OR: [{ name }, { value }],
      },
    });

    if (existingRole) {
      return c.json(
        {
          code: 400,
          message: "角色名称或标识已存在",
        },
        400
      );
    }

    // 创建角色
    const role = await prisma.role.create({
      data: {
        name,
        value,
        remark,
        status,
        isDefault,
        orderNo,
      },
    });

    return c.json({
      code: 200,
      data: role,
      message: "创建角色成功",
    });
  } catch (error) {
    console.error("Create role error:", error);
    return c.json(
      {
        code: 500,
        message: "创建角色失败",
      },
      500
    );
  }
});

// 更新角色
roles.put("/:id", zValidator("json", updateRoleSchema), async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const { name, value, remark, status, isDefault, orderNo } =
      c.req.valid("json");

    // 检查角色是否存在
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return c.json(
        {
          code: 404,
          message: "角色不存在",
        },
        404
      );
    }

    // 检查名称是否重复
    const existingRole = await prisma.role.findFirst({
      where: {
        OR: [{ name }, { value }],
        NOT: { id },
      },
    });

    if (existingRole) {
      return c.json(
        {
          code: 400,
          message: "角色名称或标识已存在",
        },
        400
      );
    }

    // 更新角色
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name,
        value,
        remark,
        status,
        isDefault,
        orderNo,
      },
    });

    return c.json({
      code: 200,
      data: updatedRole,
      message: "更新角色成功",
    });
  } catch (error) {
    console.error("Update role error:", error);
    return c.json(
      {
        code: 500,
        message: "更新角色失败",
      },
      500
    );
  }
});

// 删除角色
roles.delete("/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));

    // 检查角色是否存在
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return c.json(
        {
          code: 404,
          message: "角色不存在",
        },
        404
      );
    }

    // 删除角色
    await prisma.role.delete({ where: { id } });

    return c.json({
      code: 200,
      message: "删除角色成功",
    });
  } catch (error) {
    console.error("Delete role error:", error);
    return c.json(
      {
        code: 500,
        message: "删除角色失败",
      },
      500
    );
  }
});

export default roles;
