// // file: validator-wrapper.ts
// import { ZodSchema } from "zod";
// import type { ValidationTargets } from "hono";
// import { zValidator as zv } from "@hono/zod-validator";

// export const zValidator = <
//   T extends ZodSchema,
//   Target extends keyof ValidationTargets
// >(
//   target: Target,
//   schema: T
// ) =>
//   zv(target, schema, (result, c) => {
//     if (!result.success) {
//       // 只获取第一个错误
//       const firstError = result.error.errors[0];
//       const errorMessage = firstError
//         ? `${firstError.path.join(".")}：${firstError.message}`
//         : "验证失败";
//       return c.json(
//         {
//           success: false,
//           message: errorMessage,
//         },
//         400
//       );
//     }
//   });

// middleware/validator.middleware.ts
import { Context, Next, MiddlewareHandler } from "hono";
import { z, ZodError } from "zod";

/**
 * 自定义Zod验证中间件，支持参数验证
 */
export function zodValidator<T extends z.ZodTypeAny>(
  target: "json" | "form" | "query" | "param",
  schema: T
): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    try {
      let data: any;

      if (target === "json") {
        data = await c.req.json();
      } else if (target === "form") {
        data = await c.req.parseBody();
      } else if (target === "query") {
        data = c.req.query();
      } else if (target === "param") {
        // 获取URL路径参数
        data = c.req.param();
      }

      const validated = schema.parse(data);
      c.set("zod", validated);

      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        const message = firstError
          ? `${firstError.path.join(".")}: ${firstError.message}`
          : "请求参数验证失败";

        return c.json(
          {
            code: 400,
            message,
          },
          400
        );
      }

      throw error;
    }
  };
}
