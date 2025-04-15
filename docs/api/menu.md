# 菜单管理接口文档

## 获取菜单列表

获取系统中的菜单列表，支持分页、排序和条件查询。

### 请求信息

- 请求路径：`/system/menus`
- 请求方法：`GET`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 请求参数

查询参数（Query Parameters）：

| 参数名     | 类型   | 必填 | 说明                       |
| ---------- | ------ | ---- | -------------------------- |
| page       | number | 否   | 页码，默认为 1             |
| pageSize   | number | 否   | 每页条数，默认为 10        |
| name       | string | 否   | 菜单名称（模糊查询）       |
| path       | string | 否   | 路由路径（模糊查询）       |
| component  | string | 否   | 组件路径（模糊查询）       |
| permission | string | 否   | 权限标识（模糊查询）       |
| status     | number | 否   | 状态：1 正常 0 禁用        |
| type       | number | 否   | 类型：0 目录 1 菜单 2 按钮 |

### 响应信息

```json
{
  "code": 200,
  "message": "获取菜单列表成功",
  "data": {
    "total": 10,
    "items": [
      {
        "id": 1,
        "parentId": null,
        "name": "系统管理",
        "path": "/system",
        "component": "Layout",
        "permission": "system",
        "type": 0,
        "icon": "setting",
        "orderNo": 0,
        "keepAlive": 0,
        "show": 1,
        "status": 1,
        "isExt": 0,
        "extOpenMode": 1,
        "activeMenu": "",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

## 获取菜单树形结构

获取系统中的菜单树形结构。

### 请求信息

- 请求路径：`/system/menus/tree`
- 请求方法：`GET`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 响应信息

```json
{
  "code": 200,
  "message": "获取菜单树形结构成功",
  "data": [
    {
      "id": 1,
      "parentId": null,
      "name": "系统管理",
      "path": "/system",
      "component": "Layout",
      "children": [
        {
          "id": 2,
          "parentId": 1,
          "name": "用户管理",
          "path": "user",
          "component": "system/user/index"
        }
      ]
    }
  ]
}
```

## 创建菜单

创建一个新的菜单。

### 请求信息

- 请求路径：`/system/menus`
- 请求方法：`POST`
- 请求体格式：`application/json`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 请求参数

请求体（Request Body）：

```json
{
  "parentId": 1,
  "name": "用户管理",
  "path": "user",
  "component": "system/user/index",
  "permission": "system:user:list",
  "type": 1,
  "icon": "user",
  "orderNo": 1,
  "keepAlive": 0,
  "show": 1,
  "status": 1,
  "isExt": 0,
  "extOpenMode": 1
}
```

| 参数名      | 类型   | 必填 | 说明                          |
| ----------- | ------ | ---- | ----------------------------- |
| parentId    | number | 否   | 父菜单 ID                     |
| name        | string | 是   | 菜单名称（2-50 字符）         |
| path        | string | 否   | 路由路径（最大 100 字符）     |
| component   | string | 否   | 组件路径（最大 100 字符）     |
| permission  | string | 否   | 权限标识（最大 100 字符）     |
| type        | number | 否   | 类型：0 目录 1 菜单 2 按钮    |
| icon        | string | 否   | 图标（最大 50 字符）          |
| orderNo     | number | 否   | 显示顺序，默认 0              |
| keepAlive   | number | 否   | 是否缓存：0 缓存 1 不缓存     |
| show        | number | 否   | 是否显示：1 显示 0 隐藏       |
| status      | number | 否   | 状态：1 正常 0 禁用           |
| isExt       | number | 否   | 是否外链：0 否 1 是           |
| extOpenMode | number | 否   | 外链打开方式：1 新窗口 2 内嵌 |
| activeMenu  | string | 否   | 高亮菜单（最大 100 字符）     |

### 响应信息

```json
{
  "code": 200,
  "message": "创建菜单成功",
  "data": {
    "id": 2,
    "parentId": 1,
    "name": "用户管理",
    "path": "user",
    "component": "system/user/index",
    "permission": "system:user:list",
    "type": 1,
    "icon": "user",
    "orderNo": 1,
    "keepAlive": 0,
    "show": 1,
    "status": 1,
    "isExt": 0,
    "extOpenMode": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## 更新菜单

更新指定菜单的信息。

### 请求信息

- 请求路径：`/system/menus/:id`
- 请求方法：`PUT`
- 请求体格式：`application/json`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 请求参数

路径参数（Path Parameters）：

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | number | 是   | 菜单 ID |

请求体（Request Body）：

```json
{
  "parentId": 1,
  "name": "用户列表",
  "path": "user-list",
  "component": "system/user/list",
  "permission": "system:user:list",
  "type": 1,
  "icon": "list",
  "orderNo": 2
}
```

参数同创建菜单接口，但所有字段都是可选的。

### 响应信息

```json
{
  "code": 200,
  "message": "更新菜单成功",
  "data": {
    "id": 2,
    "parentId": 1,
    "name": "用户列表",
    "path": "user-list",
    "component": "system/user/list",
    "permission": "system:user:list",
    "type": 1,
    "icon": "list",
    "orderNo": 2,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

## 删除菜单

删除指定的菜单。

### 请求信息

- 请求路径：`/system/menus/:id`
- 请求方法：`DELETE`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 请求参数

路径参数（Path Parameters）：

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | number | 是   | 菜单 ID |

### 响应信息

```json
{
  "code": 200,
  "message": "删除菜单成功"
}
```

## 获取角色菜单权限

获取指定角色的菜单权限列表。

### 请求信息

- 请求路径：`/system/menus/role/:roleId`
- 请求方法：`GET`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 请求参数

路径参数（Path Parameters）：

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| roleId | number | 是   | 角色 ID |

### 响应信息

```json
{
  "code": 200,
  "message": "获取角色菜单权限成功",
  "data": [1, 2, 3]
}
```

## 为角色分配菜单权限

为指定角色分配菜单权限。

### 请求信息

- 请求路径：`/system/menus/role/:roleId`
- 请求方法：`POST`
- 请求体格式：`application/json`
- 请求头：需要携带 `Authorization: Bearer <token>`

### 请求参数

路径参数（Path Parameters）：

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| roleId | number | 是   | 角色 ID |

请求体（Request Body）：

```json
{
  "menuIds": [1, 2, 3]
}
```

| 参数名  | 类型     | 必填 | 说明         |
| ------- | -------- | ---- | ------------ |
| menuIds | number[] | 是   | 菜单 ID 列表 |

### 响应信息

```json
{
  "code": 200,
  "message": "分配菜单权限成功"
}
```
