import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding ...");

  const saltRounds = 10; // bcrypt 加盐轮数
  const defaultPassword = "admin123"; // 设置一个初始密码
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(defaultPassword, salt);

  // 检查管理员用户是否已存在
  const existingAdmin = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (!existingAdmin) {
    const adminUser = await prisma.user.create({
      data: {
        username: "admin",
        password: hashedPassword,
        psalt: salt, // 存储盐值，虽然 bcrypt 推荐将盐直接包含在哈希中，但若依风格可能分开存储
        nickname: "超级管理员",
        email: "admin@example.com",
        status: 1, // 1 表示正常
        // 如果有默认角色或部门，可以在这里关联
        // roles: { connect: { id: /* 默认角色ID */ } },
        // dept: { connect: { id: /* 默认部门ID */ } },
      },
    });
    console.log(`Created admin user with id: ${adminUser.id}`);
  } else {
    console.log("Admin user already exists.");
  }

  // 你可以在这里添加其他需要初始化的数据，例如默认角色、部门等

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
