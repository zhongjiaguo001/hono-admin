// file: validator-wrapper.ts
import { ZodSchema } from "zod";
import type { ValidationTargets } from "hono";
import { zValidator as zv } from "@hono/zod-validator";

export const zValidator = <
  T extends ZodSchema,
  Target extends keyof ValidationTargets
>(
  target: Target,
  schema: T
) =>
  zv(target, schema, (result, c) => {
    if (!result.success) {
      // 只获取第一个错误
      const firstError = result.error.errors[0];
      const errorMessage = firstError
        ? `${firstError.path.join(".")}：${firstError.message}`
        : "验证失败";
      return c.json(
        {
          success: false,
          message: errorMessage,
        },
        400
      );
    }
  });
