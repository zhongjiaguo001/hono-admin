// src/utils/request.utils.ts

/**
 * 请求信息工具类
 */
export class RequestUtils {
  /**
   * 解析用户代理字符串，获取浏览器和操作系统信息
   * @param userAgent 用户代理字符串
   * @returns 浏览器和操作系统信息
   */
  static parseUserAgent(userAgent: string = ""): {
    browser: string;
    os: string;
  } {
    if (!userAgent) {
      return { browser: "未知", os: "未知" };
    }

    // 操作系统识别
    let os = "未知";
    if (userAgent.includes("Windows")) {
      os = "Windows";
    } else if (userAgent.includes("Mac OS")) {
      os = "Mac OS";
    } else if (userAgent.includes("Android")) {
      os = "Android";
    } else if (
      userAgent.includes("iOS") ||
      userAgent.includes("iPhone") ||
      userAgent.includes("iPad")
    ) {
      os = "iOS";
    } else if (userAgent.includes("Linux")) {
      os = "Linux";
    }

    // 浏览器识别
    let browser = "未知";
    if (userAgent.includes("MSIE") || userAgent.includes("Trident")) {
      browser = "IE";
    } else if (userAgent.includes("Edge") || userAgent.includes("Edg")) {
      browser = "Edge";
    } else if (
      userAgent.includes("Chrome") &&
      !userAgent.includes("Chromium")
    ) {
      browser = "Chrome";
    } else if (userAgent.includes("Firefox")) {
      browser = "Firefox";
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      browser = "Safari";
    } else if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
      browser = "Opera";
    }

    return { browser, os };
  }

  /**
   * 解析IP地址获取地理位置
   * @param ip IP地址
   * @returns 地理位置信息
   */
  static async getLocationByIp(ip: string): Promise<string> {
    try {
      // 如果IP为本地或内网IP
      if (
        ip === "127.0.0.1" ||
        ip === "::1" ||
        ip.startsWith("192.168.") ||
        ip.startsWith("10.") ||
        ip.startsWith("172.16.")
      ) {
        return "内网IP";
      }

      // 这里可以集成第三方IP地址库或API
      // 例如: ip-api.com, ipinfo.io等
      // 简化示例，实际项目中应使用更可靠的服务
      try {
        const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "success") {
            return `${data.country} ${data.regionName} ${data.city}`;
          }
        }
      } catch (e) {
        // API调用失败则使用备用方案或返回未知
        console.error("IP地址解析失败:", e);
      }

      return "未知位置";
    } catch (error) {
      console.error("获取地理位置失败:", error);
      return "未知位置";
    }
  }
}
