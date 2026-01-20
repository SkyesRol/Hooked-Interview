# Frontend Interview AI（Serverless SPA）

一个纯前端、无后端的面试模拟应用：用户在浏览器中配置自己的 AI API（OpenAI / Compatible），即可进行沉浸式面试练习、评分与复盘；题库与历史记录全部落在本地 IndexedDB。

这个仓库也是一个 **Vibe + Spec 的实战项目**：用时约 4h 做出可用版本；主要时间消耗在等待 AI 答复；但 **Spec 的存在显著提升了生成的精确度**，让功能能按预期更稳定地落地。

## 功能概览

- Interview Room：出题 → 作答（代码编辑器）→ AI 评分 → 报告展示
- History：本地复盘历史记录（列表 / 详情）
- Smart Import：手动录入或粘贴 JSON 批量导入本地题库（Phase 1：精确去重）
- Settings：配置 Base URL / API Key / Model，并提供 Test Connection

## 技术栈

- Vite + React 19 + TypeScript
- Tailwind CSS（轻量 UI 基础组件）
- Zustand（全局状态）
- Dexie（IndexedDB 持久化：题库 questions / 历史 records）
- Monaco Editor（代码编辑器，含移动端降级）
- Recharts（Dashboard 雷达图）

## 快速开始

```bash
pnpm i
pnpm dev
```

可用脚本：

```bash
pnpm check   # tsc --noEmit
pnpm build
pnpm preview
```

## 使用指南

1. 先打开 `/settings` 配置 Base URL / API Key / Model，点击 “测试连接”
2. 回到首页选择方向开始面试（`/interview/:topic`）
3. 面试完成后会自动写入本地历史记录，可在 `/history` 回看
4. 在首页右下角进入 `/import`，通过手动或 JSON 批量导入本地题库

## 数据与隐私说明

- API Key 仅存储在本地浏览器（localStorage），不会上传到任何服务器
- 题库与历史记录存储在浏览器 IndexedDB（通过 Dexie）
- 这是纯前端应用：你的请求会从浏览器直连你填写的 Base URL（请确保是可信的 API 服务）

## 项目结构（核心）

```text
src/
  components/
    interview/   # 面试核心组件（编辑器/题目/报告等）
    history/     # 历史记录组件
    import/      # 智能导入（手动/JSON/暂存区）
  lib/
    ai/          # AI client / prompts / parser
    db.ts        # Dexie Schema（questions/records）
  pages/
    Home.tsx
    Interview.tsx
    History.tsx
    HistoryDetail.tsx
    Import.tsx
    Settings.tsx
```

## Vibe + Spec：这次实验的结论

- Vibe 让你“敢开始”：先把可用闭环跑通，再补细节
- Spec 让你“做得准”：关键接口/数据结构/边界写清楚后，AI 的生成质量会上一个台阶
- 真正耗时的往往不是写代码，而是等待与校对：Spec 能减少返工轮次，从而节省总体时间
