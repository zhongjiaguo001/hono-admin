// src/modules/auth/auth.service.ts
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { sign, verify } from "hono/jwt";
import { redisUtils } from "@/utils/redis.utils";
import { JwtPayload, LoginDto } from "./auth.types";

const prisma = new PrismaClient();

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET as string;
  private readonly TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24; // 24小时
  private readonly CAPTCHA_EXPIRATION_SECONDS = 60 * 5; // 5分钟
  private readonly CAPTCHA_PREFIX = "captcha:";

  /**
   * 生成验证码
   */
  async getCodeImg(clientIP: string): Promise<string> {
    try {
      // 生成随机6位数验证码
      const code = this.generateRandomCode(4);

      // 生成Redis键
      const redisKey = `${this.CAPTCHA_PREFIX}${clientIP}`;

      // 存储验证码到Redis
      await redisUtils.set(redisKey, code, this.CAPTCHA_EXPIRATION_SECONDS);

      // 生成验证码图片
      return this.generateCaptchaImage(code);
    } catch (error) {
      throw new Error("生成验证码失败");
    }
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto, clientIP: string): Promise<string> {
    const { username, password, captcha } = loginDto;

    // 验证验证码
    const redisKey = `${this.CAPTCHA_PREFIX}${clientIP}`;
    const storedCaptcha = await redisUtils.get(redisKey);

    if (!storedCaptcha || storedCaptcha !== captcha) {
      throw new Error("验证码错误或已过期");
    }

    // 验证成功后删除验证码
    await redisUtils.del(redisKey);

    // 查询用户
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        status: true,
      },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("用户名或密码错误");
    }

    // 生成JWT
    const jti = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.TOKEN_EXPIRATION_SECONDS;

    const payload: JwtPayload = {
      jti,
      userId: user.id,
      username: user.username,
      password: user.password,
      iat: now,
      exp,
    };

    const token = await sign(
      { ...payload, sub: payload.userId.toString() },
      this.JWT_SECRET
    );

    // 存储token到Redis
    const userRedisKey = `user:${user.id}`;
    await redisUtils.set(userRedisKey, token, this.TOKEN_EXPIRATION_SECONDS);

    return token;
  }

  /**
   * 退出登录
   */
  async logout(token: string): Promise<void> {
    try {
      const payload = (await verify(
        token,
        this.JWT_SECRET
      )) as unknown as JwtPayload;
      const redisKey = `user:${payload.userId}`;
      await redisUtils.del(redisKey);
    } catch (error) {
      throw new Error("退出登录失败");
    }
  }

  /**
   * 生成随机验证码
   */
  private generateRandomCode(length: number): string {
    const randomBytes = crypto.randomBytes(length);
    let code = "";

    for (let i = 0; i < length; i++) {
      code += Math.floor(randomBytes[i] % 10).toString();
    }

    return code;
  }

  /**
   * 生成验证码图片
   */
  private generateCaptchaImage(code: string): string {
    const svgWidth = 120;
    const svgHeight = 40;

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
      const fontSize = Math.floor(Math.random() * 5) + 20;
      const rotate = Math.floor(Math.random() * 30) - 15;
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
}
