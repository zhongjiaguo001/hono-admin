// 上传配置
export const uploadConfig = {
  baseDir: process.env.UPLOAD_BASE_DIR || "uploads",
  tempDir: process.env.UPLOAD_TEMP_DIR || "uploads/temp",
  maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || "5242880", 10), // 默认5MB
  allowTypes: process.env.UPLOAD_ALLOW_TYPES
    ? process.env.UPLOAD_ALLOW_TYPES.split(",")
    : [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],

  // 图片处理
  image: {
    resize: process.env.UPLOAD_IMAGE_RESIZE === "true",
    maxWidth: parseInt(process.env.UPLOAD_IMAGE_MAX_WIDTH || "1920", 10),
    maxHeight: parseInt(process.env.UPLOAD_IMAGE_MAX_HEIGHT || "1080", 10),
    quality: parseFloat(process.env.UPLOAD_IMAGE_QUALITY || "0.8"),
    format: process.env.UPLOAD_IMAGE_FORMAT || "jpeg",
  },

  // 访问URL前缀
  urlPrefix: process.env.UPLOAD_URL_PREFIX || "/uploads",
};
