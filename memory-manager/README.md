# 多 Agent 协同记忆系统 - 使用指南

## 📁 文件结构

```
/Users/onlyone/.openclaw/workspace/
├── NOW.md                          # 即时任务追踪
├── MEMORY.md                       # 全局长期记忆
├── AGENTS.md                       # Agent 配置和协同规则
├── memory/
│   └── YYYY-MM-DD.md              # 每日日志（自动创建）
└── agents/
    ├── atlas/MEMORY.md            # 总管记忆
    ├── elliott/MEMORY.md          # 投资分析师记忆
    ├── ogilvy/MEMORY.md           # 内容营销记忆
    └── linus/MEMORY.md            # 软件工程师记忆
```

---

## 🚀 快速开始

### 1. 启动任务

在开始任何任务前，先查看 `NOW.md` 了解当前活跃任务：

```bash
cat /Users/onlyone/.openclaw/workspace/NOW.md
```

### 2. 创建新任务

使用记忆管理器保存任务：

```bash
cd /Users/onlyone/.openclaw/workspace/skills/memory-manager
node memory-manager.js save TASK-001 "分析贵州茅台" "Elliott" "分析近一周走势并给出建议"
```

### 3. 更新任务进度

任务执行过程中更新进度：

```javascript
// 在 Agent 代码中调用
updateTask('TASK-001', {
  progress: '已完成数据收集，正在分析财报',
  insights: ['Q4 营收增长 15%', '利润率略有下降']
});
```

### 4. 完成任务

```bash
node memory-manager.js complete TASK-001 "建议持有，目标价 2000 元"
```

---

## 📋 各 Agent 职责

### Atlas（大内总管）
- **启动时读取**: NOW.md → 今日日志 → MEMORY.md
- **职责**: 任务分配、进度跟踪、记忆提炼
- **专属记忆**: `agents/atlas/MEMORY.md`

### Elliott（投资分析师）
- **启动时读取**: NOW.md → 今日日志 → `agents/elliott/MEMORY.md`
- **职责**: 股票分析、市场研究、投资建议
- **专属记忆**: `agents/elliott/MEMORY.md`

### Ogilvy（内容营销）
- **启动时读取**: NOW.md → 今日日志 → `agents/ogilvy/MEMORY.md`
- **职责**: 热点发现、文章撰写、内容策划
- **专属记忆**: `agents/ogilvy/MEMORY.md`

### Linus（软件工程师）
- **启动时读取**: NOW.md → 今日日志 → `agents/linus/MEMORY.md`
- **职责**: 脚本开发、工具构建、自动化
- **专属记忆**: `agents/linus/MEMORY.md`

---

## 🧠 三层记忆系统

### 层级 1: NOW.md（即时任务）
**作用**: 记录当前正在执行的任务

**写入时机**:
- ✅ 开始新任务
- ✅ 工具调用>10 次
- ✅ 发现新洞察
- ✅ **上下文压缩前（强制）**

**示例格式**:
```markdown
### [TASK-001] 分析贵州茅台股票
- **状态**: 进行中
- **负责人**: Elliott
- **创建时间**: 2026-03-01 10:00
- **最后更新**: 2026-03-01 10:30
- **目标**: 分析茅台近一周走势，给出投资建议
- **进度**: 已完成数据收集
- **关键洞察**: Q4 营收增长 15%
```

### 层级 2: memory/YYYY-MM-DD.md（每日日志）
**作用**: 按日期归档，保留原始上下文

**自动记录**:
- 任务开始/完成
- 重要决策
- 工具调用结果
- 用户反馈

### 层级 3: MEMORY.md（长期记忆）
**作用**: 提炼关键模式、用户偏好、团队策略

**维护规则**:
- Atlas 每日 22:00 提炼
- 从各 Agent 记忆提取通用知识
- 保留专业领域知识在各自文件

---

## 🔄 协同流程示例

### 场景：写一篇关于茅台的分析文章

**Step 1: Atlas 接收任务**
```
Atlas 在 NOW.md 创建任务：
[TASK-001] 茅台分析文章
负责人：Atlas（协调）+ Elliott（数据）+ Ogilvy（写作）
```

**Step 2: Elliott 分析股票**
```
Elliott:
1. 读取 NOW.md 了解任务
2. 分析茅台数据
3. 更新 NOW.md 进度
4. 写入 agents/elliott/MEMORY.md 投资洞察
```

**Step 3: Ogilvy 撰写文章**
```
Ogilvy:
1. 读取 NOW.md 了解 Elliott 的分析结果
2. 参考 agents/elliott/MEMORY.md 的专业洞察
3. 撰写文章
4. 更新 NOW.md 标记完成
```

**Step 4: Atlas 提炼记忆**
```
Atlas:
1. 从 Elliott 记忆提炼投资分析框架到全局 MEMORY.md
2. 从 Ogilvy 记忆提炼写作模板到全局 MEMORY.md
3. 归档任务到 memory/2026-03-01.md
```

---

## ⚠️ 注意事项

### 记忆隔离
| 记忆类型 | 全局共享 | Agent 独立 |
|----------|----------|------------|
| 用户偏好 | ✅ | ❌ |
| 任务历史 | ✅ | ❌ |
| 专业洞察 | ❌ | ✅ |
| 领域知识 | ❌ | ✅ |

### 压缩前强制保存
在上下文即将被压缩时（对话超过 20 轮或 token 接近上限），**必须**将关键信息保存到 NOW.md：

```javascript
// 检测到需要压缩时
if (contextLength > threshold) {
  updateTask(taskId, {
    progress: currentProgress,
    insights: keyInsights
  });
}
```

### 避免重复劳动
每个 Agent 启动时必须先读取 NOW.md，检查是否有相关任务在进行：

```javascript
// Agent 启动流程
const nowTasks = readNowMd();
const relatedTasks = nowTasks.filter(t => 
  t.owner === agentName || t.status === '进行中'
);
```

---

## 🛠️ 工具命令

```bash
# 保存任务
node memory-manager.js save <id> <name> <owner> <goal>

# 搜索记忆
node memory-manager.js search <query>

# 提炼记忆
node memory-manager.js distill [date]

# 查看今日日志
cat /workspace/memory/$(date +%Y-%m-%d).md

# 查看某 Agent 记忆
cat /workspace/agents/elliott/MEMORY.md
```

---

## 📊 效果对比

### 使用前
- ❌ Agent 频繁"失忆"
- ❌ 重复解释背景
- ❌ 各 Agent 信息孤岛
- ❌ 任务切换丢失上下文

### 使用后
- ✅ 任务状态实时追踪
- ✅ 新 Agent 快速接手
- ✅ 知识持续沉淀
- ✅ 团队协同流畅

---

## 🎯 最佳实践

1. **任务开始先查 NOW.md** - 避免重复
2. **重要发现立即记** - 不要等结束
3. **压缩前必保存** - 防止丢失
4. **每日要提炼** - 日志变洞察
5. **区分共享/独立** - 避免混淆
