import * as nodemailer from "nodemailer";
import { redisUtils } from "@/db/redis";

// 邮件配置接口
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// 默认邮件配置
const defaultConfig: EmailConfig = {
  host: process.env.EMAIL_HOST || "smtp.example.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "user@example.com",
    pass: process.env.EMAIL_PASS || "password",
  },
};

// 验证码配置
const VERIFICATION_CODE_LENGTH = 6; // 验证码长度
const VERIFICATION_CODE_EXPIRE = 300; // 验证码过期时间（秒）
const VERIFICATION_CODE_PREFIX = "email:verification:"; // Redis键前缀

/**
 * 邮件服务类
 */
export class EmailService {
  private transporter: nodemailer.Transporter;

  /**
   * 构造函数
   * @param config 邮件配置
   */
  constructor(config: EmailConfig = defaultConfig) {
    this.transporter = nodemailer.createTransport(config);
  }

  /**
   * 发送普通邮件
   * @param to 收件人
   * @param subject 主题
   * @param text 文本内容
   * @param html HTML内容（可选）
   * @returns 发送结果
   */
  async sendMail(
    to: string,
    subject: string,
    text: string,
    html?: string
  ): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: defaultConfig.auth.user,
        to,
        subject,
        text,
        html: html || text,
      });
      console.log("Email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Send email error:", error);
      return false;
    }
  }

  /**
   * 生成随机验证码
   * @param length 验证码长度
   * @returns 生成的验证码
   */
  private generateVerificationCode(
    length: number = VERIFICATION_CODE_LENGTH
  ): string {
    const digits = "0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      code += digits[randomIndex];
    }
    return code;
  }

  /**
   * 发送验证码邮件
   * @param email 收件人邮箱
   * @param purpose 用途标识（如：register, reset_password）
   * @returns 操作结果
   */
  async sendVerificationCode(
    email: string,
    purpose: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 生成验证码
      const code = this.generateVerificationCode();

      // 构建Redis键
      const redisKey = `${VERIFICATION_CODE_PREFIX}${purpose}:${email}`;

      // 检查是否存在未过期的验证码
      const existingCode = await redisUtils.get(redisKey);
      if (existingCode) {
        const ttl = await redisUtils.ttl(redisKey);
        if (ttl > VERIFICATION_CODE_EXPIRE - 60) {
          // 如果验证码发送不到1分钟
          return {
            success: false,
            message: `请求过于频繁，请在${Math.ceil(
              ttl - (VERIFICATION_CODE_EXPIRE - 60)
            )}秒后重试`,
          };
        }
      }

      // 存储验证码到Redis
      await redisUtils.set(redisKey, code, VERIFICATION_CODE_EXPIRE);

      // 发送验证码邮件
      const subject = "验证码";
      const text = `您的验证码是：${code}，有效期${
        VERIFICATION_CODE_EXPIRE / 60
      }分钟，请勿泄露给他人。`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">验证码</h2>
          <p>您好，</p>
          <p>您的验证码是：</p>
          <div style="background-color: #f5f5f5; padding: 10px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>此验证码有效期为${
            VERIFICATION_CODE_EXPIRE / 60
          }分钟，请勿泄露给他人。</p>
          <p>如果这不是您的操作，请忽略此邮件。</p>
          <p style="margin-top: 30px; font-size: 12px; color: #999;">此邮件由系统自动发送，请勿回复。</p>
        </div>
      `;

      const result = await this.sendMail(email, subject, text, html);

      if (result) {
        return {
          success: true,
          message: "验证码已发送，请查收邮件",
        };
      } else {
        // 发送失败，删除Redis中的验证码
        await redisUtils.del(redisKey);
        return {
          success: false,
          message: "验证码发送失败，请稍后重试",
        };
      }
    } catch (error) {
      console.error("Send verification code error:", error);
      return {
        success: false,
        message: "验证码发送失败，请稍后重试",
      };
    }
  }

  /**
   * 验证邮箱验证码
   * @param email 邮箱
   * @param code 验证码
   * @param purpose 用途标识
   * @param deleteAfterVerify 验证后是否删除（默认：true）
   * @returns 验证结果
   */
  async verifyCode(
    email: string,
    code: string,
    purpose: string,
    deleteAfterVerify: boolean = true
  ): Promise<{ valid: boolean; message: string }> {
    try {
      const redisKey = `${VERIFICATION_CODE_PREFIX}${purpose}:${email}`;

      // 从Redis获取验证码
      const storedCode = await redisUtils.get(redisKey);

      if (!storedCode) {
        return {
          valid: false,
          message: "验证码已过期或不存在",
        };
      }

      // 验证码比对
      if (storedCode === code) {
        // 验证成功后删除验证码
        if (deleteAfterVerify) {
          await redisUtils.del(redisKey);
        }

        return {
          valid: true,
          message: "验证码验证成功",
        };
      } else {
        return {
          valid: false,
          message: "验证码错误",
        };
      }
    } catch (error) {
      console.error("Verify code error:", error);
      return {
        valid: false,
        message: "验证码验证失败，请稍后重试",
      };
    }
  }
}

// 创建默认邮件服务实例
export const emailService = new EmailService();
