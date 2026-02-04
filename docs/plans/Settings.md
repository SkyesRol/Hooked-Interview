# Module Spec: Global AI Configuration (Settings Page)

**模块目标**: 构建一个安全的配置页面，允许用户输入和持久化 LLM 连接信息（API Key, Base URL, Model Name），并提供即时连接性测试功能。

## 1. 技术架构 (Tech Stack)

*   **UI 框架**: React + Tailwind CSS
*   **组件库**: Shadcn/UI (基于 Radix UI)
*   **表单管理**: `react-hook-form`
*   **数据验证**: `zod` (Schema Validation)
*   **状态管理**: `zustand` (配合 `persist` 中间件实现 LocalStorage 持久化)
*   **API 客户端**: `openai` (Node SDK)
*   **图标库**: `lucide-react`
*   **反馈组件**: `sonner` (Toast Notifications)

## 2. 数据存储规范 (Data & State Schema)

我们需要创建一个 Zustand Store 来管理全局设置，并定义 Zod Schema 来校验表单输入。

### 2.1 Zustand Store (`useSettingsStore`)
*   **Persistence**: 必须使用 `persist` 中间件，Key 设为 `frontend-interview-settings`。
*   **State Interface**:
    ```typescript
    interface SettingsState {
        apiKey: string;      // 默认为空字符串
        baseUrl: string;     // 默认: "https://api.openai.com/v1"
        model: string;       // 默认: "gpt-3.5-turbo"
        setSettings: (settings: Partial<SettingsState>) => void;
    }
    ```

### 2.2 Zod Validation Schema
*   用于表单校验，确保在调用 API 前数据格式正确。
*   **Rules**:
    *   `apiKey`: 必填 (`min(1)`), 提示 "请输入 API Key"。
    *   `baseUrl`: 必须是合法 URL (`url()`), 提示 "请输入有效的 URL (包含 http/https)"。
    *   `model`: 必填 (`min(1)`), 提示 "请输入模型名称"。

## 3. 业务逻辑流程 (Implementation Logic)

### 3.1 初始化 (Initialization)
1.  加载页面时，从 `useSettingsStore` 读取当前配置。
2.  使用 `useForm` 的 `defaultValues` 将 Store 中的数据填充到表单输入框。

### 3.2 字段交互 (Interaction)
*   **API Key 可见性切换**:
    *   输入框类型默认 `type="password"`。
    *   右侧通过 `lucide-react` 的 `Eye/EyeOff` 图标切换为 `type="text"`。
*   **Base URL**:
    *   提供 Placeholder 提示标准格式 (e.g., `https://api.openai.com/v1`)。

### 3.3 测试连接逻辑 (Test Connection)
*   **触发**: 用户点击 "测试连接" (Test Connection) 按钮。
*   **数据源**: **必须使用当前表单的输入值 (`form.getValues()`)**，而不是 Store 中的旧值。
*   **执行步骤**:
    1.  设置按钮为 `loading` 状态。
    2.  实例化临时的 `OpenAI` client:
        *   `apiKey`: 表单输入的 Key。
        *   `baseURL`: 表单输入的 URL。
        *   `dangerouslyAllowBrowser: true` (必须开启，否则浏览器环境会报错)。
    3.  发送极简请求:
        *   Model: 表单输入的 Model。
        *   Messages: `[{ role: 'user', content: 'Design a Hello World' }]`
        *   Max Tokens: `1` (为了省钱和速度)。
    4.  **成功**: 弹出 Toast Success ("连接成功，模型可用")。
    5.  **失败**: 弹出 Toast Error ("连接失败: <错误信息>")，并在 Console 打印错误详情。
    6.  重置按钮状态。

### 3.4 保存逻辑 (Save Configuration)
*   **触发**: 用户点击 "保存配置" (Save Changes) 按钮。
*   **执行步骤**:
    1.  触发 `form.handleSubmit` 确保通过 Zod 校验。
    2.  调用 `useSettingsStore.setSettings` 更新状态（自动写入 LocalStorage）。
    3.  弹出 Toast Success ("设置已保存")。
    4.  如果是从“拦截页”跳转过来的，提供一个按钮或链接“返回首页”。

## 4. UI/UX 样式规范 (Layout & Styling)

*   **布局容器**:
    *   垂直居中，水平居中。
    *   最大宽度 `max-w-xl` (Card 宽度)。
*   **Shadcn 组件结构**:
    *   **Card**: 包含 `CardHeader` (Title, Description), `CardContent` (Form), `CardFooter` (Actions)。
    *   **Alert**: 在表单上方放置一个 `Variant="warning"` 的 Alert 组件。
        *   Icon: `AlertTriangle`
        *   Text: "您的 API Key 仅存储在本地浏览器中，绝不会上传至任何服务器。" (隐私安全声明)。
    *   **FormItem**: 标准 Label + Input + ErrorMessage 布局。
*   **操作按钮**:
    *   底部并排两个按钮。
    *   左侧: `Variant="outline"`, Label="测试连接", Handle=`handleTest`。
    *   右侧: `Variant="default"`, Label="保存配置", Type=`submit`。

## 5. 路由集成 (Routing)

*   **Path**: `/settings`
*   **Guard Logic (在其他页面)**: 如果全局 `apiKey` 为空，应强制重定向到 `/settings`。