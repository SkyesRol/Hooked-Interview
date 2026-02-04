| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **构建/框架** | **Vite + React 19** | 追求极速的开发（HMR）和生产环境运行体验。 |
| **语言** | **TypeScript** | 核心。通过 Interface 强约束 AI 返回的非结构化数据（如 JSON 提取），减少运行时错误。 |
| **样式/UI** | **Tailwind CSS + Shadcn/UI** | 现代化 Dashboard 风格。Shadcn 的组件源码可控性便于我们在 Textarea 或 Card 中插入流式动画。 |
| **图标** | **Lucide React** | 统一、轻量的 SVG 图标库。 |
| **状态管理** | **Zustand** | 极简状态管理。配合 `persist` 中间件存储 API Key 和刷题历史；配合 immer 处理流式数据的追加更新。 |
| **代码编辑** | **@monaco-editor/react** | 嵌入式 VS Code，提供语法高亮和缩进，提升答题体验。 |
| **Markdown** | **react-markdown + remark-gfm** | **(关键更新)** 用于渲染题目和 AI 解析。支持流式文本的实时渲染，利用 `remark-gfm` 支持 AI 生成的表格或特殊格式。 |
| **代码高亮** | **react-syntax-highlighter** | **(新增)** 配合 Markdown 组件，美化 AI 答案中的代码片段（如 Prism 风格）。 |
| **图表** | **Recharts** | 用于展示能力雷达图（六边形战士）和历史分数趋势折线图。 |
| **AI 交互** | **OpenAI SDK (Stream Mode)** | **(关键更新)** 配置 `stream: true`。放弃一次性 await，改用 `for await...of` 循环读取数据块 (Chunk)，极大降低用户感知的首字延迟 (TTFB)。 |
| **动画效果** | **Framer Motion** |  用于页面切换流畅度，以及流式输出时的光标闪烁效果或内容淡入效果。 |