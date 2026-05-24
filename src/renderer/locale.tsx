// locale.ts — lightweight i18n: zh (default) / en

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Locale = "zh" | "en";

// ─── Dictionaries ───

const zh = {
  // Setup
  setup_welcome: "欢迎使用 Reasonix",
  setup_subtitle: "DeepSeek 原生 AI 编程助手",
  setup_hint_prefix: "在 ",
  setup_hint_link: "platform.deepseek.com",
  setup_hint_suffix: " 获取你的 API Key",
  setup_label: "DeepSeek API Key",
  setup_placeholder: "sk-...",
  setup_start: "启动",
  setup_saving: "保存中...",
  setup_note: "你的 Key 仅存储在本地 ~/.reasonix/config.json，不会发送到任何其他服务器。",

  // StatusBar
  status_working: "工作中...",
  status_cache_hit: "🎯 缓存命中率",
  status_prompt: "📥 Prompt tokens",
  status_completion: "📤 Completion tokens",
  status_cost: "💰 费用",
  status_balance: "🏦 余额",

  // Composer
  composer_placeholder: "告诉 Reasonix 你想做什么... (Enter 发送, Shift+Enter 换行)",
  composer_busy: "Reasonix 正在思考... (Esc 终止)",
  composer_send: "↑ 发送",
  composer_stop: "■ 停止",
  composer_open_folder: "打开文件夹",
  composer_settings: "设置",
  composer_sidebar: "侧边栏",

  // Sidebar
  sidebar_title: "Reasonix",
  sidebar_tab_files: "📁 文件",
  sidebar_tab_context: "🧠 上下文",
  sidebar_tab_sessions: "会话",
  sidebar_tab_mcp: "MCP",
  sidebar_tab_skills: "Skills",
  sidebar_tab_memory: "🧠 记忆",
  sidebar_new_chat: "+ 新建会话",
  sidebar_rename: "重命名",
  sidebar_delete: "删除",
  sidebar_no_files: "尚未打开文件夹，点击 📂 打开一个。",
  sidebar_no_sessions: "暂无会话",
  sidebar_empty_dir: "空目录",
  sidebar_loading: "加载中...",
  sidebar_mcp_add: "+ 添加 MCP 服务器",
  sidebar_mcp_empty: "未配置 MCP 服务器",
  sidebar_skills_empty: "未注册 Skills",
  sidebar_memory_empty: "暂无记忆",

  // Messages
  msg_you: "你",
  msg_reasonix: "Reasonix",
  msg_thinking: "思考中...",
  msg_copy: "📋 复制",
  msg_retry: "🔄 重试",
  msg_edit: "✏️ 编辑",
  msg_edit_cancel: "取消",
  msg_edit_resend: "重新发送",
  msg_error_prefix: "⚠",

  // Approval
  approval_shell_title: "允许执行 Shell 命令？",
  approval_run_once: "✓ 运行一次",
  approval_allow_always: "⚡ 总是允许",
  approval_deny: "✕ 拒绝",
  approval_path_title: "允许访问文件？",
  approval_path_allow: "✓ 允许本次",

  // Plan
  plan_approve_title: "批准此计划？",
  plan_approve: "✓ 批准",
  plan_reject: "✕ 拒绝",
  plan_active: "执行中的计划",
  plan_step_pending: "等待",
  plan_step_waiting: "等待",
  plan_step_active: "进行中",
  plan_step_done: "完成",
  plan_step_failed: "失败",
  plan_high_risk: "高风险",
  plan_med_risk: "中风险",
  plan_steps: "步",
  plan_step_label: "步骤",

  // Checkpoint
  checkpoint_title: "步骤完成",
  checkpoint_continue: "▶ 继续",
  checkpoint_stop: "⏹ 停止计划",
  checkpoint_revise: "🔀 修订",

  // Revision
  revision_title: "计划修订",
  revision_why: "原因",
  revision_current: "当前步骤",
  revision_revised: "修订步骤",
  revision_accept: "✓ 接受",
  revision_reject: "✕ 拒绝",

  // Choice
  choice_cancel: "取消",
  choice_custom_placeholder: "或输入自定义内容...",
  choice_send: "发送",

  // CommandPalette
  palette_placeholder: "输入命令...",
  palette_empty: "未找到匹配命令",
  palette_footer_nav: "↑↓ 导航",
  palette_footer_exec: "↵ 执行",
  palette_footer_esc: "Esc 关闭",
  palette_cat_session: "会话",
  palette_cat_workspace: "工作区",
  palette_cat_preferences: "偏好",
  palette_cat_view: "视图",
  palette_cat_agent: "Agent",
  palette_cmd_new_chat: "新建会话",
  palette_cmd_open_folder: "打开文件夹",
  palette_cmd_settings: "设置",
  palette_cmd_toggle_theme: "切换主题",
  palette_cmd_toggle_lang: "切换语言 / Switch Language",
  palette_cmd_toggle_sidebar: "切换侧边栏",
  palette_cmd_abort: "终止 Agent",
  palette_cmd_retry: "重试上条消息",
  palette_cmd_compact: "压缩历史",
  palette_cmd_sessions: "列出会话",
  palette_cmd_clear: "清空消息",

  // Dashboard
  dashboard_start: "🚀 开始新任务",
  dashboard_greeting_night: "夜深了，还在写代码呢？",
  dashboard_greeting_morning: "早上好！今天要为这个项目做些什么？",
  dashboard_greeting_afternoon: "下午好！继续推进项目吧。",
  dashboard_greeting_evening: "晚上好！来整理一下今天的进度？",
  dashboard_git_title: "📊 Git 状态",
  dashboard_git_modified: "已修改",
  dashboard_git_added: "已添加",
  dashboard_git_deleted: "已删除",
  dashboard_git_untracked: "未跟踪",
  dashboard_git_more: "... 还有更多",

  // WhaleActions
  whale_title: "需要继续吗？",
  whale_sub: "点击建议继续对话",
  whale_explain: "📖 解释这段代码",
  whale_improve: "🔧 优化建议",
  whale_review: "🔍 审查变更",
  whale_test: "🧪 编写测试",
  whale_fix: "🩹 修复错误",
  whale_next: "🚀 接下来做什么？",
  whale_summarize: "📋 总结本次会话",
  whale_explain_prompt: "解释这段代码做了什么以及如何工作。",
  whale_improve_prompt: "审查代码并提出可读性、性能和正确性方面的改进建议。",
  whale_review_prompt: "审查你刚才做的修改——有没有遗漏的问题或边界情况？",
  whale_test_prompt: "为你刚修改的代码编写测试。",
  whale_fix_prompt: "检查命令输出并修复出现的任何错误。",
  whale_next_prompt: "对这个项目接下来应该做什么？",
  whale_summarize_prompt: "总结一下本次会话中我们做了什么。",

  // Jobs
  jobs_title: "后台任务",
  jobs_count: "运行中 · 已完成",
  jobs_empty: "无后台任务",
  jobs_exit: "退出码",

  // Tool calls
  tool_args: "参数",
  tool_result: "结果",
  tool_lines: "行",
  tool_show_all: "显示全部",
  tool_collapse: "收起",
  tool_no_matches: "无匹配",
  tool_results: "条结果",
  tool_showing_first: "显示前",
  tool_search_click: "点击复制路径",

  // Settings
  settings_title: "设置",
  settings_api_key: "API Key",
  settings_api_hint: "配置于 ~/.reasonix/config.json",
  settings_model: "模型",
  settings_preset: "预设",
  settings_preset_flash: "Flash (快速 & 便宜)",
  settings_preset_pro: "Pro (最佳质量)",
  settings_budget: "预算 (USD，留空=无限)",
  settings_edit_mode: "编辑模式",
  settings_edit_review: "Review (展示 diff)",
  settings_edit_auto: "Auto (直接应用)",
  settings_edit_yolo: "YOLO (跳过确认)",
  settings_workspace: "工作目录",
  settings_browse: "浏览",
  settings_version: "版本",
  settings_save: "保存",
  settings_cancel: "取消",

  // Context Panel
  ctx_token_usage: "📊 Token 用量",
  ctx_token_system: "系统",
  ctx_token_history: "历史",
  ctx_token_tools: "工具",
  ctx_token_total: "总计",
  ctx_modified: "✏️ 已修改",
  ctx_in_context: "📖 上下文中",
  ctx_no_files: "尚无文件在上下文中，发送消息开始使用。",

  // File tree
  filetree_empty: "空目录",
  filetree_loading: "加载中...",

  // Diff
  diff_copy: "📋 复制",
  diff_raw: "原始",
  diff_diff: "差异",

  // Misc
  misc_all: "全部",
  misc_confirm: "确认",
  misc_resend: "重新发送",
  misc_rename_placeholder: "新名称...",
  misc_msg_unit: "条消息",
  misc_tools_unit: "个工具",
} satisfies Record<string, string>;

const en: typeof zh = {
  setup_welcome: "Welcome to Reasonix",
  setup_subtitle: "DeepSeek-native AI coding agent",
  setup_hint_prefix: "Get your API key at ",
  setup_hint_link: "platform.deepseek.com",
  setup_hint_suffix: "",
  setup_label: "DeepSeek API Key",
  setup_placeholder: "sk-...",
  setup_start: "Start",
  setup_saving: "Saving...",
  setup_note: "Your key is stored locally in ~/.reasonix/config.json and never sent anywhere except api.deepseek.com.",

  status_working: "Working...",
  status_cache_hit: "🎯 Cache hit rate",
  status_prompt: "📥 Prompt tokens",
  status_completion: "📤 Completion tokens",
  status_cost: "💰 Cost",
  status_balance: "🏦 Balance",

  composer_placeholder: "Ask Reasonix to do something... (Enter to send, Shift+Enter for newline)",
  composer_busy: "Reasonix is thinking... (Esc to abort)",
  composer_send: "↑ Send",
  composer_stop: "■ Stop",
  composer_open_folder: "Open folder",
  composer_settings: "Settings",
  composer_sidebar: "Sidebar",

  sidebar_title: "Reasonix",
  sidebar_tab_files: "📁 Files",
  sidebar_tab_context: "🧠 Context",
  sidebar_tab_sessions: "Sessions",
  sidebar_tab_mcp: "MCP",
  sidebar_tab_skills: "Skills",
  sidebar_tab_memory: "🧠 Memory",
  sidebar_new_chat: "+ New Chat",
  sidebar_rename: "Rename",
  sidebar_delete: "Delete",
  sidebar_no_files: "No folder opened. Click 📂 to open one.",
  sidebar_no_sessions: "No sessions yet",
  sidebar_empty_dir: "Empty directory",
  sidebar_loading: "Loading...",
  sidebar_mcp_add: "+ Add MCP Server",
  sidebar_mcp_empty: "No MCP servers configured",
  sidebar_skills_empty: "No skills registered",
  sidebar_memory_empty: "No memories stored",

  msg_you: "You",
  msg_reasonix: "Reasonix",
  msg_thinking: "Thinking...",
  msg_copy: "📋 Copy",
  msg_retry: "🔄 Retry",
  msg_edit: "✏️ Edit",
  msg_edit_cancel: "Cancel",
  msg_edit_resend: "Resend",
  msg_error_prefix: "⚠",

  approval_shell_title: "Allow shell command?",
  approval_run_once: "✓ Run once",
  approval_allow_always: "⚡ Always allow",
  approval_deny: "✕ Deny",
  approval_path_title: "Allow file access?",
  approval_path_allow: "✓ Allow once",

  plan_approve_title: "Approve plan?",
  plan_approve: "✓ Approve",
  plan_reject: "✕ Reject",
  plan_active: "Active Plan",
  plan_step_pending: "Pending",
  plan_step_waiting: "Waiting",
  plan_step_active: "In progress",
  plan_step_done: "Done",
  plan_step_failed: "Failed",
  plan_high_risk: "HIGH RISK",
  plan_med_risk: "MED RISK",
  plan_steps: "steps",
  plan_step_label: "Step",

  checkpoint_title: "Complete",
  checkpoint_continue: "▶ Continue",
  checkpoint_stop: "⏹ Stop plan",
  checkpoint_revise: "🔀 Revise",

  revision_title: "Plan revision",
  revision_why: "Why:",
  revision_current: "Current steps",
  revision_revised: "Revised steps",
  revision_accept: "✓ Accept",
  revision_reject: "✕ Reject",

  choice_cancel: "Cancel",
  choice_custom_placeholder: "Or type your own answer...",
  choice_send: "Send",

  palette_placeholder: "Type a command...",
  palette_empty: "No commands found",
  palette_footer_nav: "↑↓ Navigate",
  palette_footer_exec: "↵ Execute",
  palette_footer_esc: "Esc Close",
  palette_cat_session: "Session",
  palette_cat_workspace: "Workspace",
  palette_cat_preferences: "Preferences",
  palette_cat_view: "View",
  palette_cat_agent: "Agent",
  palette_cmd_new_chat: "New Chat",
  palette_cmd_open_folder: "Open Folder",
  palette_cmd_settings: "Settings",
  palette_cmd_toggle_theme: "Toggle Theme",
  palette_cmd_toggle_lang: "切换语言 / Switch Language",
  palette_cmd_toggle_sidebar: "Toggle Sidebar",
  palette_cmd_abort: "Abort Agent",
  palette_cmd_retry: "Retry Last Message",
  palette_cmd_compact: "Compact History",
  palette_cmd_sessions: "List Sessions",
  palette_cmd_clear: "Clear Messages",

  dashboard_start: "🚀 Start new task",
  dashboard_greeting_night: "Late night coding? Keep going!",
  dashboard_greeting_morning: "Good morning! What shall we work on today?",
  dashboard_greeting_afternoon: "Good afternoon! Let's push the project forward.",
  dashboard_greeting_evening: "Good evening! Time to review today's progress?",
  dashboard_git_title: "📊 Git Status",
  dashboard_git_modified: "Modified",
  dashboard_git_added: "Added",
  dashboard_git_deleted: "Deleted",
  dashboard_git_untracked: "Untracked",
  dashboard_git_more: "... and more",

  whale_title: "Want to do something?",
  whale_sub: "Click a suggestion to continue",
  whale_explain: "📖 Explain this code",
  whale_improve: "🔧 Suggest improvements",
  whale_review: "🔍 Review changes",
  whale_test: "🧪 Write tests",
  whale_fix: "🩹 Fix any errors",
  whale_next: "🚀 What's next?",
  whale_summarize: "📋 Summarize session",
  whale_explain_prompt: "Explain what this code does and how it works.",
  whale_improve_prompt: "Review the code and suggest improvements for readability, performance, and correctness.",
  whale_review_prompt: "Review the changes you just made — are there any issues or edge cases missed?",
  whale_test_prompt: "Write tests for the code you just modified.",
  whale_fix_prompt: "Check the command output and fix any errors that occurred.",
  whale_next_prompt: "What should I do next for this project?",
  whale_summarize_prompt: "Summarize what we've done in this session so far.",

  jobs_title: "Background Jobs",
  jobs_count: "running · done",
  jobs_empty: "No background jobs",
  jobs_exit: "exit",

  tool_args: "Arguments",
  tool_result: "Result",
  tool_lines: "lines",
  tool_show_all: "Show all",
  tool_collapse: "Collapse",
  tool_no_matches: "No matches",
  tool_results: "results",
  tool_showing_first: "showing first",
  tool_search_click: "Click to copy path",

  settings_title: "Settings",
  settings_api_key: "API Key",
  settings_api_hint: "Configured in ~/.reasonix/config.json",
  settings_model: "Model",
  settings_preset: "Preset",
  settings_preset_flash: "Flash (fast & cheap)",
  settings_preset_pro: "Pro (best quality)",
  settings_budget: "Budget (USD, empty = unlimited)",
  settings_edit_mode: "Edit Mode",
  settings_edit_review: "Review (show diffs)",
  settings_edit_auto: "Auto (apply directly)",
  settings_edit_yolo: "YOLO (skip confirmations)",
  settings_workspace: "Workspace",
  settings_browse: "Browse",
  settings_version: "Version",
  settings_save: "Save",
  settings_cancel: "Cancel",

  ctx_token_usage: "📊 Token Usage",
  ctx_token_system: "System",
  ctx_token_history: "History",
  ctx_token_tools: "Tools",
  ctx_token_total: "Total",
  ctx_modified: "✏️ Modified",
  ctx_in_context: "📖 In Context",
  ctx_no_files: "No files in context yet. Send a message to get started.",

  filetree_empty: "Empty directory",
  filetree_loading: "Loading...",

  diff_copy: "📋 Copy",
  diff_raw: "Raw",
  diff_diff: "Diff",

  misc_all: "All",
  misc_confirm: "Confirm",
  misc_resend: "Resend",
  misc_rename_placeholder: "New title...",
  misc_msg_unit: "msgs",
  misc_tools_unit: "tools",
};

const dicts: Record<Locale, typeof zh> = { zh, en };

// ─── Context ───

type LocaleCtx = {
  locale: Locale;
  t: (key: keyof typeof zh) => string;
  setLocale: (l: Locale) => void;
};

const LocaleContext = createContext<LocaleCtx>({
  locale: "zh",
  t: (k) => zh[k] ?? k,
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("reasonix-locale");
    return saved === "en" ? "en" : "zh";
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("reasonix-locale", l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: keyof typeof zh): string => {
      return dicts[locale][key] ?? key;
    },
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useT(): LocaleCtx {
  return useContext(LocaleContext);
}

// Re-export for convenience
export type { Locale as LocaleType };
export type TFunction = (key: keyof typeof zh) => string;
