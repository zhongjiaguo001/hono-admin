// src/db/seed.ts
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { logger } from "@/utils/logger.utils";

const prisma = new PrismaClient();

/**
 * 创建初始数据
 */
async function main() {
  try {
    logger.info("开始初始化数据库...");

    // 初始化部门数据
    await createDepts();
    logger.info("✅ 部门数据初始化完成");

    // 初始化岗位数据
    await createPosts();
    logger.info("✅ 岗位数据初始化完成");

    // 初始化角色数据
    await createRoles();
    logger.info("✅ 角色数据初始化完成");

    // 初始化菜单数据
    await createMenus();
    logger.info("✅ 菜单数据初始化完成");

    // 初始化用户数据
    await createUsers();
    logger.info("✅ 用户数据初始化完成");

    // 初始化用户角色关联
    await createUserRoles();
    logger.info("✅ 用户角色关联初始化完成");

    // 初始化角色菜单关联
    await createRoleMenus();
    logger.info("✅ 角色菜单关联初始化完成");

    // 初始化角色部门关联
    await createRoleDepts();
    logger.info("✅ 角色部门关联初始化完成");

    // 初始化用户岗位关联
    await createUserPosts();
    logger.info("✅ 用户岗位关联初始化完成");

    // 初始化字典类型数据
    await createDictTypes();
    logger.info("✅ 字典类型数据初始化完成");

    // 初始化字典数据
    await createDictData();
    logger.info("✅ 字典数据初始化完成");

    // 初始化系统配置
    await createConfigs();
    logger.info("✅ 系统配置初始化完成");

    // 初始化通知公告
    await createNotices();
    logger.info("✅ 通知公告初始化完成");

    // 初始化定时任务
    // await createJobs();
    logger.info("✅ 定时任务初始化完成");

    logger.info("🎉 数据库初始化完成!");
    logger.info("管理员账号: admin");
    logger.info("管理员密码: admin123");
  } catch (error) {
    logger.error("数据库初始化失败:", error);
    process.exit(1);
  }
}

/**
 * 创建部门数据
 */
/**
 * 创建部门数据
 */
async function createDepts() {
  try {
    // 先创建没有父部门的记录
    await prisma.dept.create({
      data: {
        id: 100,
        parentId: null, // 设置为null，而不是0
        ancestors: "0",
        name: "集团总公司",
        orderNo: 0,
        leader: "年糕",
        phone: "15888888888",
        email: "niangao@qq.com",
        status: "0",
        delFlag: "0",
        createBy: "admin",
        createdAt: new Date(),
      },
    });

    // 然后创建直接引用总公司的记录
    await prisma.dept.createMany({
      skipDuplicates: true,
      data: [
        {
          id: 101,
          parentId: 100,
          ancestors: "0,100",
          name: "深圳分公司",
          orderNo: 1,
          leader: "年糕",
          phone: "15888888888",
          email: "niangao@qq.com",
          status: "0",
          delFlag: "0",
          createBy: "admin",
          createdAt: new Date(),
        },
        {
          id: 102,
          parentId: 100,
          ancestors: "0,100",
          name: "长沙分公司",
          orderNo: 2,
          leader: "年糕",
          phone: "15888888888",
          email: "niangao@qq.com",
          status: "0",
          delFlag: "0",
          createBy: "admin",
          createdAt: new Date(),
        },
      ],
    });

    // 最后创建引用二级公司的记录
    await prisma.dept.createMany({
      skipDuplicates: true,
      data: [
        {
          id: 103,
          parentId: 101,
          ancestors: "0,100,101",
          name: "研发部门",
          orderNo: 1,
          leader: "年糕",
          phone: "15888888888",
          email: "niangao@qq.com",
          status: "0",
          delFlag: "0",
          createBy: "admin",
          createdAt: new Date(),
        },
        {
          id: 104,
          parentId: 101,
          ancestors: "0,100,101",
          name: "市场部门",
          orderNo: 2,
          leader: "年糕",
          phone: "15888888888",
          email: "niangao@qq.com",
          status: "0",
          delFlag: "0",
          createBy: "admin",
          createdAt: new Date(),
        },
        {
          id: 105,
          parentId: 101,
          ancestors: "0,100,101",
          name: "测试部门",
          orderNo: 3,
          leader: "年糕",
          phone: "15888888888",
          email: "niangao@qq.com",
          status: "0",
          delFlag: "0",
          createBy: "admin",
          createdAt: new Date(),
        },
        {
          id: 106,
          parentId: 101,
          ancestors: "0,100,101",
          name: "财务部门",
          orderNo: 4,
          leader: "年糕",
          phone: "15888888888",
          email: "niangao@qq.com",
          status: "0",
          delFlag: "0",
          createBy: "admin",
          createdAt: new Date(),
        },
        {
          id: 107,
          parentId: 101,
          ancestors: "0,100,101",
          name: "运维部门",
          orderNo: 5,
          leader: "年糕",
          phone: "15888888888",
          email: "niangao@qq.com",
          status: "0",
          delFlag: "0",
          createBy: "admin",
          createdAt: new Date(),
        },
        {
          id: 108,
          parentId: 102,
          ancestors: "0,100,102",
          name: "市场部门",
          orderNo: 1,
          leader: "年糕",
          phone: "15888888888",
          email: "niangao@qq.com",
          status: "0",
          delFlag: "0",
          createBy: "admin",
          createdAt: new Date(),
        },
        {
          id: 109,
          parentId: 102,
          ancestors: "0,100,102",
          name: "财务部门",
          orderNo: 2,
          leader: "年糕",
          phone: "15888888888",
          email: "niangao@qq.com",
          status: "0",
          delFlag: "0",
          createBy: "admin",
          createdAt: new Date(),
        },
      ],
    });

    logger.info("✅ 部门数据初始化完成");
  } catch (error) {
    logger.error("创建部门数据失败:", error);
    throw error;
  }
}

/**
 * 创建岗位数据
 */
async function createPosts() {
  await prisma.post.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 1,
        code: "ceo",
        name: "董事长",
        sort: 1,
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
      },
      {
        id: 2,
        code: "se",
        name: "项目经理",
        sort: 2,
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
      },
      {
        id: 3,
        code: "hr",
        name: "人力资源",
        sort: 3,
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
      },
      {
        id: 4,
        code: "user",
        name: "普通员工",
        sort: 4,
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
      },
    ],
  });
}

/**
 * 创建角色数据
 */
async function createRoles() {
  await prisma.role.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 1,
        name: "超级管理员",
        key: "admin",
        orderNo: 1,
        dataScope: "1",
        menuCheckStrictly: 1,
        deptCheckStrictly: 1,
        status: "0",
        delFlag: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "超级管理员",
      },
      {
        id: 2,
        name: "普通角色",
        key: "common",
        orderNo: 2,
        dataScope: "2",
        menuCheckStrictly: 1,
        deptCheckStrictly: 1,
        status: "0",
        delFlag: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "普通角色",
      },
    ],
  });
}

/**
 * 创建菜单数据
 */
async function createMenus() {
  try {
    // 创建一级菜单
    for (const menu of [
      {
        id: 1,
        parentId: null, // 使用null而不是0
        path: "system",
        name: "系统管理",
        permission: "",
        type: 0,
        icon: "system",
        component: null,
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 1,
        createdAt: new Date(),
      },
      {
        id: 2,
        parentId: null, // 使用null而不是0
        path: "monitor",
        name: "系统监控",
        permission: "",
        type: 0,
        icon: "monitor",
        component: null,
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 2,
        createdAt: new Date(),
      },
      {
        id: 3,
        parentId: null, // 使用null而不是0
        path: "tool",
        name: "系统工具",
        permission: "",
        type: 0,
        icon: "tool",
        component: null,
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 3,
        createdAt: new Date(),
      },
      {
        id: 4,
        parentId: null, // 使用null而不是0
        path: "http://ruoyi.vip",
        name: "若依官网",
        permission: "",
        type: 0,
        icon: "guide",
        component: null,
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 1,
        extOpenMode: 1,
        orderNo: 4,
        createdAt: new Date(),
      },
    ]) {
      await prisma.menu.create({ data: menu });
    }

    logger.info("✅ 一级菜单创建完成");

    // 创建二级菜单
    for (const menu of [
      {
        id: 100,
        parentId: 1,
        path: "user",
        name: "用户管理",
        permission: "system:user:list",
        type: 1,
        icon: "user",
        component: "system/user/index",
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 1,
        createdAt: new Date(),
      },
      {
        id: 101,
        parentId: 1,
        path: "role",
        name: "角色管理",
        permission: "system:role:list",
        type: 1,
        icon: "peoples",
        component: "system/role/index",
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 2,
        createdAt: new Date(),
      },
      {
        id: 102,
        parentId: 1,
        path: "menu",
        name: "菜单管理",
        permission: "system:menu:list",
        type: 1,
        icon: "tree-table",
        component: "system/menu/index",
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 3,
        createdAt: new Date(),
      },
      {
        id: 103,
        parentId: 1,
        path: "dept",
        name: "部门管理",
        permission: "system:dept:list",
        type: 1,
        icon: "tree",
        component: "system/dept/index",
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 4,
        createdAt: new Date(),
      },
      {
        id: 104,
        parentId: 1,
        path: "post",
        name: "岗位管理",
        permission: "system:post:list",
        type: 1,
        icon: "post",
        component: "system/post/index",
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 5,
        createdAt: new Date(),
      },
      {
        id: 108,
        parentId: 1,
        path: "log",
        name: "日志管理",
        permission: "",
        type: 0,
        icon: "log",
        component: "",
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 9,
        createdAt: new Date(),
      },
    ]) {
      await prisma.menu.create({ data: menu });
    }

    logger.info("✅ 二级菜单创建完成");

    // 创建三级菜单
    for (const menu of [
      {
        id: 500,
        parentId: 108,
        path: "operlog",
        name: "操作日志",
        permission: "monitor:operlog:list",
        type: 1,
        icon: "form",
        component: "monitor/operlog/index",
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 1,
        createdAt: new Date(),
      },
      {
        id: 501,
        parentId: 108,
        path: "logininfor",
        name: "登录日志",
        permission: "monitor:logininfor:list",
        type: 1,
        icon: "logininfor",
        component: "monitor/logininfor/index",
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 2,
        createdAt: new Date(),
      },
    ]) {
      await prisma.menu.create({ data: menu });
    }

    logger.info("✅ 三级菜单创建完成");

    // 创建按钮权限
    for (const menu of [
      {
        id: 1000,
        parentId: 100,
        path: "",
        name: "用户查询",
        permission: "system:user:query",
        type: 2,
        icon: "#",
        component: "",
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 1,
        createdAt: new Date(),
      },
      {
        id: 1001,
        parentId: 100,
        path: "",
        name: "用户新增",
        permission: "system:user:add",
        type: 2,
        icon: "#",
        component: "",
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 2,
        createdAt: new Date(),
      },
      {
        id: 1002,
        parentId: 100,
        path: "",
        name: "用户修改",
        permission: "system:user:edit",
        type: 2,
        icon: "#",
        component: "",
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 3,
        createdAt: new Date(),
      },
      {
        id: 1003,
        parentId: 100,
        path: "",
        name: "用户删除",
        permission: "system:user:remove",
        type: 2,
        icon: "#",
        component: "",
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 4,
        createdAt: new Date(),
      },
      {
        id: 1004,
        parentId: 100,
        path: "",
        name: "用户导出",
        permission: "system:user:export",
        type: 2,
        icon: "#",
        component: "",
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 5,
        createdAt: new Date(),
      },
      {
        id: 1005,
        parentId: 100,
        path: "",
        name: "用户导入",
        permission: "system:user:import",
        type: 2,
        icon: "#",
        component: "",
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 6,
        createdAt: new Date(),
      },
      {
        id: 1006,
        parentId: 100,
        path: "",
        name: "重置密码",
        permission: "system:user:resetPwd",
        type: 2,
        icon: "#",
        component: "",
        keepAlive: 0,
        show: 1,
        status: 1,
        isExt: 0,
        extOpenMode: 1,
        orderNo: 7,
        createdAt: new Date(),
      },
    ]) {
      await prisma.menu.create({ data: menu });
    }

    logger.info("✅ 按钮权限创建完成");
  } catch (error) {
    logger.error("创建菜单数据失败:", error);
    throw error;
  }
}

/**
 * 创建用户数据
 */
async function createUsers() {
  try {
    // 生成密码盐和哈希密码
    const salt1 = await bcrypt.genSalt(10);
    const password1 = await bcrypt.hash("admin123", salt1);

    const salt2 = await bcrypt.genSalt(10);
    const password2 = await bcrypt.hash("admin123", salt2);

    await prisma.user.createMany({
      skipDuplicates: true,
      data: [
        {
          id: 1,
          deptId: 103,
          username: "admin",
          nickname: "超级管理员",
          userType: "00",
          email: "niangao@163.com",
          phonenumber: "15888888888",
          sex: "1",
          avatar: "",
          password: password1,
          psalt: salt1,
          status: "0",
          delFlag: "0",
          loginIp: "127.0.0.1",
          loginDate: new Date(),
          createBy: "admin",
          createdAt: new Date(),
          remark: "管理员",
        },
        {
          id: 2,
          deptId: 105,
          username: "niangao",
          nickname: "年糕",
          userType: "00",
          email: "niangao@qq.com",
          phonenumber: "15666666666",
          sex: "1",
          avatar: "",
          password: password2,
          psalt: salt2,
          status: "0",
          delFlag: "0",
          loginIp: "127.0.0.1",
          loginDate: new Date(),
          createBy: "admin",
          createdAt: new Date(),
          remark: "测试员",
        },
      ],
    });

    logger.info("👤 用户数据初始化成功");
  } catch (error) {
    logger.error("创建用户数据失败:", error);
    throw error;
  }
}

/**
 * 创建用户角色关联
 */
async function createUserRoles() {
  await prisma.userRole.createMany({
    skipDuplicates: true,
    data: [
      { userId: 1, roleId: 1, createdAt: new Date() },
      { userId: 2, roleId: 2, createdAt: new Date() },
    ],
  });
}

/**
 * 创建角色菜单关联 - 这里只创建普通角色(ID=2)的关联，超级管理员默认拥有所有权限
 */
async function createRoleMenus() {
  try {
    // 获取所有已创建的菜单ID
    const menus = await prisma.menu.findMany({
      select: { id: true },
    });

    const menuIds = menus.map((menu) => menu.id);

    // 生成角色菜单关联数据
    const roleMenuData = menuIds.map((menuId) => ({
      roleId: 2,
      menuId,
      createdAt: new Date(),
    }));

    // 批量创建角色菜单关联
    await prisma.roleMenu.createMany({
      skipDuplicates: true,
      data: roleMenuData,
    });

    logger.info("👍 角色菜单关联初始化成功");
  } catch (error) {
    logger.error("创建角色菜单关联失败:", error);
    throw error;
  }
}

/**
 * 创建角色部门关联
 */
async function createRoleDepts() {
  await prisma.roleDept.createMany({
    skipDuplicates: true,
    data: [
      { roleId: 2, deptId: 100, createdAt: new Date() },
      { roleId: 2, deptId: 101, createdAt: new Date() },
      { roleId: 2, deptId: 105, createdAt: new Date() },
    ],
  });
}

/**
 * 创建用户岗位关联
 */
async function createUserPosts() {
  await prisma.userPost.createMany({
    skipDuplicates: true,
    data: [
      { userId: 1, postId: 1 },
      { userId: 2, postId: 2 },
    ],
  });
}

/**
 * 创建字典类型
 */
async function createDictTypes() {
  await prisma.dictType.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 1,
        name: "用户性别",
        type: "sys_user_sex",
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "用户性别列表",
      },
      {
        id: 2,
        name: "菜单状态",
        type: "sys_show_hide",
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "菜单状态列表",
      },
      {
        id: 3,
        name: "系统开关",
        type: "sys_normal_disable",
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "系统开关列表",
      },
      {
        id: 4,
        name: "任务状态",
        type: "sys_job_status",
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "任务状态列表",
      },
      {
        id: 5,
        name: "任务分组",
        type: "sys_job_group",
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "任务分组列表",
      },
    ],
  });
}

/**
 * 创建字典数据
 */
async function createDictData() {
  await prisma.dictData.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 1,
        sort: 1,
        label: "男",
        value: "0",
        dictType: "sys_user_sex",
        cssClass: null,
        listClass: null,
        isDefault: "Y",
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "性别男",
      },
      {
        id: 2,
        sort: 2,
        label: "女",
        value: "1",
        dictType: "sys_user_sex",
        cssClass: null,
        listClass: null,
        isDefault: "N",
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "性别女",
      },
      {
        id: 3,
        sort: 3,
        label: "未知",
        value: "2",
        dictType: "sys_user_sex",
        cssClass: null,
        listClass: null,
        isDefault: "N",
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "性别未知",
      },
      {
        id: 4,
        sort: 1,
        label: "显示",
        value: "0",
        dictType: "sys_show_hide",
        cssClass: null,
        listClass: "primary",
        isDefault: "Y",
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "显示菜单",
      },
      {
        id: 5,
        sort: 2,
        label: "隐藏",
        value: "1",
        dictType: "sys_show_hide",
        cssClass: null,
        listClass: "danger",
        isDefault: "N",
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "隐藏菜单",
      },
      {
        id: 6,
        sort: 1,
        label: "正常",
        value: "0",
        dictType: "sys_normal_disable",
        cssClass: null,
        listClass: "primary",
        isDefault: "Y",
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "正常状态",
      },
      {
        id: 7,
        sort: 2,
        label: "停用",
        value: "1",
        dictType: "sys_normal_disable",
        cssClass: null,
        listClass: "danger",
        isDefault: "N",
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "停用状态",
      },
    ],
  });
}

/**
 * 创建系统配置
 */
async function createConfigs() {
  await prisma.config.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 1,
        name: "主框架页-默认皮肤样式名称",
        key: "sys.index.skinName",
        value: "skin-blue",
        configType: "Y",
        createBy: "admin",
        createdAt: new Date(),
        remark:
          "蓝色 skin-blue、绿色 skin-green、紫色 skin-purple、红色 skin-red、黄色 skin-yellow",
      },
      {
        id: 2,
        name: "用户管理-账号初始密码",
        key: "sys.user.initPassword",
        value: "123456",
        configType: "Y",
        createBy: "admin",
        createdAt: new Date(),
        remark: "初始化密码 123456",
      },
      {
        id: 3,
        name: "主框架页-侧边栏主题",
        key: "sys.index.sideTheme",
        value: "theme-dark",
        configType: "Y",
        createBy: "admin",
        createdAt: new Date(),
        remark: "深色主题theme-dark，浅色主题theme-light",
      },
      {
        id: 4,
        name: "账号自助-验证码开关",
        key: "sys.account.captchaEnabled",
        value: "true",
        configType: "Y",
        createBy: "admin",
        createdAt: new Date(),
        remark: "是否开启验证码功能（true开启，false关闭）",
      },
      {
        id: 5,
        name: "账号自助-是否开启用户注册功能",
        key: "sys.account.registerUser",
        value: "false",
        configType: "Y",
        createBy: "admin",
        createdAt: new Date(),
        remark: "是否开启注册用户功能（true开启，false关闭）",
      },
    ],
  });
}

/**
 * 创建通知公告
 */
async function createNotices() {
  const notice1Content = Buffer.from("新版本内容");
  const notice2Content = Buffer.from("维护内容");

  await prisma.notice.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 1,
        title: "温馨提醒：2018-07-01 vfadmin新版本发布啦",
        type: "2",
        content: notice1Content,
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "管理员",
      },
      {
        id: 2,
        title: "维护通知：2018-07-01 vfadmin系统凌晨维护",
        type: "1",
        content: notice2Content,
        status: "0",
        createBy: "admin",
        createdAt: new Date(),
        remark: "管理员",
      },
    ],
  });
}

/**
 * 创建定时任务
 */
// async function createJobs() {
//   await prisma.job.createMany({
//     skipDuplicates: true,
//     data: [
//       {
//         id: 1,
//         name: "系统默认（无参）",
//         group: "default",
//         executor: "default",
//         invokeTarget: "module_task.scheduler_test.job",
//         jobArgs: null,
//         jobKwargs: null,
//         cronExpression: "0/10 * * * * ?",
//         misfirePolicy: "3",
//         concurrent: "1",
//         status: "1",
//         createBy: "admin",
//         createdAt: new Date(),
//         remark: "",
//       },
//       {
//         id: 2,
//         name: "系统默认（有参）",
//         group: "default",
//         executor: "default",
//         invokeTarget: "module_task.scheduler_test.job",
//         jobArgs: "test",
//         jobKwargs: null,
//         cronExpression: "0/15 * * * * ?",
//         misfirePolicy: "3",
//         concurrent: "1",
//         status: "1",
//         createBy: "admin",
//         createdAt: new Date(),
//         remark: "",
//       },
//       {
//         id: 3,
//         name: "系统默认（多参）",
//         group: "default",
//         executor: "default",
//         invokeTarget: "module_task.scheduler_test.job",
//         jobArgs: "new",
//         jobKwargs: "{test: 111}",
//         cronExpression: "0/20 * * * * ?",
//         misfirePolicy: "3",
//         concurrent: "1",
//         status: "1",
//         createBy: "admin",
//         createdAt: new Date(),
//         remark: "",
//       },
//     ],
//   });
// }

// 执行初始化
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
