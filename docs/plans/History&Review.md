这份文档详细规定了 **History 模块** 的构建细节。它重点强调了 **UI 复用策略** 和 **IndexedDB 数据流**。

请将以下 Markdown 内容提供给 Coding Agent。

---

# Technical Spec: History & Review Module Implementation

**Target Components**: `src/pages/History.tsx`, `src/pages/HistoryDetail.tsx`, `src/components/history/*`
**Context**: This module provides a retrospective view of the user's performance. It requires efficient local data fetching and component reuse from the Interview module.

## 1. 架构与数据策略 (Architecture & Data Strategy)

### 1.1 路由定义 (Routes)
在 `src/router/index.tsx` 中注册：
*   `/history` (List view)
*   `/history/:id` (Detail view - Read Only Snapshot)

### 1.2 数据存取 (Data Access)
*   **Dependency**: `store/useRecordStore.ts` & `lib/db.ts`
*   **Pattern**:
    *   **List Page**: 使用 `useLiveQuery` (Dexie hook) 监听 `db.records`，确保删除记录后 UI 自动刷新。
    *   **Detail Page**: 使用 `useEffect` + `db.records.get(id)` 异步获取单条数据。

---

## 2. 页面详细规范 (Page Specifications)

### 2.1 历史列表页 (`src/pages/History.tsx`)

#### A. 状态管理
```typescript
const [filterTopic, setFilterTopic] = useState<string>('All');
// Derived state: records filtered by topic
```

#### B. UI 布局 (Grid System)
*   **Container**: `p-6 max-w-7xl mx-auto space-y-6`.
*   **Header**: 标题 "Interview History" + **Filter Bar** (Shadcn `Select` or `Tabs`).
*   **Grid**:
    *   `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.
    *   **Empty State**: 如果没有记录，显示占位图 + "Start your first interview" 按钮 (Link to home).

#### C. 核心组件: `HistoryCard`
*   **Location**: `src/components/history/HistoryCard.tsx`
*   **Props**: `record: InterviewRecord`
*   **Visual Logic**:
    1.  **Header**:
        *   Left: Topic Icon (React/Vue/JS icons based on string match).
        *   Right: `DifficultyBadge` (Reuse from Import module).
    2.  **Body**:
        *   Title: `record.topic`.
        *   Snippet: `record.questionContent.slice(0, 60)...` (Remove markdown syntax if possible, or just plain text).
        *   Time: `formatDistanceToNow(record.timestamp)` (Use `date-fns`).
    3.  **Footer (Score)**:
        *   Use a helper function `getScoreColor(score)`:
            *   >= 80: `text-green-600 bg-green-50`
            *   60-79: `text-yellow-600 bg-yellow-50`
            *   < 60: `text-red-600 bg-red-50`
        *   Display: Score number + Progress bar (mini).

---

### 2.2 回顾详情页 (`src/pages/HistoryDetail.tsx`)

此页面必须严格执行 **"只读快照 (Read-Only Snapshot)"** 策略。

#### A. 组件复用策略 (Component Reuse Strategy)
不要重写布局。应重构 `src/components/interview/MainLayout.tsx` (或者在 Interview 页面中抽离出的布局组件) 以接受 `mode` 属性。

**Target Layout Wrapper**:
```tsx
// concept in src/pages/HistoryDetail.tsx
if (!record) return <LoadingSkeleton />;

return (
  <div className="h-screen flex flex-col">
    {/* Header with Back Button and Score Badge */}
    <DetailHeader record={record} onDelete={handleDelete} onRetry={handleRetry} />
  
    <div className="flex-1 flex overflow-hidden">
        {/* Left: Question (Read Only) */}
        <div className="w-1/2 p-4 overflow-y-auto border-r">
             <QuestionCard content={record.questionContent} />
           
             {/* [Special Region] Reference Answer & Analysis */}
             <div className="mt-8 border-t pt-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                <h3 className="font-bold mb-4">AI Evaluation</h3>
                <AnalysisReport 
                    evaluation={record.evaluation} 
                    // Ensure the report component handles 'undefined' gracefully if loading
                /> 
             </div>
        </div>

        {/* Right: User Code (Read Only) */}
        <div className="w-1/2 flex flex-col">
             <div className="bg-slate-100 p-2 text-xs text-muted-foreground flex justify-between">
                <span>Snapshot Code</span>
                <span>Language: TypeScript</span>
             </div>
             <Editor 
                value={record.userAnswer} 
                readOnly={true} // VITAL: Disable editing
                height="100%"
             />
        </div>
    </div>
  </div>
);
```

#### B. 操作逻辑 (Action Logic)

1.  **Delete Record**:
    *   User clicks "Delete" -> Confirm Dialog -> `await db.records.delete(id)` -> `navigate('/history')`.
2.  **Retry (错题重练)**:
    *   **Goal**: Start a simple interview with **exactly same question**.
    *   **Implementation**:
        ```typescript
        const handleRetry = () => {
          navigate('/interview', { 
            state: { 
              // Pass data via Router State to populate Interview Page
              retryMode: true,
              topic: record.topic,
              fixedQuestion: {
                 content: record.questionContent,
                 type: 'Code', // default assumption
                 difficulty: 'Medium' 
              }
            } 
          });
        };
        ```
    *   *Note*: Update `Interview.tsx` initialization logic to check `location.state` before fetching a random question.

---

## 3. 开发步骤 (Implementation Steps for Agent)

1.  **Database Access**:
    *   Ensure `db.ts` exposes `records` table.
    *   Verify `InterviewRecord` interface matches the Schema defined in Section 3.3.

2.  **Components**:
    *   Create `src/components/history/HistoryCard.tsx`.
    *   Refactor `src/components/interview/Editor/index.tsx` to ensure it accepts `readOnly` prop and passes it down to Monaco/SimpleEditor.

3.  **List Page (`/history`)**:
    *   Implement `useLiveQuery` to fetch all records sorted by `timestamp` desc.
    *   Implement the Grid layout and Filter logic.

4.  **Detail Page (`/history/:id`)**:
    *   Fetch record by ID param.
    *   Assemble the "Snapshot View" using existing components (`QuestionCard`, `AnalysisReport`, `Editor`).
    *   Implement `Delete` and `Retry` actions.

5.  **Integration**:
    *   Add Link in `Sidebar` or `Header` to navigate to `/history`.

## 4. UI 细节规范 (Visual Specs)

*   **Colors**: 严格使用 `Shadcn` 定义的 `muted`, `accent`, `destructive` 语义化颜色。
*   **Typography**:
    *   List Page Titles: `font-semibold text-lg`.
    *   Dates: `text-sm text-muted-foreground`.
*   **Responsiveness**:
    *   在 Mobile view 下，Detail Page 应堆叠布局 (Question Top, Output Bottom)，而非左右分栏。