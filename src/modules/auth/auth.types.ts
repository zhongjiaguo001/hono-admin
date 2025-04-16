// src/modules/auth/auth.types.ts

// 登录请求参数
export interface LoginDto {
  username: string;
  password: string;
  captcha: string;
}

// 登录响应数据
export interface LoginResponse {
  token: string;
}

// JWT载荷数据
export interface JwtPayload {
  jti: string; // JWT ID，用于在Redis中唯一标识此Token
  userId: number; // 用户ID
  username: string; // 用户名
  password: string; // 密码哈希
  iat: number; // 签发时间
  exp: number; // 过期时间
}

// 验证码响应数据
export interface CaptchaResponse {
  imageBase64: string; // Base64编码的验证码图片
}
