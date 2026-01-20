# Module Spec: Home Dashboard (Skill Matrix & Analytics)

**模块目标**: 作为应用的 "Command Center" (指挥中心)。不仅仅是导航入口，更是一个数据驱动的仪表盘，通过 HUD (Head-Up Display) 风格和图表反馈，展示用户在各个技术领域的“战力值”。

## 1. 核心功能与组件拆分 (Core Features & Components)

对应目录: `src/components/dashboard/`

### 1.1 总体布局 (Layout)
页面分为上下两个主要区域：
1.  **Top Section (StatsOverview)**: 全局能力概览（雷达图 + 核心指标）。
2.  **Main Section (MasteryMatrix)**: 具体技术栈的卡片矩阵。

### 1.2 组件详细规范

#### A. `StatsOverview.tsx` (顶部数据看板)
*   **功能**: 让用户一眼看到自己的综合实力。
*   **UI 构成**:
    *   **左侧**: **"Capability Radar" (能力雷达图)**。使用 `Recharts` 绘制六边形雷达图，展示 Vue, React, TS, JS, CSS, Node 六大核心维度的平均分。
    *   **右侧**: **"Key Metrics" (关键指标)**。
        *   Total Questions: 已刷题总数。
        *   Global Average: 所有方向的平均准确率。
        *   Streak: (可选) 连续打卡天数。
*   **交互**: 静态展示，带简单的入场动画。

#### B. `MasteryMatrix.tsx` (技能矩阵容器)
*   **功能**: 负责渲染响应式网格布局。
*   **布局**:
    *   `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`。
    *   遍历常量 `TECH_STACKS`，为每个技术栈渲染一个 `TechPanel`。

#### C. `TechPanel.tsx` (技术栈面板 - 核心交互单元)
*   **视觉风格**: **HUD System Panel** (非传统卡片)。
    *   背景: 深色半透明/磨砂感 (Use `bg-card/50` + `backdrop-blur`).
    *   边框: 默认微弱，Hover 时高亮 (`hover:border-primary`).
*   **Props**:
    ```typescript
    interface TechPanelProps {
      tech: string;        // e.g. "React"
      icon: LucideIcon;
      stats: {
        count: number;     // 已完成题目
        avgScore: number;  // 平均分
        lastActive?: string; // "2 hours ago"
      };
      onClick: () => void;
    }
    ```
*   **内部元素**:
    *   **Header**: 图标 + 标题。
        *   *状态标识*: 如果 `avgScore > 90`，显示 "Master" 金色勋章图标。
    *   **Progress Bar**: 自定义样式的 Shadcn Progress。
        *   Logic: 颜色随分数变化 (Red < 60, Yellow < 80, Green > 80)。
    *   **Footer**: "X 题已归档"。
*   **Hover交互**:
    *   鼠标悬停时，Card 轻微上浮 (`-translate-y-1`)。
    *   **Action Overlay**: 可能会显示 "Deploy Interview" (开始面试) 的按钮。

## 2. 数据逻辑 (Data Logic & Store)

### 2.1 Selector 设计 (`useRecordStore`)
为了避免在组件中写复杂的过滤逻辑，Store 应提供 Memoized Selector。

```typescript
// in store/useRecordStore.ts

// 1. 获取特定技术栈的统计
const getTopicStats = (topic: string) => {
  const records = get().records.filter(r => r.topic === topic);
  if (records.length === 0) return { count: 0, avgScore: 0 };

  const totalScore = records.reduce((acc, r) => acc + r.score, 0);
  return {
    count: records.length,
    avgScore: Math.round(totalScore / records.length)
  };
};

// 2. 获取雷达图数据 (Top 6 Topic Scores)
const getRadarData = () => {
  // 返回格式: [{ subject: 'Vue', A: 80, fullMark: 100 }, ...]
  // 供 Recharts 使用
};
```

## 3. 业务流程 (Business Flow)

1.  **Mount**:
    *   `useEffect` 检查 `useSettingsStore.apiKey`。若无，Redirect to `/settings`。
    *   从 LocalStorage Hydrate 数据。
2.  **Dashboard Render**:
    *   计算总分、雷达图数据 -> 渲染 `StatsOverview`。
    *   遍历 Tech List -> 计算单项数据 -> 渲染 `MasteryMatrix`。
3.  **Start Interview**:
    *   User Click `TechPanel(React)`.
    *   App Navigates to `/interview/react`.
    *   (Reset previous interview state if any).

## 4. 关键样式类 (Tailwind Presets)

为了统一“科技感”，建议定义以下工具类：

*   **Grid Panel**:
    `relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-card/50 p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50`
*   **Score Badge (High)**:
    `inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500 ring-1 ring-inset ring-green-500/20`
*   **Score Badge (Low)**:
    `inline-flex items-center rounded-full bg-red-400/10 px-2.5 py-0.5 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20`

## 5. 预期目录结构映射
```text
src/pages/Home.tsx             # 页面入口，负责 Layout 组合
src/components/dashboard/
├── StatsOverview.tsx          # 包含 Recharts 雷达图
├── MasteryMatrix.tsx          # 网格布局容器
└── TechPanel.tsx              # 单个面板组件
```