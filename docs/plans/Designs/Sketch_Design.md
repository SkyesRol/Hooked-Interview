# Design Spec: "The Architect's Sketch" (Frontend Interview AI)

**Version**: 1.0  
**Theme**: "Digital Analog" / "The Da Vinci Notebook"  
**Core Philosophy**: 降低面试焦虑，营造一种在草稿纸上自由推演、头脑风暴的沉浸感。界面应当感觉像是一本高质量的工程笔记本，而不是一个冷冰冰的考试系统。

---

## 1. 技术选型 (Tech Stack & Dependencies)

为了在 React + Tailwind 体系下实现“手绘风格”且不损失性能，我们采用以下策略：

*   **Core Framework**: React 19 + Vite + Tailwind CSS (现有架构)。
*   **Fonts (Typography)**:
    *   **Headings/UI**: `Architects Daughter` or `Patrick Hand` (Google Fonts) - 兼顾手写感与可读性。
    *   **Code**: `JetBrains Mono` or `Fira Code` - 代码必须保持绝对清晰，不使用手写体。
    *   **Body/Long Text**: `Patrick Hand` (如果篇幅短) 或 `Nunito` (圆润的无衬线体，如果篇幅长)。
*   **Styling Engine**:
    *   **Tailwind Plugins**: 自定义 `border-radius` 和 `box-shadow` 预设，模拟不规则边缘。
    *   **SVG Filters**: 全局定义 SVG Noise Filter，给纯色块增加“纸张纹理”。
*   **Animation**:
    *   **Framer Motion**: 核心动画库。用于实现“线条绘制 (Path Drawing)”效果，模拟笔触书写。
    *   **React Rough Notation**: 用于高亮重点（模拟记号笔/圈画效果）。
*   **Charts**:
    *   **Recharts**: 继续使用，但通过 `CustomShape` 或 CSS Filter 适配手绘风。

---

## 2. 视觉设计系统 (Visual System)

### 2.1 配色方案 (Color Palette)

放弃纯黑纯白，全面转向“纸张与墨水”的隐喻。

*   **Background (Canvas)**:
    *   `bg-paper`: `#F9F7F1` (米色/道林纸色) —— **主背景**。
    *   `bg-grid-line`: `rgba(0, 0, 0, 0.05)` —— **网格线颜色**。
*   **Ink (Foreground)**:
    *   `text-ink-primary`: `#2C3E50` (深蓝灰，钢笔墨水感)。
    *   `text-ink-secondary`: `#5D6D7E` (铅笔灰)。
*   **Accents (Highlighters)**:
    *   `bg-highlight-yellow`: `#FEF3C7` (荧光黄，用于 Emphasis)。
    *   `bg-highlight-green`: `#D1FAE5` (通过/高分)。
    *   `bg-highlight-red`: `#FEE2E2` (错误/重点)。
    *   `border-pencil`: `#4B5563` (边框色)。

### 2.2 边框与阴影 (The "Sketchy" Look)

不使用标准的 `border-radius: 8px`。使用“不完美的圆角”来模拟手绘。

*   **CSS Class**: `.border-sketch`
    ```css
    .border-sketch {
      border: 2px solid #2C3E50;
      border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
      transition: all 0.3s ease;
    }
    .border-sketch:hover {
      border-radius: 15px 225px 15px 255px / 255px 15px 225px 15px; /* 悬停时边框微动 */
      transform: scale(1.01);
    }
    ```
*   **Shadow**: 使用 **Hatching (排线)** 阴影或实心偏移阴影，而非模糊阴影。
    *   `box-shadow: 4px 4px 0px 0px rgba(44, 62, 80, 0.2);`

---

## 3. 关键组件设计 (Component Specs)

### 3.1 智能雷达图 (StatsOverview)
*   **挑战**: 标准的 Recharts 雷达图太“直”了。
*   **方案**:
    1.  **背景**: 绘制同心圆而非多边形，线条使用虚线 (Stroke-dasharray)，模拟手画的辅助线。
    2.  **数据区域**: 填充色使用半透明的“涂抹感”颜色（如 `rgba(59, 130, 246, 0.2)`）。
    3.  **Font**: 标签使用 `Architects Daughter`。
    4.  **外框**: 给整个 Chart 容器加一个手绘边框。

### 3.2 输入表单 (Inputs & Editors)
*   **普通输入框 (API Key, Search)**:
    *   **Style**: 只有底部边框 (`border-b-2`)，类似在横线纸上写字。
    *   **Focus**: 底部边框变粗，或出现一个“圈画”动画。
*   **代码编辑器 (The Code Notebook)**:
    *   **Container**: 看起来像一本螺旋装订的笔记本或方格纸。
    *   **Background**: CSS `background-image` 绘制 20px * 20px 的浅色网格。
    *   **Line Numbers**: 手写字体。
    *   **Gutter**: 一条红色的竖线（模拟笔记本边缘）。

### 3.3 按钮 (Buttons)
*   **Primary**: 看起来像贴在纸上的“便利贴”或被粗笔圈出来的区域。
    *   带明显的“点击下压”效果 (`active:translate-y-1 active:shadow-none`)。
*   **Secondary**: 只有文字和下划线，Hover 时下划线像波浪一样抖动。

---

## 4. 交互流程设计 (UX Flow & Motion)

我们利用“绘画”的过程来作为加载和转场动画，让等待变得有趣。

### 4.1 进入流程 (Onboarding/Entry)
1.  **Loading**: 屏幕是一张白纸。
2.  **Animation**: 一只隐形的笔（或仅仅是线条）快速勾勒出页面布局的轮廓（Header, Sidebar, Content Area）。
    *   *技术实现*: SVG `stroke-dashoffset` 动画。
3.  **Content Fade-in**: 轮廓画好后，内容（文字、图标）像墨水渗透一样淡入。

### 4.2 面试交互 (The Interview Loop)
*   **出题**: 题目卡片不是弹出来的，而是像一张纸从屏幕上方“滑”下来，或者像信封一样展开。
*   **AI 思考中**:
    *   不使用旋转的 Spinner。
    *   **动画**: 显示一个铅笔图标在纸上快速涂写，或者显示文字 "Sketching solution..." 后面跟着跳动的省略号。
*   **结果展示**:
    *   **评分**: 使用红色印章效果 (Rubber Stamp)。"Pass", "Excellent", "Retry" 的印章盖在成绩单上，伴随 `scale` 动画和“啪”的一声（可选音效）。
    *   **评语**: 使用打字机效果，或者模拟手写速度逐字显示。

### 4.3 痛点优化 (UX Friction Points)
*   **问题**: 手写字体可能在某些分辨率下难以辨认。
*   **解决**:
    *   提供 **"Readability Mode" (易读模式)** 开关。一键将字体切换回标准的 Inter/Sans-serif，保留手绘边框风格，但确保文字清晰度。
    *   代码区域始终使用等宽字体，保证代码可读性不受风格影响。

---

## 5. CSS 预设代码 (Tailwind Config Draft)

```javascript
// tailwind.config.js (Draft)
module.exports = {
  theme: {
    extend: {
      colors: {
        paper: '#F9F7F1',
        ink: {
          DEFAULT: '#2C3E50',
          light: '#5D6D7E'
        }
      },
      fontFamily: {
        sketch: ['"Architects Daughter"', 'cursive'],
        body: ['"Patrick Hand"', 'cursive'],
        code: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-paper': "linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)",
      },
      boxShadow: {
        'sketch': '4px 4px 0px 0px rgba(44, 62, 80, 0.2)',
        'sketch-hover': '6px 6px 0px 0px rgba(44, 62, 80, 0.2)',
      }
    }
  }
}
```

---

## 6. 开发优先级 (Implementation Roadmap)

1.  **Foundation**: 引入字体，配置 Tailwind Theme (Paper colors, shadows, border-radius).
2.  **Layout**: 重构 `MainLayout`，实现“笔记本”背景和全局容器样式。
3.  **Core Components**:
    *   封装 `<SketchButton />`, `<SketchCard />`, `<SketchInput />`。
    *   实现 `<StatsOverview />` 的手绘风雷达图。
4.  **Motion**: 添加 Framer Motion 的 SVG 描边动画作为页面加载效果。
5.  **Review**: 调整字体大小和行高，确保长时间阅读不累。
