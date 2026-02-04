# Technical Spec: Smart Import Module (Phase 1)

**Target Components**: `src/pages/Import.tsx`, `src/components/import/*`
**Context**: This module provides a GUI and JSON parser for users to build their local question bank.
**Note on Deduplication**: Advanced semantic deduplication (using Embeddings) is **OUT OF SCOPE** for this phase. We will implement a placeholder exact-match logic only.

## 1. 架构设计 (Architecture)

采用 **三段式流水线** 设计，确保未来扩展逻辑时无需重写 UI 交互。

1.  **Input Source**: (Manual Form / JSON Paste)
2.  **Middleware (Processing)**:
    *   Parsing
    *   Validation
    *   **Deduplication (Interface Only)** -> *Currently implements Exact String Match.*
3.  **Staging Area**: User reviews before writing to DB.

### 1.1 数据结构 (Interfaces)

```typescript
// src/components/import/types.ts

// The item waiting for user confirmation
export interface StagedItem {
  _tempId: string; // generated UUID for UI list keys
  status: 'valid' | 'duplicate' | 'error';
  errorMsg?: string;
  source: 'manual' | 'json';

  // The actual data payload to be saved
  payload: {
    topic: string;
    difficulty: 'Simple' | 'Medium' | 'Hard';
    content: string; 
    tags: string[];
  }
}
```

---

## 2. 预留接口设计 (Future-Proof Logic)

为了方便未来迁移到 Embedding 方案，请将校验逻辑抽离为独立的 Service 函数，而不是写死在组件里。

### 2.1 校验服务 (`src/services/importValidation.ts`)

**Requirement**: Create a function `validateAndCheckDuplicates` that accepts raw inputs and returns `StagedItem`.

```typescript
// Placeholder logic for Phase 1
export async function validateAndCheckDuplicates(
  rawItems: RawInput[], 
  existingQuestions: Question[] // Pass in current DB snapshot or query specific items
): Promise<StagedItem[]> {
  
    // 1. Basic Validation (Required fields)
    // ...

    // 2. Deduplication Strategy (Phase 1: EXACT MATCH ONLY)
    // TODO: Phase 2 - Replace this with Vector/Embedding similarity check
    const isDuplicate = (existing: Question[], incoming: RawInput) => {
        // Simple string comparison logic
        return existing.some(q => 
            q.content.trim() === incoming.content.trim() && 
            q.topic === incoming.topic
        );
    };

    // Return mapped items with status
}
```

---

## 3. UI 组件规范 (Component Specs)

### 3.1 页面容器 (`src/pages/Import.tsx`)
*   **State**: `stagedItems: StagedItem[]`.
*   **Layout**:
    *   **Header**: Title.
    *   **Tabs**: "Manual Entry" | "JSON Batch".
    *   **Staging List**: The preview area.
    *   **Footer**: "Commit" button (disabled if no valid items).

### 3.2 模式 A: 手动录入 (`src/components/import/ManualEntryForm.tsx`)
*   **Fields**: Topic (Select), Difficulty (Select), Content (Markdown Editor/Textarea), Tags (Input).
*   **Action**: "Add to Stage" -> Calls `validateAndCheckDuplicates` -> Updates Page State.

### 3.3 模式 B: JSON 粘贴 (`src/components/import/JsonPaste.tsx`)
*   **Input**: Large Textarea.
*   **Format**: Array of objects.
*   **Utils**: Ensure the parser handles common LLM output issues (stripping ` ```json ` fences).

### 3.4 暂存区列表 (`src/components/import/StagingList.tsx`)
*   **Visual**: Render a list of items.
*   **Status Handling**:
    *   If `status === 'duplicate'`: Show an Amber Badge "Exact Duplicate".
    *   If `status === 'valid'`: Show Green Check.
*   **Interaction**: Allow user to override logic (e.g., "Force Add" a duplicate) or Delete item.

---

## 4. 数据库交互 (Database Interaction)

*   **File**: `lib/db.ts`
*   **Write Operation**:
    *   Use `db.questions.bulkAdd()` for performance.
    *   Ensure all items receive a `createdAt` timestamp upon insertion.

---

## 5. 开发指令总结 (Summary for Agent)

1.  **Skip Semantic Search**: Do not install vector libraries or attempt fuzzy matching. Use `string === string` comparison for now.
2.  **Structure**: Isolate the validation logic in `src/services/importValidation.ts` so we can swap it out later without breaking the UI.
3.  **UI**: Focus on a clean "Input -> Preview -> Save" workflow.