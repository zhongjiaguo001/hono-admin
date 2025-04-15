// import { PrismaClient } from "@prisma/client";
// import * as bcrypt from "bcryptjs";

// const prisma = new PrismaClient();

// async function main() {
//   console.log("Start seeding ...");

//   const saltRounds = 10; // bcrypt 加盐轮数
//   const defaultPassword = "admin123"; // 设置一个初始密码
//   const salt = await bcrypt.genSalt(saltRounds);
//   const hashedPassword = await bcrypt.hash(defaultPassword, salt);

//   // 检查管理员用户是否已存在
//   const existingAdmin = await prisma.user.findUnique({
//     where: { username: "admin" },
//   });

//   if (!existingAdmin) {
//     const adminUser = await prisma.user.create({
//       data: {
//         username: "admin",
//         password: hashedPassword,
//         psalt: salt, // 存储盐值，虽然 bcrypt 推荐将盐直接包含在哈希中，但若依风格可能分开存储
//         nickname: "超级管理员",
//         email: "admin@example.com",
//         status: 1, // 1 表示正常
//         // 如果有默认角色或部门，可以在这里关联
//         // roles: { connect: { id: /* 默认角色ID */ } },
//         // dept: { connect: { id: /* 默认部门ID */ } },
//       },
//     });
//     console.log(`Created admin user with id: ${adminUser.id}`);
//   } else {
//     console.log("Admin user already exists.");
//   }

//   // 你可以在这里添加其他需要初始化的数据，例如默认角色、部门等

//   console.log("Seeding finished.");
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

// src/db/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { logger } from "@/utils/logger.utils";

const prisma = new PrismaClient();

/**
 * 创建超级管理员用户和基本权限数据
 */
async function main() {
  try {
    logger.info("开始初始化数据库...");

    // 1. 创建默认部门
    const dept = await prisma.dept.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: "总公司",
        orderNo: 1,
        mpath: "1",
      },
    });
    logger.info("✅ 默认部门创建成功");

    // 2. 创建超级管理员角色
    const adminRole = await prisma.role.upsert({
      where: { value: "admin" },
      update: {
        name: "超级管理员",
        remark: "系统内置超级管理员角色",
        status: 1,
        isDefault: true,
        orderNo: 1,
      },
      create: {
        name: "超级管理员",
        value: "admin",
        remark: "系统内置超级管理员角色",
        status: 1,
        isDefault: true,
        orderNo: 1,
      },
    });
    logger.info("✅ 超级管理员角色创建成功");

    // 3. 创建基础菜单
    const systemMenu = await prisma.menu.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        parentId: null,
        name: "系统管理",
        path: "/system",
        component: "LAYOUT",
        permission: "system",
        type: 0, // 目录
        icon: "SettingOutlined",
        orderNo: 1,
        show: 1,
        status: 1,
      },
    });

    const userMenu = await prisma.menu.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        parentId: 1,
        name: "用户管理",
        path: "/system/user",
        component: "/system/user/index",
        permission: "system:user:list",
        type: 1, // 菜单
        icon: "UserOutlined",
        orderNo: 1,
        show: 1,
        status: 1,
      },
    });

    // 用户管理按钮权限
    const userBtns = [
      {
        id: 3,
        parentId: 2,
        name: "用户查询",
        permission: "system:user:query",
        type: 2,
      },
      {
        id: 4,
        parentId: 2,
        name: "用户新增",
        permission: "system:user:add",
        type: 2,
      },
      {
        id: 5,
        parentId: 2,
        name: "用户修改",
        permission: "system:user:update",
        type: 2,
      },
      {
        id: 6,
        parentId: 2,
        name: "用户删除",
        permission: "system:user:delete",
        type: 2,
      },
      {
        id: 7,
        parentId: 2,
        name: "用户导出",
        permission: "system:user:export",
        type: 2,
      },
      {
        id: 8,
        parentId: 2,
        name: "重置密码",
        permission: "system:user:resetPwd",
        type: 2,
      },
    ];

    for (const btn of userBtns) {
      await prisma.menu.upsert({
        where: { id: btn.id },
        update: {},
        create: {
          id: btn.id,
          parentId: btn.parentId,
          name: btn.name,
          permission: btn.permission,
          type: btn.type,
          orderNo: 1,
          show: 1,
          status: 1,
        },
      });
    }

    logger.info("✅ 基础菜单和权限创建成功");

    // 4. 关联角色和菜单权限(所有菜单)
    const allMenus = await prisma.menu.findMany();
    const menuIds = allMenus.map((menu) => menu.id);

    // 删除现有关联
    await prisma.roleMenu.deleteMany({
      where: { roleId: adminRole.id },
    });

    // 创建新关联
    for (const menuId of menuIds) {
      await prisma.roleMenu.create({
        data: {
          roleId: adminRole.id,
          menuId: menuId,
        },
      });
    }

    logger.info("✅ 角色菜单关联创建成功");

    // 5. 创建超级管理员用户
    // 生成密码盐和加密密码
    const psalt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash("admin123", psalt);

    const admin = await prisma.user.upsert({
      where: { username: "admin" },
      update: {},
      create: {
        username: "admin",
        password,
        psalt,
        nickname: "超级管理员",
        email: "admin@example.com",
        status: 1,
        deptId: dept.id,
      },
    });
    logger.info("✅ 超级管理员用户创建成功");

    // 6. 关联用户和角色
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: admin.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    });
    logger.info("✅ 用户角色关联创建成功");

    logger.info("🎉 数据库初始化完成!");
    logger.info("超级管理员账号: admin");
    logger.info("超级管理员密码: admin123");
  } catch (error) {
    logger.error("数据库初始化失败:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行种子脚本
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error("种子脚本执行错误:", error);
    process.exit(1);
  });
