// src/modules/monitor/log/logininfor/logininfor.schema.ts

import { z } from "zod";

// 登录日志查询参数验证
export const logininforQuerySchema = z.object({
  page: z
    .string()
    .or(z.number())
    .optional()
    .transform((val) => Number(val) || 1),
  pageSize: z
    .string()
    .or(z.number())
    .optional()
    .transform((val) => Number(val) || 10),
  ipaddr: z.string().optional(),
  username: z.string().optional(),
  status: z.string().optional(),
  loginTime: z.array(z.string()).optional(),
});

export type LogininforQueryDto = z.infer<typeof logininforQuerySchema>;
