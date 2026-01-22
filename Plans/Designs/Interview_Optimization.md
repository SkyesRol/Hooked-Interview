以下是针对 `Interview 页面` 的详细重构设计方案，旨在通过前端技术（CSS/SVG/Canvas）复刻这种“建筑师手稿”的视觉体验。
### 1. 核心设计语言 (Design System)

在开始布局之前，我们需要定义视觉基础，确保与 Home 页风格统一：

*   **背景 (Background):**
    *   使用平铺的淡灰色方格纸纹理（Grid Paper Texture）。
    *   可以使用 CSS `background-image: linear-gradient(...)` 来绘制细微的网格线。
*   **字体 (Typography):**
    *   **标题 (Headings):** 使用衬线字体（Serif），如 *Playfair Display*, *Merriweather* 或 *Times New Roman*。用于 "Question", "Analysis" 等大标题，体现经典感。
    *   **强调/副标题:** 使用斜体衬线字。
    *   **正文/代码:** 清晰的无衬线字体（Sans-Serif）如 *Inter*，代码使用 *JetBrains Mono* 或 *Fira Code*。
*   **颜色 (Palette):**
    *   **主色:** 纯黑 (#000000) 或 深炭灰 (#1A1A1A)。
    *   **背景色:** 纸白色 (#FFFFFF) 或 极淡的米色 (#FAFAFA)。
    *   **点缀色:** 极简的金色/棕褐色线条 (如图2中的分割线 #C5B358)，用于强调。
    *   **去除高饱和色:** 尽量少用鲜艳的绿/蓝色，成功或失败状态建议用深黑/灰配以图标，或者非常低饱和度的色块。
*   **容器 (Containers):**
    *   卡片使用极细的边框 (1px solid #E5E5E5) 或淡阴影，模仿纸张堆叠在桌面的感觉。

---

### 2. 页面布局重构 (Layout Restructure)

我们将页面分为三个主要区域："导航栏"、"左侧题目纸" 和 "右侧作答与评估板"。

#### A. 顶部导航 (Header)
*   **Logo & 标题:** 左上角放置 Logo，旁边使用衬线字体显示 "Interview Room"。
*   **面包屑/标签:** 原本的 "React" 标签改为黑白风格的 Badge（类似于图2中的 `[Vue.js | NEW]`），细黑边框，全大写字母。
*   **操作区:** "换一题" 按钮设计为纯文字链接带下划线，或者极简的 outlined button（如图2右上角的按钮）。
*   **分割线:** 顶部导航下方不再使用粗黑条，而是像图2那样留白，或者用一条极细的灰色分割线。

#### B. 左侧区域：题目卡片 (The Prompt Card)
*   **容器:** 模拟一张独立的卡片/纸张。
*   **标题:** "Question" 使用巨大的衬线字体（例如 32px），下方带一条短的金色横线装饰。
*   **元数据:** "Local · Code" 这种信息做成极小的灰色全大写无衬线字，增加间距（Letter-spacing）。
*   **题目内容:** 增大行高（Line-height 1.8），增加留白，让阅读体验像是在读一本精美的教科书。

#### C. 右侧上半部：作答区域 (The Workbench)
*   **模式切换:** "文本模式 | 专业编辑器" 不要是那种灰色的 toggle 按钮。设计成如同“文件夹标签”或者简单的文字 Tab：
    *   *Text Mode* (加粗下划线)   *Editor* (灰色)
*   **编辑器外观:**
    *   如果是**文本区域**：类似于记事本，背景可以是白色，带有横线背景图（Lined Paper）。
    *   如果是**代码编辑器**：为了配合风格，建议使用 **Light Theme (亮色主题)** 的编辑器配色（如 GitHub Light 或 VS Code Paper Theme），避免大黑块破坏页面的“纸张感”。
    *   将输入框的深色边框移除，改为聚焦时底部出现黑色线条，或者极浅的灰色全包围边框。

#### D. 右侧下半部：评估与分析 (The Critique)
*   **标题:** "Analysis" 使用衬线字体。
*   **评分 (Score):**
    *   **移除绿色胶囊。**
    *   改为巨大的数字排版。例如：左侧显示巨大的 "85"，下方用小字写 "SCORE"，字体参考图2中 "MASTER / 24" 的设计。
*   **雷达图 (Radar Chart):**
    *   **关键点:** 必须复刻图2的雷达图样式。
    *   **样式:** 纯黑色填充 (Black Fill)，无透明度或低透明度黑色，顶点尖锐（不要圆角）。
    *   **轴线:** 极细的浅灰色轴线。
    *   **文字:** 轴标签（Accuracy, Logic 等）使用衬线斜体字，营造“达芬奇手稿”的感觉。
*   **点评 (Comment):**
    *   设计成“批注”样式。背景可以是淡黄色（Post-it note 感觉）或者保持白色但左侧有一条竖直的黑线条作为引用标识。
    *   文字字体可以是手写体（Hand-drawn font）或者斜体衬线，模拟老师的评语。
*   **Tags:** 黑色细边框，白色背景，黑色文字。

#### E. 底部操作栏 (Footer Actions)
*   **提交回答 (Submit):** 对应图2中的 "NEW SKETCH" 或 "ENTER" 按钮。
    *   样式：纯黑色实心矩形，白色无衬线粗体字，锐角直角（无圆角）。
*   **下一题 (Next):** 对应图2中的 "RESUME" 或 "NEXT"。
    *   样式：同上，或者是白底黑边框的按钮。

---

### 3. 组件视觉对照表 (Visual Mapping)

| 元素 (Element) | 图1 (当前状态) | 图2 (目标风格 - 铅笔手稿风) | CSS 建议 |
| :--- | :--- | :--- | :--- |
| **Global Background** | 纯灰 | **网格纸纹理** | `radial-gradient(#ddd 1px, transparent 1px)` size 20px |
| **Title Check** | Sans-serif Bold | **Serif Italic / Elegant** | `font-family: 'Playfair Display', serif;` |
| **Buttons** | 灰色圆角矩形 | **实心黑/空心黑直角矩形** | `background: #000; color: #fff; border-radius: 0;` |
| **Radar Chart** | 彩色/渐变/圆润 | **黑色几何多边形** | Chart.js 配置: `backgroundColor: '#000'`, `pointStyle: false` |
| **Tags** | 灰色小药丸 | **极简线框标签** | `border: 1px solid #ddd; background: #fff; font-size: 10px;` |
| **Score Badge** | 绿色背景药丸 | **大字号排版中心** | 字体大至 48px, 纯黑，配饰线 |
| **Shadows** | 普通扩散阴影 | **硬阴影/纸张阴影** | `box-shadow: 0 4px 20px rgba(0,0,0,0.05);` |

---

### 4. 交互微动效设计 (Micro-interactions)

为了配合这种优雅的风格，交互不宜过于跳跃：

1.  **打字机效果:** 如果是 AI 生成的点评，文字出现时可以使用打字机效果（Typewriter effect）。
2.  **素描加载:** 雷达图加载时，可以做一个类似铅笔划线的动画（SVG stroke-dashoffset 动画），就像是现场画出来的。
3.  **Hover 态:** 按钮 Hover 时不要变色，而是微微上浮并加深阴影。

### 5. 布局示意图 (结构化描述)

```text
[ Global Background: Subtle Grid Paper ]

+---------------------------------------------------------------+
|  [Logo SVG]  Interview Room (Serif)           [Pass API] [User]|
+---------------------------------------------------------------+

+--------------------------+    +-------------------------------+
| Let's Sketch (Question)  |    | Workspace (Editor)            |
| =======================  |    | [ Tab: Text ] [ Tab: Code ]   |
|                          |    | +---------------------------+ |
| Ref: React 19 / Hooks    |    | | 1  const MyComponent...   | |
|                          |    | | 2                         | |
| Question:                |    | | 3 (Light Theme Editor)    | |
| How can you make a       |    | |                           | |
| father component...      |    | |                           | |
| (Serif Font for Title)   |    | +---------------------------+ |
|                          |    +-------------------------------+
|                          |
|                          |    +-------------------------------+
|                          |    | Mastery Analysis              |
|                          |    | +-------+  +----------------+ |
|                          |    | | 85    |  | Comment Block  | |
|                          |    | | SCORE |  | "Strictly..."  | |
|                          |    | +-------+  +----------------+ |
|                          |    |                               |
|                          |    |      (Black Radar Chart)      |
|                          |    |                               |
|                          |    | [Tag] [Tag] [Ref Link]        |
|                          |    +-------------------------------+
+--------------------------+
                                [ BLACK BUTTON: SUBMIT ]  [ NEXT ->]
```

通过这种设计，原本枯燥的“做题”过程被包装成了一种“打磨技艺”和“绘制蓝图”的专业体验，非常符合 EdTech for Developers 的定位。