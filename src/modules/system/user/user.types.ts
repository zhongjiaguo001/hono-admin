// src/modules/system/user/user.types.ts

/**
 * 用户信息接口
 */
export interface UserInfo {
  id: number;
  username: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  qq?: string;
  status: number;
  remark?: string;
  deptId?: number;
  dept?: {
    id: number;
    name: string;
  };
  roles?: {
    id: number;
    name: string;
    value: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建用户请求参数
 */
export interface CreateUserDto {
  username: string;
  password: string;
  nickname?: string;
  email?: string;
  phone?: string;
  qq?: string;
  avatar?: string;
  remark?: string;
  deptId?: number;
  status?: number;
  roleIds?: number[];
}

/**
 * 更新用户请求参数
 */
export interface UpdateUserDto {
  id: number;
  nickname?: string;
  email?: string;
  phone?: string;
  qq?: string;
  avatar?: string;
  remark?: string;
  deptId?: number;
  status?: number;
  roleIds?: number[];
}

/**
 * 修改密码请求参数
 */
export interface UpdatePasswordDto {
  newPassword: string;
}

/**
 * 更新用户状态请求参数
 */
export interface UpdateUserStatusDto {
  id: number;
  status: number;
}

/**
 * 用户查询参数
 */
export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  username?: string;
  status?: number;
  deptId?: number;
  startTime?: string;
  endTime?: string;
}

/**
 * 分页响应结果
 */
export interface PaginatedResult<T> {
  list: T[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}

/**
 * API响应结构
 */
export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data?: T;
}
