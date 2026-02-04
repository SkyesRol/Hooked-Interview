

请 Agent 仔细阅读 **"Reasoning (设计意图)"** 部分，这解释了为什么要采取特定的技术决策（如使用 IndexedDB 或特定的 Prompt 策略）。

# Integrated Project Plan: Frontend Interview AI (v2.0)

## 1. 项目概述 (Project Overview)

**项目名称**：Frontend Interview AI (Serverless SPA)

**核心目标**：构建一个纯前端、无后端的面试模拟应用。用户配置自己的 AI API (OpenAI/Compatible) 后，进行沉浸式面试模拟。

**技术架构决策 (Technical Stack)**：
*   **Framework**: React 19 + TypeScript + Vite.
*   **UI System**: Tailwind CSS + Shadcn UI + Framer Motion (用于 HUD 科技感动效).
*   **State Management**: `Zustand` (轻量级全局状态).
*   **Persistence (重要)**:
    *   **LocalStorage**: 仅存储轻量配置（API Key, Theme, Language）。
    *   **IndexedDB (via Dexie.js)**: 存储 **题库 (Question Bank)** 和 **面试记录 (History)**。
    *   *> Reasoning*: 面试记录包含大量文本（题目、代码、AI 评语），且用户可能导入数千道题。LocalStorage 的 5MB 限制极易被打爆，必须使用 IndexedDB。

---

## 2. 功能需求细化 (Functional Requirements)

### 2.1. 全局配置 (Global Settings)
*   **API 配置**：
    *   用户需输入 `Base URL` (如 DeepSeek, OpenAI), `API Key`, `Model Name`.
    *   **隐私安全**：前端必须明确提示 "API Key stored locally in your browser"。
    *   **连接性检查**：提供 "Test Connection" 按钮，发送 minimal request 验证配置有效性。

### 2.2 首页仪表盘 (Command Center)
*   **视觉风格**: **HUD (Head-Up Display)** 科技风格。
*   **组件结构**:
    -   **`StatsOverview` (智能雷达)**:
        -   **数据源**: 基于历史记录中 AI 自动打标的 `techTags`（见 Schema 设计）。
        -   **展示逻辑**: 动态聚合。例如，不仅仅展示 "React"，而是展示 "Hooks", "Component Design", "Performance" 等细粒度能力的雷达图。
    -   **`MasteryMatrix` (入口面板)**:
        -   展示主方向 (Vue/React/Node/TS) 的熟练度。
        -   交互：Hover 时面板浮起高亮，点击开始面试。

### 2.3. 面试页面 (Interview Room - 核心交互)
*   **UI 布局**：
    *   **Top**: 题目展示区 (Markdown 渲染)。
    *   **Center**: 代码编辑器。
        *   *> Tech Spec*: 采用 **双模式编辑器 (Dual Mode Editor)**。统一提供 Toggle 按钮允许用户在轻量级 `Textarea` (SimpleEditor) 和 `Monaco Editor` 之间切换。默认使用 `Textarea` 以确保极速响应和统一体验。移动端强制降级为 Textarea。
    *   **Bottom**: "提交回答" 按钮。
*   **交互逻辑**:
    1.  **出题阶段 (INIT)**:
        *   进入页面展示 `InterviewStarter`，提供 "AI Auto-Generate" 和 "Local Database" 两个非阻塞选项。
        *   **模式 A (AI 生成)**: 用户点击后调用 LLM 生成题目。
        *   **模式 B (本地题库)**: 用户点击后从 IndexedDB 中随机抽取。
    2.  **AI 解析阶段 (Robust Parsing)**:
        *   *> Reasoning*: LLM 输出很不稳定，经常会在 JSON 前后添加 "Here is your JSON" 或 Markdown 代码块。
        *   **策略**: 前端接收到响应后，**不要直接 parse**。必须使用 正则表达式 提取第一个 `{` 和最后一个 `}` 之间的内容，再进行 `JSON.parse`。
    3.  **结果展示**:
        *   显示分数、雷达图、评语。
        *   并将结果这里产生的细粒度 Tags 保存回数据库。

### 2.4 智能题目导入 (Smart Import)
*   **目标**: 允许用户构建专属题库。
*   **构建**: 根据题目所设计的JSON结构，生成一个网页，把对应JSON中元素所需的字段，属性，都做成可添加的HTML，让用户能够自由编辑与添加，可以选择直接粘贴JSON和从HTML输入两个路径完成添加题目的功能



### 2.5. 历史回顾与详情 (History & Review)

此模块用于闭环用户的学习路径：**练习 -> 评分 -> 回顾**。

*   **数据源 (Data Source)**:
    *   **Source**: `IndexedDB` -> `records` 表。
    *   **Access (Current Implementation)**:
        *   列表页：`store/useRecordStore.loadRecords()` 拉取 `db.records`（按 timestamp desc），并在删除后由 `removeRecord` 同步刷新 UI。
        *   详情页：`db.records.get(id)` 异步读取单条记录。

*   **UI 布局与交互**:
    该模块包含两个视图层级：**列表页** 和 **详情页**。

    #### A. 历史列表页 (`/history`)
    *   **布局**: 响应式 Grid 布局。
    *   **卡片设计 (`HistoryCard`)**:
        *   **Header**: 技术栈图标 + Topic (e.g., "React Hooks").
        *   **Body**: 题目摘要 (截取前 60 字符) + 提交时间 (Relative Time, e.g., "2 hours ago").
        *   **Footer**: 分数展示。
            *   *> Visual Spec*: 分数根据高低显示不同颜色 (Green > 80, Yellow > 60, Red < 60)。
    *   **交互**: 点击卡片挑战至详情页 (`/history/:id`)。
    *   **筛选器**: 顶部提供简单的 Tab 切换或下拉菜单，按 `topic` 筛选记录。

    #### B. 回顾详情页 (`/history/:id`)
    *   **核心策略**: **组件复用 (Component Reuse)**。
        *   不要重新写一套 UI。此页面本质上是 **"面试页面 (Interview Room)" 的只读快照**。
    *   **UI 结构**:
        1.  **题目区**: 复用 `<QuestionCard />`。
        2.  **代码区**: 复用 `<Editor />`，但强制开启 `readOnly={true}` 模式，禁止修改。
        3.  **分析报告**: 直接复用 `<AnalysisReport />`，展示当时 AI 生成的完整评价、雷达图和参考答案。
    *   **操作栏**:
        *   **删除记录**: 允许用户删除该条数据 (同步删除 IndexedDB)。
        *   **错题重练**: 一个 "Retry" 按钮，携带当前题目内容跳转回 `/interview`，重新开始新的会话。

*   **Reasoning (设计意图)**:
    1.  **为什么强调复用？** 详情页和面试结果页在视觉上是 95% 一致的。通过 Props 控制（如 `<InterviewLayout mode="read-only" />`），可以极大地减少代码维护成本。
    2.  **数据流完整性**: 通过 IndexedDB 的持久化，用户即使刷新页面，回顾内容也不会通过 API 重新请求，而是直接从本地读取，零费用且速度极快。

---

## 3. 数据结构设计 (Schema)

**Agent Note**: 请注意 Store 的分层设计。配置走 LocalStorage，大数据走 IndexedDB。

### 3.1 Settings Store (`localStorage` via Zustand)
```ts
interface SettingsState {
  apiKey: string;
  baseUrl: string; // Default: https://api.openai.com/v1
  model: string;   // Default: gpt-3.5-turbo
}
```

### 3.2 Question Store (`IndexedDB/Dexie` - Table: `questions`)
用于存储海量本地题目。

```ts
export type Difficulty = 'Simple' | 'Medium' | 'Hard';
export type QuestionType = "Code" | "Theory" | "SystemDesign";

export interface QuestionItem {
  id: string;          // UUID
  contentHash: string; // [New] 内容指纹，用于去重
  topic: string;       // e.g. 'Vue', 'React', 'Algorithm'
  content: string;     // Markdown description
  questionType?: QuestionType; // [New] 题目类型
  difficulty: Difficulty;
  source: 'user-import' | 'ai-saved'; // 标记来源
  tags?: string[];     // e.g. ['Hooks', 'VirtualDOM']
  createdAt: number;
}
```

### 3.3 Record Store (`IndexedDB/Dexie` - Table: `records`)

```ts
interface InterviewRecord {
  id: string;      
  timestamp: number;
  topic: string;      // 面试时选择的大方向
  sourceType?: "AI" | "Local";
  questionId?: string;
  difficulty?: Difficulty; // 便于回放/重练展示
  questionType?: string;   // e.g. "Code" | "Theory" | "SystemDesign"

  questionContent: string; 
  userAnswer: string; // 用户的代码/回答

  // 评分结果 (AI Output)
  evaluation: {
    score: number;
    // [New] 动态维度，用于 Dashboard 雷达图聚合
    techTags: string[]; // e.g., ["Closure", "Memory Management"]
  
    // 固定维度，用于单次展示
    dimensions: { 
        accuracy: number; 
        completeness: number; 
        logic: number; 
        codeQuality: number 
    };
  
    comment: string;
    referenceAnswer: string;
  };
}
```

---

## 4. AI 交互逻辑 (Prompt Engineering)

**Agent Note**: 为什么要让模型输出 JSON？
1.  **Frontend Rendering**: 前端需要具体的 `score` 数字来渲染进度条，需要 `techTags` 数组来绘制图表。纯文本无法实现这些 UI 效果。
2.  **Structured Storage**: 我们需要对用户的特定能力（如 "React Hooks"）进行长期追踪，非结构化文本无法被数据库索引和统计。

### 场景 1：生成题目 (Generate Question)
> **Prompt Instructions:**
> *   **Role**: Senior Frontend Interviewer from Big Tech.
> *   **Constraint**: Output **JSON ONLY**. Do NOT wrap in markdown blocks like \`\`\`json.
> *   **Goal**: Generate a question for topic: `${topic}`.
>
> **Output JSON Schema (Strict):**
> ```json
> {
>   "type": "Code" | "Theory" | "SystemDesign",
>   "difficulty": "Simple" | "Medium" | "Hard",
>   "question": "Markdown formatted question content here."
> }
> ```

### 场景 2：评分 (Evaluation) - **Critical**
此 Prompt 增加了 `techTags` 的提取要求，这对 Dashboard 的展示至关重要。

> **System Prompt**: You are a strict technical interviewer.
>
> **User Prompt**:
> **Context**:
> - Topic: ${topic}
> - Question: ${question}
> - Candidate Answer: ${userAnswer}
>
> **Task**: Evaluate the answer and return a JSON object.
>
> **JSON Schema Requirements**:
> 1.  `score`: 0-100 Integer.
> 2.  `dimensions`: Object with `accuracy`, `completeness`, `logic`, `codeQuality` (0-10).
> 3.  `techTags`: Array of strings. Identify 2-4 key technical concepts involved (e.g. ["Event Loop", "Promise"]). **This is important for analytics.**
> 4.  `comment`: String. Brief feedback.
> 5.  `referenceAnswer`: String. The optimal solution in Markdown.
>
> **Constraint**: Return **RAW JSON ONLY**. No surrounding text, no markdown formatting.

---

## 5. 项目目录结构 (Directory Structure)

**Agent Note**: 为了保持代码的可维护性，我们将 AI 相关的逻辑拆分，不再堆积在一个文件里。

~~~text
src/
├── assets/
│   └── react.svg
├── components/
│   ├── dashboard/           # 首页仪表盘（HUD）
│   │   ├── MasteryMatrix.tsx
│   │   ├── StatsOverview.tsx
│   │   └── TechPanel.tsx
│   ├── history/             # 历史回顾
│   │   └── HistoryCard.tsx
│   ├── interview/           # 面试核心页（出题/作答/评分/展示）
│   │   ├── Editor/          # 双模式编辑器封装（Textarea + Monaco），支持 readOnly
│   │   │   ├── index.tsx
│   │   │   ├── MonacoWrapper.tsx
│   │   │   └── SimpleEditor.tsx
│   │   ├── AnalysisReport.tsx
│   │   ├── InterviewStarter.tsx # 面试启动器 (AI/Local 选择)
│   │   ├── MainLayout.tsx   # 可复用布局（支持自定义 backTo/title）
│   │   └── QuestionCard.tsx
│   ├── import/              # 智能导入题库模块
│   │   ├── JsonPaste.tsx
│   │   ├── ManualEntryForm.tsx
│   │   ├── StagingList.tsx
│   │   └── types.ts
│   ├── shared/
│   │   ├── MarkdownRenderer.tsx
│   │   └── ProtectedRoute.tsx
│   └── ui/                  # 轻量 Shadcn 风格基础组件
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── progress.tsx
│       ├── select.tsx
│       └── tooltip.tsx
├── constants/
│   └── topics.ts
├── hooks/
│   ├── useMediaQuery.ts
│   └── useTheme.ts
├── lib/
│   ├── ai/                  # AI 逻辑拆分
│   │   ├── client.ts
│   │   ├── normalizeBaseUrl.ts
│   │   ├── parser.ts
│   │   └── prompts.ts
│   ├── db.ts                # Dexie(IndexedDB) Schema 与类型定义
│   └── utils.ts
├── services/
│   └── importValidation.ts  # 智能导入的校验与去重逻辑
├── pages/
│   ├── Home.tsx
│   ├── Interview.tsx
│   ├── Settings.tsx
│   ├── History.tsx          # /history
│   ├── HistoryDetail.tsx    # /history/:id
│   └── Import.tsx           # 智能导入页
├── store/
│   ├── useQuestionStore.ts
│   ├── useRecordStore.ts
│   └── useSettingsStore.ts
├── App.tsx                  # 当前路由配置在这里（尚未抽到 src/router）
├── main.tsx
├── index.css
└── vite-env.d.ts
~~~

---

## 6. 开发路径与关键实现策略 (Implementation Strategy)

### 6.1 阶段一：数据层 (Data Layer)
*   **任务**: 初始化 Dexie 数据库。
*   **细节**: 定义 `questions` 和 `records` 两张表。实现 `addQuestion` (含去重逻辑) 和 `saveRecord` 方法。

### 6.2 阶段二：AI 基础设施 (AI Infra)
*   **任务**: 实现 Robust AI Client。
*   **Parser 实现细节**:
    ```typescript
    // lib/ai/parser.ts
    export function cleanAndParseJSON(raw: string) {
        // 1. 尝试直接 parse
        try { return JSON.parse(raw); } catch {}
      
        // 2. 正则提取最外层 {}
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
            try { return JSON.parse(match[0]); } catch {}
        }
      
        throw new Error("Failed to parse AI response");
    }
    ```

### 6.3 阶段三：UI 与 业务逻辑
*   **面试页**: 将 `useStream` (若有) 改为 `useAsync`，配合 Loading 状态，因为我们需要等待完整的 JSON 返回才能渲染图表。
*   **Dashboard**: 读取 IndexedDB 中的所有 records，提取所有的 `techTags`，计算每个 Tag 的平均分，传递给 Recharts 渲染。


