#!/usr/bin/env node

/**
 * Memory Manager - 多 Agent 记忆管理系统
 * 
 * 功能：
 * 1. 管理 NOW.md（即时任务）
 * 2. 管理每日日志（memory/YYYY-MM-DD.md）
 * 3. 管理长期记忆（MEMORY.md + agents/*/MEMORY.md）
 * 4. 记忆提炼和归档
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE = path.join(__dirname, '..');

// 文件路径
const PATHS = {
  now: path.join(WORKSPACE, 'NOW.md'),
  memory: path.join(WORKSPACE, 'MEMORY.md'),
  memoryDir: path.join(WORKSPACE, 'memory'),
  agentsDir: path.join(WORKSPACE, 'agents')
};

/**
 * 获取今日日期字符串
 */
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

/**
 * 获取今日日志文件路径
 */
function getTodayLogPath() {
  const today = getTodayStr();
  return path.join(PATHS.memoryDir, `${today}.md`);
}

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 读取文件内容
 */
function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * 写入文件内容
 */
function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * 追加到文件
 */
function appendFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, content, 'utf-8');
}

/**
 * 保存任务到 NOW.md
 */
export function saveTask(task) {
  const { id, name, owner, goal, createTime = new Date().toISOString() } = task;
  
  let content = readFile(PATHS.now);
  
  const taskBlock = `
### [${id}] ${name}
- **状态**: 进行中
- **负责人**: ${owner}
- **创建时间**: ${createTime}
- **最后更新**: ${new Date().toISOString()}
- **目标**: ${goal}
- **进度**: 
- **关键洞察**: 

`;

  // 找到"## 活跃任务"部分，插入新任务
  if (content.includes('## 活跃任务')) {
    content = content.replace(
      '## 活跃任务',
      `## 活跃任务${taskBlock}`
    );
  } else {
    content += `\n## 活跃任务${taskBlock}`;
  }
  
  writeFile(PATHS.now, content);
  console.log(`✅ 任务 [${id}] 已保存到 NOW.md`);
}

/**
 * 更新任务状态
 */
export function updateTask(taskId, updates) {
  let content = readFile(PATHS.now);
  
  const taskRegex = new RegExp(`(### \\[${taskId}\\].*?)(?=### \\[|$)`, 's');
  const match = content.match(taskRegex);
  
  if (!match) {
    console.log(`⚠️  任务 [${taskId}] 未找到`);
    return;
  }
  
  let taskBlock = match[1];
  
  // 更新字段
  if (updates.progress) {
    taskBlock = taskBlock.replace(
      /(\*\*进度\*\*:).*/,
      `$1 ${updates.progress}`
    );
  }
  
  if (updates.insights) {
    const insightsStr = Array.isArray(updates.insights) 
      ? updates.insights.join('\n') 
      : updates.insights;
    taskBlock = taskBlock.replace(
      /(\*\*关键洞察\*\*:).*/,
      `$1 ${insightsStr}`
    );
  }
  
  if (updates.status) {
    taskBlock = taskBlock.replace(
      /(\*\*状态\*\*:).*/,
      `$1 ${updates.status}`
    );
  }
  
  // 更新时间
  taskBlock = taskBlock.replace(
    /(\*\*最后更新\*\*:).*/,
    `$1 ${new Date().toISOString()}`
  );
  
  content = content.replace(taskRegex, taskBlock);
  writeFile(PATHS.now, content);
  console.log(`✅ 任务 [${taskId}] 已更新`);
}

/**
 * 完成任务并归档
 */
export function completeTask(taskId, options = {}) {
  const { result, archive = true } = options;
  
  // 更新状态为完成
  updateTask(taskId, { 
    status: '已完成 ✅',
    progress: result || '任务完成'
  });
  
  // 归档到每日日志
  if (archive) {
    const todayPath = getTodayLogPath();
    const today = getTodayStr();
    
    let logContent = readFile(todayPath);
    
    if (!logContent.startsWith('# ')) {
      logContent = `# ${today} 工作日志\n\n`;
    }
    
    logContent += `## 完成任务：${taskId}\n\n`;
    if (result) {
      logContent += `**结果**: ${result}\n\n`;
    }
    logContent += `---\n\n`;
    
    writeFile(todayPath, logContent);
    console.log(`✅ 任务 [${taskId}] 已归档到 ${today}.md`);
  }
}

/**
 * 写入每日日志
 */
export function logDaily(entry) {
  const { type, content, agent } = entry;
  const todayPath = getTodayLogPath();
  const today = getTodayStr();
  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  
  let logContent = readFile(todayPath);
  
  if (!logContent.startsWith('# ')) {
    logContent = `# ${today} 工作日志\n\n`;
  }
  
  const agentTag = agent ? `[@${agent}] ` : '';
  logContent += `### ${time} ${agentTag}${type}\n\n${content}\n\n`;
  
  writeFile(todayPath, logContent);
}

/**
 * 获取 Agent 记忆
 */
export function getAgentMemory(agentName) {
  const agentMemoryPath = path.join(PATHS.agentsDir, agentName, 'MEMORY.md');
  return readFile(agentMemoryPath);
}

/**
 * 更新 Agent 记忆
 */
export function updateAgentMemory(agentName, section, content) {
  const agentMemoryPath = path.join(PATHS.agentsDir, agentName, 'MEMORY.md');
  let memory = readFile(agentMemoryPath);
  
  // 如果 section 存在，更新它
  const sectionRegex = new RegExp(`(## ${section}\\n\\n)(.*?)(?=## |$)`, 's');
  if (memory.match(sectionRegex)) {
    memory = memory.replace(sectionRegex, `$1${content}\n\n`);
  } else {
    // 追加新 section
    memory += `\n## ${section}\n\n${content}\n`;
  }
  
  writeFile(agentMemoryPath, memory);
}

/**
 * 提炼记忆（从日志到 MEMORY.md）
 */
export function distillMemory(options = {}) {
  const { date = getTodayStr(), target = 'global' } = options;
  
  const logPath = path.join(PATHS.memoryDir, `${date}.md`);
  const logContent = readFile(logPath);
  
  if (!logContent) {
    console.log(`⚠️  ${date} 的日志不存在`);
    return;
  }
  
  // 这里可以添加 AI 提炼逻辑
  // 目前简单地将日志内容复制到 MEMORY.md
  
  if (target === 'global') {
    let memory = readFile(PATHS.memory);
    memory += `\n\n## ${date} 提炼\n\n${logContent}\n`;
    writeFile(PATHS.memory, memory);
  }
  
  console.log(`✅ ${date} 的记忆已提炼`);
}

/**
 * 搜索记忆
 */
export function searchMemory(query) {
  const results = [];
  
  // 搜索 NOW.md
  const nowContent = readFile(PATHS.now);
  if (nowContent.toLowerCase().includes(query.toLowerCase())) {
    results.push({ source: 'NOW.md', content: nowContent.substring(0, 500) });
  }
  
  // 搜索 MEMORY.md
  const memoryContent = readFile(PATHS.memory);
  if (memoryContent.toLowerCase().includes(query.toLowerCase())) {
    results.push({ source: 'MEMORY.md', content: memoryContent.substring(0, 500) });
  }
  
  // 搜索 Agent 记忆
  const agents = ['atlas', 'elliott', 'ogilvy', 'linus'];
  for (const agent of agents) {
    const agentMemory = getAgentMemory(agent);
    if (agentMemory.toLowerCase().includes(query.toLowerCase())) {
      results.push({ source: `agents/${agent}/MEMORY.md`, content: agentMemory.substring(0, 500) });
    }
  }
  
  return results;
}

// CLI 入口
if (process.argv[1]?.includes('memory-manager.js')) {
  const command = process.argv[2];
  
  switch (command) {
    case 'save':
      saveTask({
        id: process.argv[3],
        name: process.argv[4],
        owner: process.argv[5],
        goal: process.argv[6]
      });
      break;
      
    case 'search':
      const results = searchMemory(process.argv[3]);
      console.log(JSON.stringify(results, null, 2));
      break;
      
    case 'distill':
      distillMemory({ date: process.argv[3] });
      break;
      
    default:
      console.log(`
Memory Manager - 多 Agent 记忆管理

用法:
  node memory-manager.js save <id> <name> <owner> <goal>  保存任务
  node memory-manager.js search <query>                   搜索记忆
  node memory-manager.js distill [date]                   提炼记忆

示例:
  node memory-manager.js save TASK-001 "分析茅台股票" "Elliott" "分析近一周走势"
  node memory-manager.js search "茅台"
  node memory-manager.js distill 2026-03-01
`);
  }
}
