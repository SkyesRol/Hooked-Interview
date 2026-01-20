这份文档是专门为 **Coding Agent** 准备的技术规格说明书。它详细定义了 **Interview Room (面试进行中页)** 的数据流、UI 实现细节、存储逻辑以及核心的容错处理。

请将以下 Markdown 内容直接投喂给你的 Coding Agent。

---

# Technical Spec: Interview Room Module Implementation

**Target Component**: `src/pages/Interview.tsx` & `src/components/interview/*`
**Context**: This is the core interaction loop of the application. The user receives a question, writes code, and gets AI feedback.

## 1. 架构概述 (Architecture Overview)

此页面是典型的 **"Input -> Process -> Output"** 流程，但包含复杂的异步逻辑和数据持久化。

*   **Input (Data Source)**:
    1.  **AI Mode**: 调用 `lib/ai/client.ts` 实时生成题目。
    2.  **Local Mode**: 调用 `store/useQuestionStore.ts` (IndexedDB) 随机抽取题目。
*   **Process (Interaction)**: 用户在 `Editor` 中编写代码。
*   **Analysis (AI Core)**: 提交代码 -> 调用 LLM 进行评分 -> 正则通配 JSON -> 生成报告。
*   **Output (Persistence)**: 将完整交互记录（含 AI 生成的 Tags 和雷达图数据）存入 `store/useRecordStore.ts` (IndexedDB)。

---

## 2. 数据与状态管理 (Data & State)

### 2.1 页面局部状态 (`src/pages/Interview.tsx`)

使用 React `useState` 或 `useReducer` 管理当前面试周期的状态。

```typescript
type InterviewStep = 'INIT' | 'LOADING_QUESTION' | 'ANSWERING' | 'ANALYZING' | 'RESULT';

interface CurrentSessionState {
  step: InterviewStep;
  topic: string;           // e.g., 'Vue', 'React'
  questionData: {
    id: string;            // UUID
    content: string;       // Markdown formatted
    type: string;          // 'Code' | 'Theory'
    difficulty: string;  
    source: 'AI' | 'Local'; 
  } | null;
  userCode: string;        // Component state from Editor
  analysisResult: AnalysisResult | null; // See Schema 3.3 below
}
```

### 2.2 外部数据依赖
*   **Read**: `useSettingsStore` -> 获取 `apiKey`, `model`.
*   **Read**: `useQuestionStore` -> 用于 Local Mode 抽题。
*   **Write**: `useRecordStore` -> 面试结束时调用 `addRecord(record)`.

---

## 3. UI 详细设计 (UI Specifications)

遵循 **HUD / Clean Tech** 风格。布局采用 **Flex Column** (Mobile first) 或 **Grid** (Desktop)。

### 3.1 布局结构 (`src/components/interview/MainLayout.tsx`)
*   **Header**: 进度条 + 当前 Topic 徽章 (Badge)。
*   **Body** ( `flex-1 overflow-hidden` ):
    *   **Question Panel (Top/Left)**: 题目展示。
    *   **Editor Workspace (Bottom/Right)**: 答题区。
*   **Footer**: 操作栏 (Submit / Next / End)。

### 3.2 关键组件 Specs

#### A. QuestionCard (`components/interview/QuestionCard.tsx`)
*   **Input**: `content: string` (Markdown).
*   **Style**:
    *   背景色: `bg-card` (Shadcn variable) 或 `bg-slate-50 dark:bg-slate-900`.
    *   字体: `prose dark:prose-invert` 用于渲染 Markdown。
    *   修饰: 左侧添加 4px 彩色边框 (根据 Difficulty: Green/Yellow/Red)。

#### B. Robust Editor (`components/interview/Editor/index.tsx`)
*   **Requirement**: 解决 Monaco Editor 包体积大且不适配移动端的问题。
*   **Logic**:
    1.  检测 `UserAgent` 或屏幕宽度 (`useMediaQuery`).
    2.  **Mobile**: 渲染 `<SimpleEditor />` (封装的 `textarea` + 基本语法高亮组件，如 `react-simple-code-editor`).
    3.  **Desktop**: 使用 `React.lazy` 异步加载 `<MonacoWrapper />`。
    *   *Loading State*: 在 Monaco 加载完成前，显示一个带 Spinner 的 Skeleton 占位符。

#### C. AnalysisReport (`components/interview/AnalysisReport.tsx`)
这是“结果展示”的核心。
*   **Tabs**: 分为 `Evaluation` (评分) / `Reference` (参考答案).
*   **Charts**:
    *   使用 `recharts` 绘制雷达图 (RadarChart)。
    *   数据源对应 JSON 中的 `dimensions` 字段。
*   **Tags Display**:
    *   展示 AI 返回的 `techTags` (如 `["Hooks", "Memory Leak"]`)。
    *   样式: Badge 风格，颜色随机或基于 Hash。

---

## 4. 核心逻辑实现 (Core Logic Implementation)

### 4.1 智能出题逻辑 (Question Generation)
*   **Path**: `pages/Interview.tsx` -> function `handleStart()`
*   **Logic**:
    *   **If Local Mode**: `db.questions.where('topic').equals(currentTopic).toArray()` -> 随机取 1 个。
    *   **If AI Mode**:
        *   这里不直接调用 API，而是通过 `lib/ai/client.ts`。
        *   Prompt 引用 `lib/ai/prompts.ts` 中的 `GENERATE_QUESTION_PROMPT`。

### 4.2 鲁棒的 JSON 解析 (Robust AI Parsing)
这是系统稳定性的关键。AI 返回的数据往往包含杂质。

**File**: `lib/ai/parser.ts`

```typescript
export interface AIAnalysisResponse {
  score: number;
  dimensions: { 
    accuracy: number; 
    completeness: number; 
    logic: number; 
    codeQuality: number 
  };
  techTags: string[];
  comment: string;
  referenceAnswer: string;
}

/**
 * 此时传入的 text可能是:
 * "```json \n { "score": 80 ... } \n ``` Great job!"
 * 或者直接是 "{...}"
 */
export function cleanAndParseJSON(text: string): AIAnalysisResponse {
  try {
    // 1. 尝试直接 Parse (最快)
    return JSON.parse(text);
  } catch (e) {
    // 2. 正则提取：寻找第一个 `{` 和最后一个 `}`
    // [\s\S]*? 表示非贪婪匹配任意字符（包括换行）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
  
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        console.error("JSON Clean failed", text);
        throw new Error("AI output structure invalid");
      }
    }
    throw new Error("No JSON object found in AI response");
  }
}
```

### 4.3 数据持久化 (Storage Logic)
当用户点击“完成”或“下一题”时，触发保存。

**File**: `store/useRecordStore.ts` (Action)

```typescript
// 数据落地逻辑
async function saveInterviewResult(
  topic: string, 
  question: QuestionData, 
  userAnswer: string, 
  analysis: AIAnalysisResponse
) {
  // 1. 构建 Record 对象
  const record: InterviewRecord = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    topic: topic,
    questionContent: question.content,
    userAnswer: userAnswer,
    sourceType: question.source, // 'AI' or 'Local'
  
    // 核心：直接展平 AI 的分析结果
    evaluation: {
       score: analysis.score,
       // 这些 tags 将被 Dashboard 用于统计聚合
       techTags: analysis.techTags, 
       dimensions: analysis.dimensions,
       comment: analysis.comment,
       referenceAnswer: analysis.referenceAnswer
    }
  };

  // 2. 写入 IndexedDB
  await db.records.add(record);
}
```

---

## 5. 开发步骤 (Implementation Steps for Agent)

1.  **基础设施**:
    *   在 `lib/ai/` 下创建 `parser.ts`，粘贴上述 Regex 解析代码。
    *   在 `components/interview/Editor/` 下创建 `MonacoWrapper.tsx` (使用 `@monaco-editor/react`) 和 `SimpleEditor.tsx`。
2.  **UI 骨架**:
    *   创建 `QuestionCard` (Markdown 展示)。
    *   创建 `AnalysisReport` (结果展示，暂用 Mock 数据)。
3.  **主要逻辑 (`Interview.tsx`)**:
    *   实现 `fetchQuestion`：串联 API 调用或本地查询。
    *   实现 `submitAnswer`：状态切换 `ANSWERING -> ANALYZING`。
    *   在 `ANALYZING` 阶段：调用 API -> 接收 Text -> 调用 `cleanAndParseJSON` -> 存入 State。
4.  **收尾**:
    *   在 `ANALYZING` 成功后，调用 `saveInterviewResult` 写入数据库。
    *   处理 API 失败的情况（Toast 提示 + 允许重试）。