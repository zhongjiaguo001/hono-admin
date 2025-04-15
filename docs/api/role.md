# 角色管理接口文档

## 获取角色列表

获取系统中的角色列表，支持分页和排序。

### 请求信息

- 请求路径：`/system/roles`
- 请求方法：`GET`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 请求参数

查询参数（Query Parameters）：

| 参数名    | 类型   | 必填 | 说明                    |
| --------- | ------ | ---- | ----------------------- |
| page      | number | 否   | 页码，默认为 1          |
| pageSize  | number | 否   | 每页条数，默认为 10     |
| sortBy    | string | 否   | 排序字段                |
| sortOrder | string | 否   | 排序方向，'asc'或'desc' |

### 响应信息

```json
{
  "code": 200,
  "message": "获取角色列表成功",
  "data": {
    "total": 10,
    "items": [
      {
        "id": 1,
        "name": "管理员",
        "description": "系统管理员",
        "permissions": ["user:read", "user:write"],
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

## 新增角色

创建一个新的角色。

### 请求信息

- 请求路径：`/system/roles`
- 请求方法：`POST`
- 请求体格式：`application/json`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 请求参数

请求体（Request Body）：

```json
{
  "name": "编辑者",
  "description": "内容编辑人员",
  "permissions": ["content:read", "content:write"]
}
```

| 参数名      | 类型     | 必填 | 说明     |
| ----------- | -------- | ---- | -------- |
| name        | string   | 是   | 角色名称 |
| description | string   | 否   | 角色描述 |
| permissions | string[] | 是   | 权限列表 |

### 响应信息

```json
{
  "code": 200,
  "message": "创建角色成功",
  "data": {
    "id": 2,
    "name": "编辑者",
    "description": "内容编辑人员",
    "permissions": ["content:read", "content:write"],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## 更新角色信息

更新指定角色的信息。

### 请求信息

- 请求路径：`/system/roles/:id`
- 请求方法：`PUT`
- 请求体格式：`application/json`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 请求参数

路径参数（Path Parameters）：

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | number | 是   | 角色 ID |

请求体（Request Body）：

```json
{
  "name": "高级编辑者",
  "description": "高级内容编辑人员",
  "permissions": ["content:read", "content:write", "content:publish"]
}
```

| 参数名      | 类型     | 必填 | 说明     |
| ----------- | -------- | ---- | -------- |
| name        | string   | 否   | 角色名称 |
| description | string   | 否   | 角色描述 |
| permissions | string[] | 否   | 权限列表 |

### 响应信息

```json
{
  "code": 200,
  "message": "更新角色成功",
  "data": {
    "id": 2,
    "name": "高级编辑者",
    "description": "高级内容编辑人员",
    "permissions": ["content:read", "content:write", "content:publish"],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

## 删除角色

删除指定的角色。

### 请求信息

- 请求路径：`/system/roles/:id`
- 请求方法：`DELETE`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 请求参数

路径参数（Path Parameters）：

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | number | 是   | 角色 ID |

### 响应信息

```json
{
  "code": 200,
  "message": "删除角色成功"
}
```
