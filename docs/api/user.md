# 用户管理接口文档

## 获取用户列表

获取系统中的用户列表，支持分页、排序和多条件筛选。

### 请求信息

- 请求路径：`/system/users`
- 请求方法：`GET`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 请求参数

| 参数名    | 类型   | 必填 | 说明                     | 示例                         |
| --------- | ------ | ---- | ------------------------ | ---------------------------- |
| page      | number | 否   | 当前页码，默认为 1       | 1                            |
| pageSize  | number | 否   | 每页条数，默认为 10      | 10                           |
| username  | string | 否   | 用户名（模糊查询）       | "admin"                      |
| nickname  | string | 否   | 昵称（模糊查询）         | "管理员"                     |
| phone     | string | 否   | 手机号（模糊查询）       | "138"                        |
| status    | number | 否   | 用户状态：1 正常，0 禁用 | 1                            |
| createdAt | array  | 否   | 创建时间范围             | ["2024-01-01", "2024-01-31"] |

### 响应参数

| 参数名  | 类型   | 说明                 |
| ------- | ------ | -------------------- |
| code    | number | 状态码，200 表示成功 |
| message | string | 响应消息             |
| data    | object | 分页数据对象         |

### 响应示例

```json
{
  "code": 200,
  "message": "获取用户列表成功",
  "data": {
    "items": [
      {
        "id": 1,
        "username": "admin",
        "nickname": "管理员",
        "email": "admin@example.com",
        "phone": "13800138000",
        "status": 1,
        "createdAt": "2024-01-01T12:00:00Z",
        "updatedAt": "2024-01-01T12:00:00Z",
        "dept": {
          "id": 1,
          "name": "技术部"
        },
        "roles": [
          {
            "id": 1,
            "name": "管理员"
          }
        ]
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

## 新增用户

新增一个系统用户。

### 请求信息

- 请求路径：`/system/users`
- 请求方法：`POST`
- 请求体格式：`application/json`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 请求参数

| 参数名   | 类型   | 必填 | 说明                | 示例                |
| -------- | ------ | ---- | ------------------- | ------------------- |
| username | string | 是   | 用户名，2-30 个字符 | "admin"             |
| password | string | 是   | 密码，最少 6 个字符 | "password123"       |
| nickname | string | 否   | 用户昵称            | "管理员"            |
| email    | string | 否   | 邮箱地址            | "admin@example.com" |
| phone    | string | 否   | 手机号，11 位数字   | "13800138000"       |

### 响应参数

| 参数名  | 类型   | 说明                                       |
| ------- | ------ | ------------------------------------------ |
| code    | number | 状态码，200 表示成功，409 表示用户名已存在 |
| message | string | 响应消息                                   |
| data    | object | 用户信息                                   |

### 响应示例

成功响应：

```json
{
  "code": 200,
  "message": "新增用户成功",
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "email": "admin@example.com",
    "phone": "13800138000",
    "status": 1,
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

失败响应：

```json
{
  "code": 409,
  "message": "用户名已存在"
}
```

## 删除用户

删除一个或多个用户。

### 请求信息

- 请求路径：`/system/users/:ids`
- 请求方法：`DELETE`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 路径参数

| 参数名 | 类型   | 必填 | 说明                        | 示例           |
| ------ | ------ | ---- | --------------------------- | -------------- |
| ids    | string | 是   | 用户 ID，多个 ID 用逗号分隔 | "1" 或 "1,2,3" |

### 响应参数

| 参数名  | 类型   | 说明                 |
| ------- | ------ | -------------------- |
| code    | number | 状态码，200 表示成功 |
| message | string | 响应消息             |

### 响应示例

成功响应：

```json
{
  "code": 200,
  "message": "成功删除1个用户"
}
```

失败响应：

```json
{
  "code": 400,
  "message": "部分用户不存在"
}
```

## 切换用户状态

启用或禁用用户。

### 请求信息

- 请求路径：`/system/users/:id/status`
- 请求方法：`PATCH`
- 请求体格式：`application/json`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 路径参数

| 参数名 | 类型   | 必填 | 说明    | 示例 |
| ------ | ------ | ---- | ------- | ---- |
| id     | number | 是   | 用户 ID | 1    |

### 请求参数

| 参数名 | 类型   | 必填 | 说明                     | 示例 |
| ------ | ------ | ---- | ------------------------ | ---- |
| status | number | 是   | 用户状态：1 正常，0 禁用 | 1    |

### 响应参数

| 参数名  | 类型   | 说明                 |
| ------- | ------ | -------------------- |
| code    | number | 状态码，200 表示成功 |
| message | string | 响应消息             |

### 响应示例

```json
{
  "code": 200,
  "message": "更新用户状态成功"
}
```

## 更新用户信息

更新用户的基本信息。

### 请求信息

- 请求路径：`/system/users/:id`
- 请求方法：`PUT`
- 请求体格式：`application/json`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 路径参数

| 参数名 | 类型   | 必填 | 说明    | 示例 |
| ------ | ------ | ---- | ------- | ---- |
| id     | number | 是   | 用户 ID | 1    |

### 请求参数

| 参数名   | 类型   | 必填 | 说明                     | 示例                |
| -------- | ------ | ---- | ------------------------ | ------------------- |
| username | string | 是   | 用户名，2-30 个字符      | "admin"             |
| nickname | string | 否   | 用户昵称                 | "管理员"            |
| email    | string | 否   | 邮箱地址                 | "admin@example.com" |
| phone    | string | 否   | 手机号，11 位数字        | "13800138000"       |
| status   | number | 否   | 用户状态：1 正常，0 禁用 | 1                   |
| dept     | object | 否   | 部门信息                 | {"id": 1}           |
| roles    | array  | 否   | 角色列表                 | [{"id": 1}]         |

### 响应参数

| 参数名  | 类型   | 说明                 |
| ------- | ------ | -------------------- |
| code    | number | 状态码，200 表示成功 |
| message | string | 响应消息             |
| data    | object | 更新后的用户信息     |

### 响应示例

```json
{
  "code": 200,
  "message": "更新用户信息成功",
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "email": "admin@example.com",
    "phone": "13800138000",
    "status": 1,
    "updatedAt": "2024-01-01T13:00:00Z",
    "dept": {
      "id": 1,
      "name": "技术部"
    },
    "roles": [
      {
        "id": 1,
        "name": "管理员"
      }
    ]
  }
}
```

## 重置用户密码

重置指定用户的密码。

### 请求信息

- 请求路径：`/system/users/:id/password`
- 请求方法：`PATCH`
- 请求体格式：`application/json`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 路径参数

| 参数名 | 类型   | 必填 | 说明    | 示例 |
| ------ | ------ | ---- | ------- | ---- |
| id     | number | 是   | 用户 ID | 1    |

### 请求参数

| 参数名      | 类型   | 必填 | 说明                  | 示例             |
| ----------- | ------ | ---- | --------------------- | ---------------- |
| newPassword | string | 是   | 新密码，最少 6 个字符 | "newpassword123" |

### 响应参数

| 参数名  | 类型   | 说明                 |
| ------- | ------ | -------------------- |
| code    | number | 状态码，200 表示成功 |
| message | string | 响应消息             |

### 响应示例

```json
{
  "code": 200,
  "message": "密码重置成功"
}
```

### 注意事项

1. 所有接口返回的状态码说明：

   - 200: 请求成功
   - 400: 请求参数错误
   - 401: 未登录或登录已过期
   - 403: 没有权限
   - 409: 资源冲突（如用户名已存在）
   - 500: 服务器内部错误

2. 需要登录的接口都必须在请求头中携带 token：

   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. 用户名和密码规则：

   - 用户名：2-30 个字符
   - 密码：最少 6 个字符

4. 手机号格式：11 位数字
