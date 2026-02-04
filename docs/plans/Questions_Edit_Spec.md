# Module Spec: Modify Question (Edit Page)

**模块目标**: 提供一个表单页面，允许用户修改现有题目的所有属性（内容、元数据）。界面模拟 "填写试卷/表格" 的手绘风格。

## 1. 技术架构 (Tech Stack)

*   **UI 框架**: React + Tailwind CSS
*   **表单管理**: `react-hook-form`
*   **数据验证**: `zod`
*   **数据存储**: `dexie` (读取与更新)
*   **UI 组件**: Shadcn/UI (Form, Select, Textarea) - 需深度定制样式
*   **Markdown 编辑**: 简单的 Textarea 即可，或者轻量级 MD 编辑器 (如果不引入重型库)

## 2. 数据存储规范 (Data & State Schema)

### 2.1 Zod Validation Schema
用于表单校验，确保数据符合 `QuestionItem` 接口。

```typescript
import { z } from "zod";

const questionFormSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  questionType: z.enum(["Code", "Theory", "SystemDesign"]),
  difficulty: z.enum(["Simple", "Medium", "Hard"]),
  content: z.string().min(10, "Question content must be at least 10 characters"),
  tags: z.array(z.string()).max(5, "Max 5 tags allowed"),
  // source 字段通常保持只读，或仅允许特定修改
  source: z.enum(['user-import', 'ai-saved']).optional(),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;
```

## 3. 业务逻辑流程 (Implementation Logic)

### 3.1 初始化 (Initialization)
1.  **Load ID**: 从 URL 参数 `useParams()` 获取 `id`。
2.  **Fetch Data**: 调用 `db.questions.get(id)`。
    *   如果不存在: Redirect to `/questions` 并 Toast Error ("Question not found").
3.  **Populate Form**: 使用 `form.reset(data)` 回填表单数据。

### 3.2 表单交互 (Interaction)
*   **Topic/Type/Difficulty**: 使用定制样式的 Select 组件。
*   **Tags Input**:
    *   输入框 + Enter 添加 Tag。
    *   点击 Tag 旁边的 "x" 删除。
    *   限制最多 5 个。
*   **Content Editor**:
    *   Textarea 自动高度 (`react-textarea-autosize` 推荐，或原生 CSS field-sizing)。
    *   支持 Tab 键缩进 (可选优化)。

### 3.3 保存逻辑 (Save Changes)
*   **Trigger**: 用户点击 "Save Changes"。
*   **Process**:
    1.  `form.handleSubmit` 触发校验。
    2.  计算新内容的 Hash (可选: 如果需要维护 `contentHash` 用于去重逻辑，这里重新计算 SHA-256，或者简化处理暂不更新 Hash)。
    3.  **Update DB**:
        ```typescript
        await db.questions.update(id, {
          ...formData,
          // contentHash: newHash, // Optional
        });
        ```
    4.  **Feedback**: Toast Success ("Changes saved to notebook").
    5.  **Navigation**: 自动跳转回列表页 `/questions`。

## 4. UI/UX 样式规范 (Layout & Styling)

### 4.1 布局结构
*   **容器**: 居中布局，最大宽度 `max-w-2xl`。
*   **Header**: "Back" 链接 (类似手写笔记的返回箭头) + 标题 "Edit Question"。

### 4.2 表单组件样式 (Sketch Style)
为了符合 "铅笔风格"，不能使用默认的 Shadcn 边框。

*   **Input / Select / Textarea**:
    *   **Border**: `border-b-2 border-gray-400 bg-transparent` (下划线风格) 或 `border-2` 且带不规则圆角。
    *   **Focus**: 边框变为 `#1a1a1a` (Ink Black) 或 `#b89c66` (Gold)。
    *   **Font**: 输入内容使用 `font-montserrat` (模拟打印字体) 或手写字体。
*   **Labels**:
    *   使用 `font-playfair` (Serif)，加粗，看起来像印刷在纸上的字段名。

### 4.3 底部操作栏
*   **Cancel**: 幽灵按钮 (Ghost Button)，文字灰色。
*   **Save**: 实心按钮 (Solid Button)。
    *   背景: `#1a1a1a` (Ink Black)。
    *   文字: White。
    *   形状: 略微歪斜的矩形，模拟手工剪裁。

## 5. 路由集成 (Routing)

*   **Path**: `/questions/edit/:id`
*   **Guard**: 必须有有效 ID。

---

**Agent Note**: 在实现 Tags Input 时，可以复用 Shadcn 的 `Command` 组件魔改，或者手写一个简单的 input array controller。
