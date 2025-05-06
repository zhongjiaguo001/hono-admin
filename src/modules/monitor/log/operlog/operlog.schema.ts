// src/modules/monitor/log/operlog/operlog.schema.ts
import { z } from "zod";

// 操作日志查询参数验证
export const operlogQuerySchema = z.object({
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
  title: z.string().optional(),
  operName: z.string().optional(),
  businessType: z.string().or(z.number()).optional(),
  status: z.string().or(z.number()).optional(),
  operTime: z.array(z.string()).optional(),
});

export type OperlogQueryDto = z.infer<typeof operlogQuerySchema>;
