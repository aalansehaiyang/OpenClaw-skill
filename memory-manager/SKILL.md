---
name: memory-manager
description: 管理多 Agent 三层记忆系统（NOW.md/每日日志/MEMORY.md）
metadata: {"openclaw":{"emoji":"🧠","requires":{"bins":["node"]}}}
---

# Memory Manager - 多 Agent 记忆管理

## 功能

1. **任务记忆保存** - 任务开始前/中/后自动记录到 NOW.md
2. **每日日志归档** - 对话结束时自动归档到 memory/YYYY-MM-DD.md
3. **记忆提炼** - 从日志提炼关键洞察到 MEMORY.md
4. **记忆检索** - 根据上下文智能检索相关记忆

## 使用方式

### 保存任务记忆
```javascript
// 任务开始
memoryManager.saveTask({
  id: 'TASK-001',
  name: '分析贵州茅台股票',
  owner: 'Elliott',
  goal: '分析茅台近一周走势，给出投资建议'
});

// 更新进度
memoryManager.updateTask('TASK-001', {
  progress: '已完成数据收集，正在分析财报',
  insights: ['Q4 营收增长 15%', '利润率略有下降']
});

// 任务完成
memoryManager.completeTask('TASK-001', {
  result: '建议持有，目标价 2000 元',
  archive: true // 自动归档到每日日志
});
```

### 检索记忆
```javascript
// 检索相关记忆
const memories = await memoryManager.search('茅台 股票 投资');

// 获取今日日志
const todayLog = await memoryManager.getTodayLog();

// 获取 Agent 专业记忆
const elliottMemory = await memoryManager.getAgentMemory('elliott');
```

### 提炼记忆
```javascript
// 从今日日志提炼到长期记忆
await memoryManager.distill({
  date: '2026-03-01',
  target: 'global' // 或 'agent:elliott'
});
```

## 文件结构

```
/workspace/
├── NOW.md                          # 即时任务
├── MEMORY.md                       # 全局长期记忆
├── memory/
│   ├── 2026-03-01.md              # 每日日志
│   └── 2026-03-02.md
└── agents/
    ├── atlas/MEMORY.md            # Atlas 专业记忆
    ├── elliott/MEMORY.md          # Elliott 专业记忆
    ├── ogilvy/MEMORY.md           # Ogilvy 专业记忆
    └── linus/MEMORY.md            # Linus 专业记忆
```

## 自动化规则

| 事件 | 触发动作 |
|------|----------|
| 新任务开始 | 写入 NOW.md |
| 对话超过 20 轮 | 检查是否需要保存进度 |
| 工具调用>10 次 | 更新 NOW.md 进度 |
| 会话结束 | 归档到 memory/YYYY-MM-DD.md |
| 每日 22:00 | 提炼到 MEMORY.md |
| 上下文压缩前 | **强制保存**到 NOW.md |

## 最佳实践

1. **任务开始先查 NOW.md** - 避免重复
2. **重要发现立即记** - 不要等结束
3. **压缩前必保存** - 防止丢失
4. **每日要提炼** - 日志变洞察
5. **区分共享/独立** - 避免混淆
