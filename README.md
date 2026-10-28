# Apple 风格毕业同学录

一款以 Apple 设计语言打造的毕业同学录 Web 应用，收录校园风景、高光时刻、任课老师、同窗信息与毕业寄语，并内置管理后台，支持在线修改与留言。

## 功能特性

- 首页以海报卡片、滚动区块与毛玻璃 Dock 导航呈现，还原 Apple 质感
- 校园风光、班级大事记、任课老师、同学风采、毕业相册、同学留言六大板块
- 同学留言墙：访客可实时发布祝福留言，支持删除
- 独立管理后台，可编辑班级信息、各板块内容与重置演示数据
- 数据以 JSON 文件持久化，零数据库依赖，开箱即用

## 技术栈

- 前端：Vue 3 + Vite 6
- 后端：Python 3 + Flask
- 数据：JSON 文件（`backend/db.json`）

## 目录结构

```
.
├── backend/           Flask 后端与种子数据（正式版本）
│   ├── app.py         API 服务入口
│   ├── seed.py        初始演示数据
│   └── db.json        运行期持久化数据
├── frontend/          Vue 3 + Vite 前端
│   ├── src/           页面与组件
│   ├── index.html     同学录页面
│   └── admin.html     管理后台页面
├── server/            Express 版后端（备选实现）
└── public/            纯静态版本（备选实现）
```

## 快速开始

### 1. 安装前端依赖

```bash
npm install --prefix frontend
```

### 2. 安装后端依赖

```bash
pip install flask
```

### 3. 启动后端

```bash
python3 backend/app.py
```

后端默认监听 `3000` 端口（同学录与 API），管理后台单独监听 `8001` 端口。

### 4. 启动前端开发服务器（可选）

```bash
npm --prefix frontend run dev
```

Vite 默认监听 `5173`，并将 `/api` 反向代理到 `http://127.0.0.1:3000`。

### 5. 生产构建

```bash
npm --prefix frontend run build
```

构建产物输出到 `frontend/dist`，由 Flask 直接托管静态文件。

## 管理后台

- 访问地址：`http://<host>:8001`（或后端 3000 端口下的 `/admin` 路径）
- 默认密码：`admin123`
- 可通过环境变量 `ADMIN_PASSWORD` 覆盖

## 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `PORT` | 同学录/API 服务端口 | `3000` |
| `ADMIN_PORT` | 管理后台端口 | `8001` |
| `ADMIN_PASSWORD` | 后台登录密码 | `admin123` |

## 主要 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/yearbook` | 获取全部同学录数据 |
| `PATCH` | `/api/yearbook/meta` | 更新班级信息 |
| `PATCH` | `/api/students/<id>` | 更新学生留言/计划等 |
| `POST` | `/api/messages` | 发布留言 |
| `DELETE` | `/api/messages/<id>` | 删除留言 |
| `POST` | `/api/admin/login` | 后台登录 |
| `GET` | `/api/admin/export` | 导出全部数据 |
| `PUT` | `/api/admin/<collection>` | 覆盖指定集合 |
| `POST` | `/api/admin/reset` | 重置为种子数据 |