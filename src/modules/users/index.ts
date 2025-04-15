import { Hono } from "hono";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/db/prisma"; // 导入 Prisma 实例
import { authMiddleware } from "@/middleware/auth"; // 修正 middleware 路径
import {
  createUserSchema,
  updateUserSchema,
  toggleUserStatusSchema,
  resetPasswordSchema,
  assignRolesSchema,
} from "./validation";
import { zValidator } from "@/middleware/validtor-wrapper"; // 修正 middleware 路径
import { QueryBuilder } from "@/utils/query";

const users = new Hono();
users.use("*", authMiddleware);

// 新增接口
users.post("/", zValidator("json", createUserSchema), async (c) => {
  try {
    const data = c.req.valid("json"); // 获取验证后的数据

    // 检查用户名是否已存在 (可选，但推荐)
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existingUser) {
      return c.json(
        {
          code: 409, // Conflict
          message: "用户名已存在",
        },
        409
      );
    }

    // 生成密码盐并哈希密码
    const saltRounds = 10; // 哈希轮数
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // 创建用户
    const newUser = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        psalt: salt,
        nickname: data.nickname,
        email: data.email,
        phone: data.phone,
        // status 默认为 1
      },
      // 只选择需要的字段返回，避免泄露密码和盐
      select: {
        id: true,
        username: true,
        nickname: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log("User created:", newUser);

    return c.json({
      code: 200,
      message: "新增用户成功",
      data: newUser,
    });
  } catch (error) {
    console.error("Create user error:", error);
    // 处理可能的 Prisma 错误或其他异常
    return c.json(
      {
        code: 500,
        message: "创建用户失败，服务器内部错误",
      },
      500
    );
  }
});

// 获取用户列表
users.get("/", async (c) => {
  const query = c.req.query();
  const select = {
    id: true,
    username: true,
    nickname: true,
    email: true,
    phone: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    dept: {
      select: {
        id: true,
        name: true,
      },
    },
    roles: {
      select: {
        id: true,
        name: true,
      },
    },
  };

  const result = await QueryBuilder.paginate(prisma.user, query, {
    fuzzyFields: ["username", "nickname", "phone"],
    numberFields: ["status"],
    dateRangeFields: ["createdAt"],
    select,
    orderBy: { createdAt: "desc" },
  });

  return c.json({
    code: 200,
    message: "获取用户列表成功",
    data: result,
  });
});

// 删除用户（支持单个和批量删除）
users.delete("/:ids?", async (c) => {
  try {
    let ids: number[] = [];
    const idsParam = c.req.param("ids");

    if (idsParam) {
      // 将字符串转换为数字数组
      ids = idsParam
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));

      if (ids.length === 0) {
        return c.json(
          {
            code: 400,
            message: "无效的用户ID格式",
          },
          400
        );
      }
    } else {
      return c.json(
        {
          code: 400,
          message: "请选择要删除的用户",
        },
        400
      );
    }

    // 检查用户是否存在
    const userCount = await prisma.user.count({
      where: {
        id: { in: ids },
      },
    });

    if (userCount !== ids.length) {
      return c.json(
        {
          code: 400,
          message: "部分用户不存在",
        },
        400
      );
    }

    // 删除用户
    await prisma.user.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return c.json({
      code: 200,
      message: `成功删除${ids.length}个用户`,
    });
  } catch (error) {
    console.error("Delete users error:", error);
    return c.json(
      {
        code: 500,
        message: "删除用户失败，服务器内部错误",
      },
      500
    );
  }
});

// 分配角色
users.post("/:id/roles", zValidator("json", assignRolesSchema), async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const { roleIds } = c.req.valid("json");

    // 检查用户是否存在
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return c.json(
        {
          code: 404,
          message: "用户不存在",
        },
        404
      );
    }

    // 检查角色是否都存在
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    });

    if (roles.length !== roleIds.length) {
      return c.json(
        {
          code: 400,
          message: "部分角色不存在",
        },
        400
      );
    }

    // 更新用户角色
    await prisma.user.update({
      where: { id },
      data: {
        roles: {
          set: roleIds.map((roleId) => ({ id: roleId })),
        },
      },
    });

    return c.json({
      code: 200,
      message: "分配角色成功",
    });
  } catch (error) {
    console.error("Assign roles error:", error);
    return c.json(
      {
        code: 500,
        message: "分配角色失败",
      },
      500
    );
  }
});

// 切换用户状态
users.patch(
  "/:id/status",
  zValidator("json", toggleUserStatusSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const { status } = await c.req.valid("json");
      console.log(await c.req.valid("json"));

      // 检查用户是否存在
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return c.json(
          {
            code: 404,
            message: "用户不存在",
          },
          404
        );
      }

      // 更新用户状态
      await prisma.user.update({
        where: { id },
        data: { status },
      });

      return c.json({
        code: 200,
        message: status === 1 ? "用户已启用" : "用户已停用",
      });
    } catch (error) {
      console.error("Toggle user status error:", error);
      return c.json(
        {
          code: 500,
          message: "更新用户状态失败，服务器内部错误",
        },
        500
      );
    }
  }
);

// 重置用户密码
users.patch(
  "/:id/password",
  zValidator("json", resetPasswordSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const { newPassword } = await c.req.valid("json");

      // 检查用户是否存在
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return c.json(
          {
            code: 404,
            message: "用户不存在",
          },
          404
        );
      }

      // 生成新的密码盐和哈希密码
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // 更新用户密码
      await prisma.user.update({
        where: { id },
        data: {
          password: hashedPassword,
          psalt: salt,
        },
      });

      return c.json({
        code: 200,
        message: "密码重置成功",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      return c.json(
        {
          code: 500,
          message: "重置密码失败，服务器内部错误",
        },
        500
      );
    }
  }
);

// 编辑用户
users.put("/:id", zValidator("json", updateUserSchema), async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const data = await c.req.valid("json");

    // 过滤掉不允许更新的字段
    const { id: _, dept, roles, ...updateData } = data;

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return c.json(
        {
          code: 404,
          message: "用户不存在",
        },
        404
      );
    }

    // 如果要更新用户名，检查新用户名是否与其他用户重复
    if (updateData.username && updateData.username !== existingUser.username) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          username: updateData.username,
          id: { not: id }, // 排除当前用户
        },
      });

      if (duplicateUser) {
        return c.json(
          {
            code: 409,
            message: "用户名已存在",
          },
          409
        );
      }
    }

    // 构建更新数据
    const updateUserData = {
      ...updateData,
      // 处理部门关联
      deptId: data.dept ? data.dept.id : null,
      // 处理角色关联
      roles:
        data.roles && data.roles.length > 0
          ? {
              set: data.roles.map((role: { id: number }) => ({ id: role.id })),
            }
          : { set: [] },
    };

    // 更新用户信息
    await prisma.user.update({
      where: { id },
      data: updateUserData,
    });

    return c.json({
      code: 200,
      message: "编辑用户成功",
    });
  } catch (error) {
    console.error("Update user error:", error);
    return c.json(
      {
        code: 500,
        message: "更新用户失败，服务器内部错误",
      },
      500
    );
  }
});

export default users;
