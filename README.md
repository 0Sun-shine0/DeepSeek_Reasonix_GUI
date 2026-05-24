# 🐋 DeepSeek Reasonix GUI

> 以 [Reasonix](https://www.npmjs.com/package/reasonix) 为底层的 AI Coding Agent GUI 半成品 — 基于 Electron + React + TypeScript

Reasonix 是一个 DeepSeek 原生的 AI 编程代理（CLI），本项目为其构建了一个现代化的 Electron 桌面 GUI，提供可视化的会话管理、代码审查、文件浏览等体验。

## ✨ 当前功能

- **可视化 Chat 界面** — 与 Reasonix Agent 进行自然语言交互
- **会话管理** — 创建、切换、重命名、删除会话
- **文件树浏览器** — 在工作区目录中浏览项目文件
- **MCP 服务器管理** — 添加、移除 MCP 工具服务器
- **Skills 管理** — 查看和管理已注册的 AI 技能
- **Memory 管理** — 查看和管理持久化记忆条目
- **Plan / Checkpoint / Revision 流程** — 可视化的计划审批与执行跟踪
- **命令面板 (⌘K)** — 快速访问常用操作
- **暗色 / 亮色主题** — 支持主题切换
- **Jobs 状态栏** — 查看后台运行的任务
- **上下文面板** — 显示当前 token 使用情况和上下文文件
- **代码 Diff 查看** — 在 UI 中预览代码变更
- **内嵌终端** — 集成 xterm.js 终端面板

## 🛠 技术栈

| 层           | 技术                                      |
| ------------ | ----------------------------------------- |
| 框架         | Electron 35                               |
| 前端         | React 19 + TypeScript 5                    |
| 构建         | Vite 5                                    |
| Markdown     | react-markdown + remark-gfm               |
| 代码高亮     | react-syntax-highlighter                   |
| 终端         | xterm.js + xterm-addon-fit                |
| Agent 后端   | [Reasonix](https://github.com/reasonix-ai/reasonix) v0.49 (NDJSON IPC) |

## 📁 项目结构

```
reasonix_gui/
├── src/
│   ├── main/           # Electron 主进程
│   │   ├── index.ts    # 窗口创建、生命周期
│   │   ├── ipc.ts      # IPC 通道注册
│   │   └── rpc.ts      # Reasonix 子进程管理 (NDJSON)
│   ├── preload/        # 预加载脚本 (contextBridge)
│   │   └── index.ts
│   ├── renderer/       # React 前端
│   │   ├── App.tsx     # 根组件、Reducer、事件订阅
│   │   ├── state.ts    # 状态管理 (useReducer)
│   │   ├── protocol.ts # 渲染进程通信桥接
│   │   ├── main.tsx    # React 入口
│   │   ├── components/ # UI 组件
│   │   └── styles/     # CSS 样式
│   └── shared/         # 共享类型协议
│       └── protocol.ts
├── dist/               # Vite 构建产物
├── dist-electron/      # TypeScript 编译产物 (main/preload)
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- 一个 [DeepSeek API Key](https://platform.deepseek.com/api_keys)

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/<your-username>/DeepSeek_Reasonix_GUI.git
cd DeepSeek_Reasonix_GUI

# 安装依赖
npm install

# 开发模式 (仅启动 Vite 前端)
npm run dev

# 启动完整 Electron 应用
npm run electron:dev

# 打包为可执行文件
npm run electron:build
```

首次启动后会提示输入 DeepSeek API Key，密钥存储在本地 `~/.reasonix/config.json`，仅用于调用 `api.deepseek.com`。

## 🎮 使用方式

| 操作              | 快捷键 / 方式                    |
| ----------------- | -------------------------------- |
| 命令面板          | `Ctrl+K` (macOS: `⌘K`)          |
| 发送消息          | `Enter`                         |
| 换行              | `Shift+Enter`                   |
| 终止 Agent        | `Esc` (Agent 运行时)            |
| 切换侧边栏        | 点击左下角 ☰ 按钮               |
| 打开文件夹        | 点击左下角 📂 按钮               |
| 设置              | 点击左下角 ⚙ 按钮               |
| 在文件树中 @ 引用  | 点击文件名自动注入 `@path`       |

## ⚠️ 待完善

- 多 Tab 工作区支持
- 更完善的错误恢复机制
- 设置面板中更多配置项的可视化
- 国际化 (i18n)
- macOS 构建签名
- 自动化测试

## 📄 License

MIT
