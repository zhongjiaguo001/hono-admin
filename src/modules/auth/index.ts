import { Hono } from "hono";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { prisma } from "@/db/prisma";
import { sign, verify } from "hono/jwt";
import { zValidator } from "@/middleware/validtor-wrapper";
import { loginSchema } from "./validation";
import { redisUtils } from "@/db/redis";
import { v4 as uuidv4 } from "uuid";

// 使用Bun内置的crypto库

const auth = new Hono();

const JWT_SECRET = process.env.JWT_SECRET as string;
const TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24; // 24 小时，单位秒
const CAPTCHA_EXPIRATION_SECONDS = 60 * 5; // 验证码有效期5分钟
const CAPTCHA_PREFIX = "captcha:"; // 验证码Redis键前缀

/**
 * 生成验证码图片
 * 使用Bun内置的crypto库生成随机6位数，并转换为base64编码的图片
 */
auth.get("/getCodeImg", async (c) => {
  try {
    // 生成随机6位数验证码
    const code = generateRandomCode(6);

    // 获取客户端IP作为标识
    const clientIP =
      c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

    // 生成Redis键
    const redisKey = `${CAPTCHA_PREFIX}${clientIP}`;

    // 存储验证码到Redis，设置过期时间
    await redisUtils.set(redisKey, code, CAPTCHA_EXPIRATION_SECONDS);

    // 生成验证码图片的base64编码
    const imageBase64 = generateCaptchaImage(code);

    return c.json({
      code: 200,
      message: "获取验证码成功",
      data: imageBase64,
    });
  } catch (error) {
    console.error("Generate captcha error:", error);
    return c.json(
      {
        code: 500,
        message: "获取验证码失败",
      },
      500
    );
  }
});

// 登录
auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { username, password, captcha } = await c.req.valid("json");

  // 0. 验证验证码
  const clientIP =
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
  const redisKey = `${CAPTCHA_PREFIX}${clientIP}`;
  const storedCaptcha = await redisUtils.get(redisKey);

  // 验证码不存在或不匹配
  if (!storedCaptcha || storedCaptcha !== captcha) {
    return c.json(
      {
        code: 400,
        message: "验证码错误或已过期",
      },
      400
    );
  }

  // 验证成功后删除验证码，防止重复使用
  await redisUtils.del(redisKey);

  // 1. 查询用户
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      username: true,
      password: true,
      status: true,
    },
  });

  // 2. 检查用户是否存在
  if (!user) throw new Error("用户不存在");

  // 3. 比较密码
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error("用户名或密码错误");

  // 4. 生成 唯一的 JWT ID (jti)
  const jti = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + TOKEN_EXPIRATION_SECONDS;

  // 5. 生成token
  const payload = {
    jti, // JWT ID，用于在 Redis 中唯一标识此 Token
    userId: user.id,
    username: user.username,
    password: user.password,
    iat: now, // 签发时间
    exp: exp, // 过期时间
  };

  const token = await sign(payload, JWT_SECRET);

  try {
    const redisKey = `user:${user.id}`;
    await redisUtils.set(redisKey, token, TOKEN_EXPIRATION_SECONDS);
  } catch (error) {
    console.error("Error signing JWT:", error);
    throw new Error("登录失败");
  }
  return c.json({
    code: 200,
    message: "登录成功",
    data: token,
  });
});

// 退出登录
auth.post("/logout", async (c) => {
  try {
    // 1. 从请求头中获取Authorization
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json(
        {
          code: 401,
          message: "未授权，请先登录",
        },
        401
      );
    }

    // 2. 提取token并解析
    const token = authHeader.split(" ")[1];
    const payload = (await verify(token, JWT_SECRET)) as any;

    // 3. 从Redis中删除token
    const redisKey = `user:${payload.userId}`;
    await redisUtils.del(redisKey);

    return c.json({
      code: 200,
      message: "退出登录成功",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return c.json(
      {
        code: 500,
        message: "退出登录失败",
      },
      500
    );
  }
});

/**
 * 生成指定长度的随机数字验证码
 * @param length 验证码长度
 * @returns 生成的验证码
 */
function generateRandomCode(length: number): string {
  // 使用Bun内置的crypto库生成随机数
  const randomBytes = crypto.randomBytes(length);
  let code = "";

  for (let i = 0; i < length; i++) {
    // 将随机字节转换为0-9的数字
    code += Math.floor(randomBytes[i] % 10).toString();
  }

  return code;
}

/**
 * 生成验证码图片的base64编码
 * 简单实现，将验证码文本转换为base64编码的数据URI
 * @param code 验证码文本
 * @returns base64编码的图片
 */
function generateCaptchaImage(code: string): string {
  // 这里使用一个简单的SVG图片来展示验证码
  // 在实际应用中，可以使用更复杂的图片生成库
  const svgWidth = 120;
  const svgHeight = 40;

  // 创建SVG图片，添加干扰线和噪点
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`;

  // 添加背景
  svg += `<rect width="100%" height="100%" fill="#f0f0f0"/>`;

  // 添加干扰线
  for (let i = 0; i < 5; i++) {
    const x1 = Math.floor(Math.random() * svgWidth);
    const y1 = Math.floor(Math.random() * svgHeight);
    const x2 = Math.floor(Math.random() * svgWidth);
    const y2 = Math.floor(Math.random() * svgHeight);
    const color = `rgb(${Math.floor(Math.random() * 200)},${Math.floor(
      Math.random() * 200
    )},${Math.floor(Math.random() * 200)})`;
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1"/>`;
  }

  // 添加噪点
  for (let i = 0; i < 30; i++) {
    const cx = Math.floor(Math.random() * svgWidth);
    const cy = Math.floor(Math.random() * svgHeight);
    const color = `rgb(${Math.floor(Math.random() * 200)},${Math.floor(
      Math.random() * 200
    )},${Math.floor(Math.random() * 200)})`;
    svg += `<circle cx="${cx}" cy="${cy}" r="1" fill="${color}"/>`;
  }

  // 添加验证码文本
  const charWidth = svgWidth / code.length;
  for (let i = 0; i < code.length; i++) {
    const x = charWidth * i + charWidth / 2;
    const y = svgHeight / 2 + 5;
    const fontSize = Math.floor(Math.random() * 5) + 20; // 20-24的随机字体大小
    const rotate = Math.floor(Math.random() * 30) - 15; // -15到15度的随机旋转
    const color = `rgb(${Math.floor(Math.random() * 100)},${Math.floor(
      Math.random() * 100
    )},${Math.floor(Math.random() * 100)})`;

    svg += `<text x="${x}" y="${y}" font-family="Arial" font-size="${fontSize}" fill="${color}" text-anchor="middle" transform="rotate(${rotate} ${x} ${y})">${code[i]}</text>`;
  }

  svg += `</svg>`;

  // 将SVG转换为base64编码
  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

export default auth;
