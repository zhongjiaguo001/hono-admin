import { Hono } from "hono";
import { CommonController } from "./common.controller";

export function createCommonModule() {
  const router = new Hono();
  const controller = new CommonController();

  // 文件上传
  router.post("/upload", controller.upload);

  // 文件下载
  router.get("/download", controller.download);

  // 资源文件下载
  router.get("/download/resource", controller.downloadResource);

  return router;
}

export * from "./common.controller";
