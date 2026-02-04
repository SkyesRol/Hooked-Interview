# Tech Mastery Matrix - 首页 Spec 规范

## 概览

- **页面名称**: Tech Mastery Matrix - 首页
- **设备**: Desktop (1920x1080+)
- **风格**: 经典优雅风格 + 铅笔素描设计 (Classic Elegant + Sketch)
- **核心功能**: 技术话题浏览、学习进度追踪、快速开始练习

---

## 1. 全局设计 Token

### 色彩系统

| 名称 | 颜色值 | 用途 |
| :--- | :--- | :--- |
| **Paper Background** | `#fdfcf8` | 页面背景色（象牙白） |
| **Ink Black** | `#1a1a1a` | 主要文字色 |
| **Gold Accent** | `#b89c66` | 强调色（悬停、激活状态） |
| **Sketch Line** | `#d1d5db` | 边框色 (`gray-300`) |
| **White** | `#ffffff` | 卡片背景 |

### 排版系统

| 元素 | 字体 | 字重 | 字号 | 行高 |
| :--- | :--- | :--- | :--- | :--- |
| **大标题/Logo** | Playfair Display | 700 | 32px-48px | 1.2 |
| **二级标题** | Playfair Display | 700 | 20px-24px | 1.3 |
| **小标题/卡片标题** | Playfair Display | 700 | 14px | 1.4 |
| **正文/描述** | Montserrat | 300-400 | 10px-14px | 1.5-1.6 |
| **标签/Label** | Montserrat | 600-700 | 7px-9px | 1.2 |
| **按钮文字** | Montserrat | 700 | 8px-9px | 1 |

### 特殊效果

| 效果 | 说明 |
| :--- | :--- |
| **Grid Pattern** | 背景网格：`15px x 15px`, opacity 0.1 (RGB 209,213,219) |
| **Noise Overlay** | 全屏固定噪点纹理，opacity 0.02，增强纸质感 |
| **Sketch Border** | 不规则边框：`border-radius: 4px 15px 3px 18px / 18px 3px 15px 4px` |

---

## 2. 布局结构

### 页面布局 (Flex Column)

```text
┌─────────────────────────────────────────────┐
│  导航栏 (Height: auto, Padding: 16px 24px)   │ <-- nav
├─────────────────────────────────────────────┤
│  主内容区 (Flex: 1, Min-height: 0)           │ <-- main
│ ┌──────────┬────────────────┬─────────────┐ │
│ │   左列   │ 中列 (话题板)  │    右列     │ │
│ │   3列    │      6列       │     3列     │ │
│ └──────────┴────────────────┴─────────────┘ │
├─────────────────────────────────────────────┤
│  页脚 (Height: auto, Padding: 12px 24px)     │ <-- footer
└─────────────────────────────────────────────┘
```

### 主内容区三列比例 (Grid: `lg:grid-cols-12`)

*   **左列**: `lg:col-span-3` - 快速操作 & 统计数据
*   **中列**: `lg:col-span-6` - 话题卡片网格
*   **右列**: `lg:col-span-3` - 技能雷达 & 激励语

---

## 3. 导航栏 (Header Navigation)

### 容器属性
*   **Class**: `flex justify-between items-center`
*   **Padding**: `py-4 px-6`
*   **Height**: auto
*   **Sticky**: 否

### 左侧区域 (Logo + 菜单)
*   **Layout**: `flex items-center gap-8`

**Logo:**
*   **Tag**: `<a>` with `.heading-font`
*   **Text**: "TMM."
*   **Font**: Playfair Display, 700, 20px
*   **Icon**: `lucide:pen-tool` (color: gold-accent)
*   **Interactive**: 悬停变色

**菜单链接:**
*   **Layout**: `hidden md:flex gap-6` (响应式隐藏)
*   **Text**: "PRACTICE", "HISTORY", "RESOURCES"
*   **Font**: Montserrat, 700, 10px
*   **Color**: `gray-500` → hover: `black`
*   **Transition**: `color 200ms`

### 右侧区域 (按钮 + 用户图标)
*   **Layout**: `flex items-center gap-4`

**PASS API ACCESS 按钮:**
*   **Type**: button
*   **Padding**: `px-4 py-1.5`
*   **Border**: `1px solid black`
*   **Background**: `transparent` → hover: `black`
*   **Text Color**: `black` → hover: `white`
*   **Font**: Montserrat, 700, 10px, uppercase, letter-spacing 0.15em
*   **Transition**: `200ms cubic-bezier`
*   **Cursor**: pointer

**用户图标:**
*   **Icon**: `lucide:user`
*   **Font Size**: 20px
*   **Color**: `ink-black` → hover: `gold-accent`
*   **Cursor**: pointer
*   **Transition**: `200ms`

---

## 4. 英雄区域 (Hero Section)

### 容器属性
*   **Margin Bottom**: `mb-6`

### 主标题
*   **Element**: `<h1>`
*   **Class**: `heading-font text-4xl font-bold`
*   **Text**: `Tech Mastery <span class="text-gold-accent italic">Matrix</span>`
*   **Font**: Playfair Display, 700, 48px
*   **Color**: `ink-black`, 部分 `gold-accent` 带 `italic`

### 副标题
*   **Element**: `<p>`
*   **Class**: `text-gray-500 font-light text-sm max-w-xl`
*   **Text**: "Refining the art of frontend architecture, one sketch at a time."
*   **Font**: Montserrat, 300, 14px
*   **Color**: `gray-500`
*   **Max Width**: 448px (xl)
*   **Line Height**: 1.5

---

## 5. 左列面板 (Left Column)

### 容器
*   **Grid**: `lg:col-span-3`
*   **Layout**: `flex flex-col gap-4` (垂直堆叠，间隔 16px)

### 面板1：快速操作 (Quick Actions)

**卡片外壳**
*   **Class**: `sketch-border bg-white p-5`
*   **Border Style**: 不规则边框
*   **Box Shadow**: `2px 2px 0px rgba(0,0,0,0.05)`
*   **Transition**: `all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)`
*   **Hover效果**:
    *   Transform: `translateY(-2px) rotate(-0.2deg)`
    *   Box Shadow: `6px 6px 12px rgba(184, 156, 102, 0.1)`
    *   Border Color: `gold-accent`

**内容元素**
*   **标签**: "QUICK ACTIONS" (Montserrat, 700, 9px, gray-400, uppercase, spacing 0.2em)
*   **小标题**: "Ready to sketch?" (Playfair Display, 700, 18px, mt-1 mb-2)
*   **描述文字**: "Pick a card to start mock interviewing." (Montserrat, 400, 11px, gray-400, mb-4)
*   **按钮**: "NEW SKETCH"
    *   Font: Montserrat, 700, 9px, uppercase
    *   Style: 100% width, py-2.5, `bg-black` → hover: `gold-accent`, text-white → black

### 面板2：数据概览 (Stats Panel)

**卡片外壳**
*   同面板1的 `sketch-border` 样式。
*   **Layout**: `flex flex-col justify-between` (Min Height: flex-1)

**数据行 (Questions / Avg Score)**
*   **Layout**: `flex justify-between items-end border-b border-dashed border-gray-100 pb-2`
*   **左侧标签**: "QUESTIONS" / "AVERAGE SCORE" (Montserrat, 700, 8px, gray-400)
*   **左侧数值**: "124" / "82.5" (Playfair Display, 700, 20px)
*   **右侧图标**: `lucide:bar-chart-2` / `lucide:globe` (Size 18px, gray-300)

**Pulse Status**
*   **位置**: 面板底部, `pt-4`
*   **标签**: "PULSE STATUS" (8px, 700, gray-400)
*   **状态指示**: 绿色圆点 (`w-1.5 h-1.5 bg-green-500`) + "Online" (10px, gray-500, italic)

---

## 6. 中列面板：话题板 (Topic Board)

### 容器
*   **Grid**: `lg:col-span-6`
*   **Layout**: `flex flex-col`
*   **Flex**: `flex-1 min-h-0` (关键：允许内部滚动)

### 标题区
*   **Layout**: `flex justify-between items-baseline mb-4`
*   **左侧标题**: "Topic Board" (Playfair Display, 700, 24px, italic, border-b-2 border-gold-accent)
*   **右侧信息**: "Active Topics: 6/12" (Montserrat, 700, 8px, gray-400, italic)

### 卡片网格容器
*   **Class**: `flex-1 hide-scrollbar overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3 pr-1`
*   **Layout**: Grid (Mobile: 2列, Desktop: 3列), Gap 12px
*   **Scrolling**: 垂直滚动 (Y轴)，隐藏滚动条

### 单张话题卡片

**卡片外壳**
*   **Class**: `sketch-border bg-white p-3 group flex flex-col`
*   **Hover效果 (group:hover)**:
    *   Transform: `translateY(-2px) rotate(-0.2deg)`
    *   Shadow: `6px 6px 12px rgba(184,156,102,0.1)`
    *   Border: `gold-accent`

**行1：标题行**
*   **Layout**: `flex justify-between items-center mb-1.5`
*   **左侧**: 图标 (20px, grayscale → color) + 标题 (14px, Playfair Display Bold)
*   **右侧状态标签**: 7px, 700, Uppercase, Border 1px solid
    *   *示例*: "NEW" (gray), "ACTIVE" (gold-tint)

**行2：描述**
*   **Element**: `<p>`
*   **Style**: Montserrat, 400, 9px, gray-400
*   **Format**: `line-clamp-2`, `h-7`, `mb-2`

**行3：难度 + 题目数**
*   **Layout**: `flex items-center gap-1.5 mb-2`
*   **难度标签**: 7px, 700, Uppercase, Padding px-1, Border 1px
    *   HARD: Red | MED: Orange | EASY: Green
*   **题目数**: "32 Q" (7px, 700, gray-300)

**行4：技能 Tags**
*   **Layout**: `flex flex-wrap gap-1 mb-2`
*   **Tag**: `#Proxy` (6px, 400, bg-gray-50, text-gray-400, border-gray-100)

**行5：进度条**
*   **Container**: `.progress-line` (Height 2px, bg-gray-200, mb-2)
*   **Bar (::after)**: `bg-gold-accent`, width via CSS Variable `--progress`

**行6：底部操作**
*   **左侧**: 时间/状态 ("2d ago", 7px, 500, gray-300, italic)
*   **右侧按钮**: "START" / "RESUME"
    *   Style: 8px, 700, Uppercase, `bg-black` → `gold-accent`, text-white → black

### 卡片示例数据

| 技术栈 | 标题 | 描述 | 难度 | 数量 | Tags | 进度 | 状态 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Vue** | Vue.js | Reactive components, Composition API, and Pinia. | HARD | 32 Q | #Proxy, #SFC | 0% | New |
| **React** | React | Hooks, State management, and Reconciliation. | MED | 48 Q | #Hooks, #Fiber | 70% | 2d ago |
| **JS** | JS Core | Event Loop, Closures, and Async/Await. | MED | 120 Q | #Engine, #ES6 | 45% | 1w ago |
| **TS** | TypeSys | Generics, Advanced types, and Modules. | HARD | 54 Q | #Gen, #Utils | 10% | New |
| **CSS** | Styling | Grid, Flexbox, Animations, and Performance. | EASY | 80 Q | #Grid, #Perf | 92% | 1d ago |
| **HTML** | DOM/Web | Semantic tags, SEO, and Browser APIs. | EASY | 42 Q | #WebAPI, #a11y | 30% | 4d ago |

---

## 7. 右列面板 (Right Column)

### 容器
*   **Grid**: `lg:col-span-3`
*   **Layout**: `flex flex-col gap-4`

### 面板1：技能雷达 (Skill Radar)

**卡片外壳**
*   同 `sketch-border`，Padding `p-5`，`flex flex-col items-center`
*   **标题**: "Radar" (Playfair Display, 700, 18px, italic, mb-2, self-start)

**雷达图容器**
*   **SVG Size**: 160x160 (`viewBox="0 0 200 200"`)
*   **背景**: 3层六边形 + 6条放射线 (Stroke gray-100)
*   **数据**: `<polygon>`
    *   **Class**: `radar-line`
    *   **Fill**: `gold-accent` (opacity 5%)
    *   **Stroke**: `gold-accent` (1px)
    *   **Animation**: `dash` 3s linear forwards
*   **标签**: "FE", "LOGIC", "STYLE" 等6个顶点文字 (10px, bold, gray-300)

**数据卡片 (Grid)**
*   **Layout**: `grid grid-cols-2 gap-2 w-full mt-2`
*   **卡片**: Border `gray-50`, Padding `p-2`, text-center
    *   *Rank*: "Master"
    *   *Day*: "24"

### 面板2：激励语 (Quote Panel)

**卡片外壳**
*   **Class**: `sketch-border bg-[#1a1a1a] text-white p-5`
*   **Layout**: `flex flex-col justify-center relative overflow-hidden`
*   **Flex**: 1 (填充剩余高度)

**内容元素**
*   **背景装饰**: 图标 `lucide:pen-tool` (Absolute bottom-right, size 48px, opacity 10%, white)
*   **引用文字**: "Mastery is not about knowing everything; it's about being able to derive anything from first principles."
    *   Font: Montserrat, 300, 10px, gray-300, italic, leading-1.5
*   **底部按钮组**:
    *   Layout: `flex gap-3 mt-4`
    *   Buttons: `w-7 h-7`, border white/10, hover `border-gold-accent`, Icons (Edit, History)

---

## 8. 页脚 (Footer)

### 容器
*   **Layout**: `flex justify-between items-center`
*   **Style**: Max-w-7xl px-6 py-3, Border-top `gray-100`
*   **Font**: Montserrat, 700, 8px, uppercase, spacing 0.15em, `text-gray-400`

### 内容
*   **左侧链接**: "Privacy", "Open Source" (带GitHub图标), Hover `text-black`
*   **右侧版权**: "© 2024 Tech Mastery Matrix."

---

## 9. 全局交互效果

### Hover 状态

| 元素 | 常态 | Hover | Transition |
| :--- | :--- | :--- | :--- |
| **卡片 (.sketch-border)** | shadow 2px 2px | shadow 6px 6px, up 2px, border gold | 0.4s cubic-bezier |
| **按钮 (黑底)** | bg-black | bg-gold-accent, text-black | 200ms |
| **导航链接** | text-gray-500 | text-black | 200ms |
| **用户图标** | ink-black | gold-accent | 200ms |
| **技术图标** | grayscale 100% | grayscale 0% | 200ms |

### 动画

| 名称 | 触发 | 效果 | 时长 | 缓动 |
| :--- | :--- | :--- | :--- | :--- |
| **dash** | 页面加载 | SVG描边 (stroke-dasharray) | 3s | linear |
| **progress** | 进度加载 | width 0% → var(--progress) | 1s | ease-out |

### Scroll 行为
*   **Body**: `overflow-x: hidden` (禁止横向)
*   **话题卡片区**: `overflow-y: auto` + `.hide-scrollbar`

---

## 10. 响应式设计

### 断点
*   **Mobile**: < 768px
*   **Tablet**: 768px - 1024px
*   **Desktop**: ≥ 1024px

### 关键改动

| 设备 | 导航菜单 | 卡片网格 | 布局 |
| :--- | :--- | :--- | :--- |
| **Mobile** | 隐藏 (Hidden) | `grid-cols-2` | 单列堆叠 |
| **Desktop** | 显示 (Flex) | `grid-cols-3` | 三列 (`lg:grid-cols-12`) |

---

## 11. 可访问性 & 性能

*   **语义化**: 正确使用 `<main>`, `<nav>`, `<footer>`, `<button>`, `<h1>`-`<h3>`。
*   **图标**: 为装饰性图标添加 `aria-hidden="true"`，功能性图标添加 `aria-label`。
*   **对比度**: 确保正文 `#1a1a1a` 在 `#fdfcf8` 上，以及灰色标签在白色上的对比度达标。
*   **Tailwind**: 使用 PlayCDN 配置，不使用 `@apply` (便于纯HTML/CSS实现)。

---

## 12. 字体加载

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
```

---

## 13. CSS 变量 (Design Tokens)

```css
:root {
    --paper-bg: #fdfcf8;        /* 页面背景 */
    --ink-black: #1a1a1a;       /* 主文字色 */
    --gold-accent: #b89c66;     /* 强调色 */
    --sketch-line: #d1d5db;     /* 边框色 */
    --progress: 0%;             /* 进度条宽度: JS动态控制 */
}

/* 隐藏滚动条但允许滚动 */
.hide-scrollbar::-webkit-scrollbar {
    display: none;
}
.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
```

---

## 14. Tailwind 类名汇总

*   **Layout**: `flex`, `grid`, `grid-cols-2`, `grid-cols-3`, `lg:grid-cols-12`, `lg:col-span-3`, `lg:col-span-6`
*   **Spacing**: `p-2`, `p-5`, `gap-3`, `gap-6`, `mb-4`, `px-6`
*   **Typo**: `text-4xl`, `font-bold`, `uppercase`, `italic`, `tracking-widest`
*   **Color**: `bg-[#fdfcf8]`, `text-[#1a1a1a]`, `text-[#b89c66]`
*   **Effects**: `shadow-md`, `hover:shadow-lg`, `hover:-translate-y-1`

---

## 15. 开发指南

### 文件结构
```text
project/
  ├── index.html              # 首页 (含所有结构与CDN引用)
  └── assets/                 # 图片/图标 (如需要本地资源)
```

### HTML 注意事项
1.  **顶层容器**: `h-screen overflow-hidden flex flex-col` (确保全屏应用感)
2.  **主区域**: `<main>` 需设为 `flex-1 min-h-0` 以支持子元素的独立滚动。
3.  **动态值**: 进度条宽度使用 `style="--progress: 70%"` 内联样式控制。

---

## 16. 交付物检查清单

- [ ] HTML 结构语义化完整
- [ ] 交互效果 (Hover, Transitions) 流畅
- [ ] 响应式布局在 Mobile/Desktop 测试通过
- [ ] 字体与颜色变量正确应用
- [ ] 滚动区域行为正确 (仅话题区域滚动，页面不滚动)
- [ ] Tailwind 类名使用正确 (无编译步骤)