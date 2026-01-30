# Module Spec: Question Repository (List View)

**模块目标**: 构建一个沉浸式的题库浏览页面，支持对本地 IndexedDB 存储的海量题目进行高效检索、筛选和管理。视觉上延续 "Paper & Ink"（纸笔）风格。

## 1. 技术架构 (Tech Stack)

*   **UI 框架**: React + Tailwind CSS
*   **组件库**: Shadcn/UI (基础组件) + Framer Motion (卡片进场动效)
*   **状态管理**: `zustand` (管理筛选条件、分页状态)
*   **数据存储**: `dexie` (IndexedDB Wrapper，用于高性能查询)
*   **图标库**: `lucide-react` (Pencil, Trash, Filter icons)
*   **工具库**: `dayjs` (时间格式化 - 虽然本页不展示创建时间，但可能用于排序)

## 2. 数据存储规范 (Data & State Schema)

### 2.1 IndexedDB Schema (`db.questions`)
引用 `OverallPlans.md` 定义的 `QuestionItem`。列表页主要关注读取和筛选。

```typescript
// Dexie Table Schema
// db.version(1).stores({
//   questions: 'id, topic, questionType, difficulty, source, *tags, createdAt' 
// });
```

### 2.2 View State Store (`useQuestionListStore`)
用于管理页面的 UI 状态，确保用户从详情页返回时能保持筛选上下文。

```typescript
interface QuestionListState {
  // Filters
  searchQuery: string;
  selectedTopics: string[]; // e.g. ['React', 'Vue']
  difficultyFilter: Difficulty | 'All';
  
  // Pagination / Layout
  viewMode: 'grid' | 'list';
  page: number;
  pageSize: number;

  // Actions
  setSearchQuery: (query: string) => void;
  toggleTopic: (topic: string) => void;
  setDifficulty: (diff: Difficulty | 'All') => void;
  resetFilters: () => void;
}
```

## 3. 业务逻辑流程 (Implementation Logic)

### 3.1 初始化与数据加载 (Initialization)
1.  **Hook**: 使用 `useLiveQuery` (Dexie React Hook) 监听数据库变化。
2.  **Query Logic**:
    *   构建 Dexie Collection。
    *   应用 `filter()`:
        *   匹配 `searchQuery` (针对 content 或 topic)。
        *   匹配 `selectedTopics` (如果非空)。
        *   匹配 `difficultyFilter` (如果非 'All')。
    *   应用 `offset()` 和 `limit()` 进行分页。
    *   `.toArray()` 获取当前页数据。

### 3.2 筛选交互 (Filtering)
*   **Search**: 实时防抖 (Debounce 300ms) 搜索。
*   **Topic Filter**: 多选 Tag Cloud 形式。点击 toggle 选中状态。
*   **Reset**: "Clear All" 按钮重置所有筛选条件。

### 3.3 列表渲染 (Rendering)
*   **Empty State**: 如果查询结果为空，展示 "Empty Sketchbook" 插画（手绘风格空状态）。
*   **Loading State**: 骨架屏 (Skeleton)，模拟纸张加载的闪烁效果。
*   **Grid Layout**: 响应式网格 (Grid)。

### 3.4 删除逻辑 (Delete Action)
*   **Trigger**: 卡片上的 "Trash" 图标。
*   **Confirm**: 弹出 Shadcn `AlertDialog` (样式需魔改为手绘风格)。
    *   Title: "Erase this question?"
    *   Desc: "This action cannot be undone."
*   **Execute**: 调用 `db.questions.delete(id)`。
*   **Feedback**: Toast Success ("Question erased from notebook").

## 4. UI/UX 样式规范 (Layout & Styling)

遵循 "Paper & Ink" 设计语言。

### 4.1 布局容器
*   **背景**: `#fdfcf8` (Ivory Paper) + CSS Noise Texture。
*   **Header**:
    *   左侧: 手写体大标题 "Question Repository"。
    *   右侧: 搜索框 (下划线风格 input) + 筛选按钮。

### 4.2 题目卡片 (`QuestionCard`)
*   **容器**:
    *   背景: `bg-white`。
    *   边框: `border-2 border-gray-300`，使用 `border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px` 模拟手绘不规则矩形。
    *   阴影: 悬停时 `box-shadow: 2px 4px 12px rgba(0,0,0,0.08)`。
*   **内容区**:
    *   **Topic Badge**: 右上角，看起来像用马克笔圈起来的文字。
    *   **Content**: 限制 3 行 (`line-clamp-3`)。字体 `font-montserrat`。
    *   **Tags**: 底部 Pill 列表，淡灰色背景，手写字体。
*   **操作区 (Hover Reveal)**:
    *   鼠标悬停时，右下角浮现 "Edit" (Pencil) 和 "Delete" (Trash) 按钮。
    *   颜色: Edit (Blue Ink), Delete (Red Ink)。

## 5. 路由集成 (Routing)

*   **Path**: `/questions`
*   **Navigation**:
    *   点击 "Add New" -> 跳转 `/import` (Smart Import 页面，待定义)。
    *   点击 "Edit" -> 跳转 `/questions/edit/:id`。

---

**Agent Note**: 实现时请注意 Dexie 的 `useLiveQuery` 可能会在大量数据时有性能瓶颈，建议加上 `limit` 限制每次渲染数量。
