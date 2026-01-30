# Frontend Interview AI — 更新计划（v2.1 → v3.0）

日期：2026-01-30  
范围：纯前端（React + Vite），数据存 IndexedDB（Dexie），AI 通过 OpenAI-Compatible API 调用

---

## 1. 背景与现状

### 1.1 当前实现要点（代码事实）
- 出题/评分 Prompt 目前是通用模板，仅依赖 `topic` 字符串；缺少 Topic 的能力模型与差异化约束  
  - 见 `src/lib/ai/prompts.ts`
- 题库导入去重：仅做“精确去重”（topic + content），无法拦截同义改写/轻微改动的重复题  
  - 见 `src/services/importValidation.ts`
- 题库与记录 Schema 已支持 `contentHash / tags / techTags / dimensions`，但缺少用于“相似检索 / 评价可信度 / 样本校准”的结构  
  - 见 `src/lib/db.ts`

### 1.2 主要缺陷（用户目标对照）
- 每个 Topic 的 Prompt 需要定制化（能力维度、题型偏好、常见坑、难度锚点、面试官偏好答案结构）
- 题库需要 RAG/相似去重，避免相同问题被导入或重复生成
- 需要警告机制（质量/重复/评分不可信等）
- 更好的评价机制（“面试官喜欢什么回答”、可解释、可校准）
- 需要样本做数据分析（golden set / rubric 校准）
- 需要合理的出题难度策略（递进、覆盖率、弱项优先）
- 给用户的建议与学习资料需要升级（筛选；可接入 Coze/n8n 工作流）

---

## 2. 总体目标（Outcome）

### 2.1 目标（Goals）
- G1：Topic Prompt 差异化，让生成题与评分更稳定、更贴近面试官偏好
- G2：题库“重复题”进入/出现概率显著下降（导入 + 生成两端都防重复）
- G3：引入评分可信度与质量告警，避免用户被不可靠评分误导
- G4：评价体系可解释、可校准，并支持后续数据分析
- G5：题目难度与训练路径更合理（自适应、覆盖面、弱项优先）
- G6：学习资料建议可维护、可扩展（支持工作流半自动更新）

### 2.2 非目标（Non-Goals）
- 不引入后端服务（保持纯前端）
- 不做复杂账号体系/云同步（除非后续版本另立项）
- 不追求一次性实现完整“智能教练”，先把数据结构与闭环打牢

---

## 3. 版本路线图

## v2.1 — Prompt & Rubric 基建 + 警告机制 v1（优先级最高）

### 3.1 功能交付
1) TopicProfile（每个 Topic 定制化配置）
- 字段建议（最小可用）：
  - `topicSlug / topicLabel`
  - `preferredQuestionTypes`：Theory/Code/SystemDesign 配比
  - `difficultyAnchors`：Simple/Medium/Hard 的定义与示例边界
  - `coreCompetencies`：该 Topic 的能力维度列表（用于出题覆盖与评分解释）
  - `commonMistakes`：常见误区/扣分点
  - `interviewerPreferredStructure`：面试官偏好回答结构模板（分题型）
  - `forbiddenPatterns`：不希望出现的题型/内容（例如过度算法化、过于开放）
  - `tagsTaxonomy`：techTags 候选集合/规范（避免 tags 漂移）

2) Prompt 拼装（Generate/Evaluate）
- 出题：将 `TopicProfile` 写入 system/user 指令，强约束输出格式 + 难度锚点 + 覆盖点
- 评分：将“面试官偏好结构 + rubric 解释 + 扣分点”写入评分指令，要求输出更可解释的结构化 JSON

3) 评分输出 Schema 升级（面向 UI 与后续分析）
- 在现有 `EvaluateAnswerResponse` 基础上增加：
  - `strengths: string[]`（2-4）
  - `gaps: string[]`（2-4）
  - `nextSteps: { action: string; reason: string }[]`（1-3）
  - `confidence: 0-1`（评分可信度）
  - `rubricVersion: string`（便于回放一致性）
- 要求模型给出“为什么扣分”的短条目，避免只有一段 comment

4) 警告机制 v1（用户可感知、可操作）
- 触发条件示例：
  - AI JSON 解析失败 / 字段缺失 / score 与维度矛盾（例如 score 很高但维度很低）
  - referenceAnswer 过短或无步骤
  - techTags 数量异常或不在 taxonomy 内
  - confidence 低于阈值
- 行为：
  - UI 提示“本次结果可能不可靠”，提供一键“重试评分/重试出题”
  - 记录 warning 事件到 InterviewRecord，便于后续统计

### 3.2 验收标准（Acceptance）
- 对至少 3 个 Topic（如 React/TS/Browser）实现 TopicProfile，并在出题与评分中生效
- 评分输出满足新的 JSON schema（通过运行时校验或 zod 校验）
- 当触发警告条件时，用户能看到明确原因 + 可执行操作（重试/忽略/查看详情）
- 历史回放不崩溃（旧记录缺字段时采用兼容默认值）

---

## v2.2 — 题库相似去重 + RAG 防撞（导入端 + 生成端）

### 4.1 核心策略：Hybrid（默认离线，检测可用时增强）
A. 默认（必达）：本地近似相似度去重
- 候选实现：
  - SimHash / MinHash（基于 token / 3-gram）生成 `nearDupHash`
  - 计算 Jaccard / Hamming distance 做阈值判断
- 导入暂存区新增状态：
  - `duplicate`（精确重复，已有）
  - `near-duplicate`（相似重复，新）
  - `valid`
- 对 near-duplicate 展示：
  - 相似度百分比
  - 命中的已存在题目摘要（标题/前 120 字）

B. 增强（可选）：Embeddings 驱动的本地 RAG
- 前置条件：Base URL 支持 embeddings 或提供兼容 endpoint（可在 Settings 里开关）
- 存储：
  - `questionEmbedding?: number[]` 或压缩后的向量（需要评估 IndexedDB 体积）
  - 或仅存 `embeddingId`（若未来允许外部存储；本计划不含后端）
- 用途：
  - 导入相似检索（语义更强）
  - 生成前检索 top-k 相似题，喂给模型“不要重复/要差异化”
  - 评分时检索“优秀答案样本”（v2.4 后更关键）

### 4.2 生成防撞（Anti-duplicate generation）
- 生成前：
  - 从本地题库按 topic 检索 top-k 相似题（摘要 + tags）
  - 注入 Prompt：必须避开这些题的核心考点组合或叙述方式
- 生成后：
  - 再做一次相似检测；命中则自动重试（带上“你生成重复了，请换一个考点”）

### 4.3 验收标准
- 导入 100 条“同义改写”测试集时，near-duplicate 命中率达到可接受水平（先定阈值，再迭代）
- 生成模式下，连续生成 N 次（例如 20 次）重复率显著低于当前基线
- 用户可选择“仍然导入”但必须有强提示与理由

---

## v2.3 — 面试官偏好产品化 + 难度引擎 v1

### 5.1 面试官偏好（Answer Framework）
- 按题型提供“建议答题框架”，并在评分 rubric 中明确引用：
  - Theory：定义 → 场景 → 原理 → trade-offs → 常见坑 → 小结
  - Code：澄清 → 方案 → 复杂度/边界 → 编码 → 测试用例 → 优化
  - SystemDesign：需求澄清 → 约束 → 架构 → 关键数据结构/接口 → 可靠性/扩展性 → 权衡
- UI：在答题区提供可折叠模板（不强制，但可提升表现）

### 5.2 难度引擎 v1（自适应与覆盖）
- 输入信号：
  - 历史分数（score + dimensions）
  - techTags 分布
  - 近期错误集中点（gaps）
  - 最近题目 topic/type/difficulty 的覆盖率
- 输出策略：
  - “弱项优先 + 覆盖约束 + 渐进难度”
  - 提供用户开关：练弱项 / 均衡 / 冲刺（偏 Hard）
- 本地题库抽题：从“候选集合”中按权重随机（而非完全随机）

### 5.3 验收标准
- 用户连续训练 30 分钟后，题目难度与考点不出现明显“重复刷屏”
- 用户能看到“为什么给你这道题”（弱项/覆盖/递进的解释标签）

---

## v2.4 — 样本与数据分析 + 学习资料流水线

### 6.1 样本体系（用于校准与评估）
- 引入 Golden Set（本地导入）：
  - question + idealAnswer + expectedScores（可选）
  - 用于对 rubric 的稳定性做回归测试（评分漂移检测）
- 支持导出匿名化训练数据（用户自主导出）：
  - topic/type/difficulty + question + userAnswer + evaluation（去除敏感内容可选）

### 6.2 学习资料模块（可维护、可筛选）
- 数据结构：
  - resource: { title, url, topicSlug, tags, difficulty, duration, prerequisites, qualityScore, source }
- 前端功能：
  - 筛选/排序（按 topic、难度、时长）
  - 与 gaps/nextSteps 关联推荐（例如 gaps 命中 “Event Loop” 就推对应资源）
- 工作流建议（Coze/n8n）：
  - 抓取候选 → 清洗去重 → 打标签 → 人工审核 → 生成 JSON → 前端导入

### 6.3 验收标准
- 能通过导入 JSON 的方式维护资源库，并在 UI 正常展示筛选
- nextSteps 能链接到至少 1 条对应资源（命中率可逐步提升）

---

## v3.0 — 稳定性与可对比评测（质量工程化）

### 7.1 评分一致性与漂移监控
- 同一答案重复评分方差监控（可选：同模型多次采样）
- 低一致性时显示“评分可能不稳定”并建议用户关注结构化建议而非分数
- rubricVersion 固化：同一版本 rubric 输出对齐，便于回放与分析

### 7.2 指标面板（本地统计）
- Topic/Competency 维度的提升趋势（聚合 dimensions/techTags）
- 覆盖率：题型/难度/考点分布
- 学习资源点击-收益相关性（本地轻量统计）

---

## 8. 数据结构与兼容策略（概要）

### 8.1 IndexedDB（Dexie）可能的扩展字段（建议）
- `questions`：
  - `nearDupHash?`（用于离线相似去重）
  - `embedding?`（可选，取决于 v2.2 的增强路径）
  - `qualityFlags?`（题目质量标记）
- `records`：
  - `warnings?: { code: string; message: string }[]`
  - `confidence?: number`
  - `rubricVersion?: string`
  - `strengths/gaps/nextSteps?`

### 8.2 向后兼容
- 旧记录缺字段：渲染层提供默认值（不强制迁移）
- 如需 schema version bump：提供一次性迁移（谨慎评估）

---

## 9. 风险与应对

- Embeddings 兼容性风险：不同 OpenAI-Compatible 服务不一定提供 embeddings  
  - 应对：Hybrid 默认离线方案保证必达；embeddings 为增强可选
- 模型输出不稳定：结构化 JSON 仍可能偏离  
  - 应对：更严格的 schema 校验 + 自动重试 + 警告机制
- IndexedDB 体积增长：向量存储可能很大  
  - 应对：可选开关 + 压缩/降维 + 限制仅对“高频题”存储

---

## 10. 里程碑（建议节奏）

- v2.1：1–2 周（先做 3 个 TopicProfile + 新 schema + warning v1）
- v2.2：1–2 周（离线相似去重 + 生成防撞；embeddings 作为可选增强）
- v2.3：1–2 周（答题框架 + 难度引擎 v1）
- v2.4：2–3 周（样本体系 + 资源库 + 工作流对接方案）
- v3.0：按数据与稳定性需求滚动（至少 2 周）

---

## 11. Done 定义（Definition of Done）
- 每个版本都有：
  - 可运行的 UI 流程（出题/作答/评分/历史回放/导入）
  - 数据结构变更有兼容策略
  - 明确的验收用例（重复题、异常输出、低可信度、难度策略效果）