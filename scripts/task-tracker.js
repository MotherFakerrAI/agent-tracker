#!/usr/bin/env node

/**
 * Agent 任务追踪器
 * 
 * 功能：
 * 1. 记录任务日志到 memory/task-log.json
 * 2. 查询/更新任务状态
 * 3. 展示所有 Agent 当前状态
 * 
 * 使用方法：
 *   node task-tracker.js log --agent brainstorm --desc "任务描述"
 *   node task-tracker.js status [task-id]
 *   node task-tracker.js update --id task-001 --status completed
 *   node task-tracker.js list
 */

const fs = require('fs');
const path = require('path');

// 配置文件路径
const TASK_LOG_PATH = path.join(__dirname, '..', 'memory', 'task-log.json');

// 确保目录存在
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 读取任务日志
function readTaskLog() {
  ensureDir(TASK_LOG_PATH);
  
  if (!fs.existsSync(TASK_LOG_PATH)) {
    return { tasks: [], lastUpdated: new Date().toISOString() };
  }
  
  try {
    const content = fs.readFileSync(TASK_LOG_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('读取任务日志失败:', error.message);
    return { tasks: [], lastUpdated: new Date().toISOString() };
  }
}

// 写入任务日志
function writeTaskLog(data) {
  ensureDir(TASK_LOG_PATH);
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(TASK_LOG_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// 生成任务 ID
function generateTaskId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `task-${timestamp}-${random}`;
}

// 记录新任务
function logTask(agent, description) {
  const log = readTaskLog();
  
  const newTask = {
    id: generateTaskId(),
    assignedTo: agent,
    assignedAt: new Date().toISOString(),
    description: description,
    status: 'running',
    completedAt: null,
  };
  
  log.tasks.unshift(newTask); // 添加到开头
  
  // 只保留最近 100 条记录
  if (log.tasks.length > 100) {
    log.tasks = log.tasks.slice(0, 100);
  }
  
  writeTaskLog(log);
  
  console.log('✅ 任务已记录:');
  console.log(`   ID: ${newTask.id}`);
  console.log(`   Agent: ${agent}`);
  console.log(`   描述: ${description}`);
  console.log(`   状态: running`);
  console.log(`   时间: ${new Date(newTask.assignedAt).toLocaleString('zh-CN')}`);
  
  return newTask;
}

// 查询任务状态
function getTaskStatus(taskId) {
  const log = readTaskLog();
  
  const task = log.tasks.find(t => t.id === taskId);
  
  if (!task) {
    console.log(`❌ 未找到任务：${taskId}`);
    return null;
  }
  
  console.log('📋 任务状态:');
  console.log(`   ID: ${task.id}`);
  console.log(`   Agent: ${task.assignedTo}`);
  console.log(`   描述: ${task.description}`);
  console.log(`   状态: ${task.status}`);
  console.log(`   开始时间: ${new Date(task.assignedAt).toLocaleString('zh-CN')}`);
  if (task.completedAt) {
    console.log(`   完成时间: ${new Date(task.completedAt).toLocaleString('zh-CN')}`);
  }
  
  return task;
}

// 更新任务状态
function updateTaskStatus(taskId, status) {
  const log = readTaskLog();
  
  const task = log.tasks.find(t => t.id === taskId);
  
  if (!task) {
    console.log(`❌ 未找到任务：${taskId}`);
    return null;
  }
  
  const validStatuses = ['pending', 'running', 'completed', 'failed'];
  if (!validStatuses.includes(status)) {
    console.log(`❌ 无效状态：${status} (可选：${validStatuses.join(', ')})`);
    return null;
  }
  
  task.status = status;
  if (status === 'completed' || status === 'failed') {
    task.completedAt = new Date().toISOString();
  }
  
  writeTaskLog(log);
  
  console.log(`✅ 任务状态已更新：${taskId}`);
  console.log(`   新状态：${status}`);
  
  return task;
}

// 列出所有任务
function listTasks(options = {}) {
  const log = readTaskLog();
  
  const { status, agent, limit = 10 } = options;
  
  let tasks = log.tasks;
  
  // 过滤状态
  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }
  
  // 过滤 Agent
  if (agent) {
    tasks = tasks.filter(t => t.assignedTo === agent);
  }
  
  // 限制数量
  tasks = tasks.slice(0, limit);
  
  if (tasks.length === 0) {
    console.log('📭 暂无任务记录');
    return [];
  }
  
  console.log(`📊 任务列表 (共 ${tasks.length} 条):\n`);
  
  tasks.forEach((task, index) => {
    const statusEmoji = {
      pending: '⏳',
      running: '🔄',
      completed: '✅',
      failed: '❌',
    };
    
    console.log(`${index + 1}. ${statusEmoji[task.status]} ${task.id}`);
    console.log(`   Agent: ${task.assignedTo}`);
    console.log(`   描述: ${task.description}`);
    console.log(`   状态: ${task.status}`);
    console.log(`   时间: ${new Date(task.assignedAt).toLocaleString('zh-CN')}`);
    console.log('');
  });
  
  return tasks;
}

// 获取 Agent 活跃度统计
function getAgentStats() {
  const log = readTaskLog();
  
  const stats = {};
  
  log.tasks.forEach(task => {
    if (!stats[task.assignedTo]) {
      stats[task.assignedTo] = {
        total: 0,
        running: 0,
        completed: 0,
        failed: 0,
        pending: 0,
      };
    }
    
    stats[task.assignedTo].total++;
    stats[task.assignedTo][task.status]++;
  });
  
  console.log('📈 Agent 活跃度统计:\n');
  
  Object.entries(stats).forEach(([agent, data]) => {
    console.log(`🤖 ${agent}:`);
    console.log(`   总任务：${data.total}`);
    console.log(`   进行中：${data.running} 🔄`);
    console.log(`   已完成：${data.completed} ✅`);
    console.log(`   失败：${data.failed} ❌`);
    console.log(`   待处理：${data.pending} ⏳`);
    console.log('');
  });
  
  return stats;
}

// 显示帮助
function showHelp() {
  console.log(`
🤖 Agent 任务追踪器

使用方法:
  node task-tracker.js <command> [options]

命令:
  log       记录新任务
  status    查询任务状态
  update    更新任务状态
  list      列出任务
  stats     显示 Agent 统计

示例:
  node task-tracker.js log --agent brainstorm --desc "项目创意生成"
  node task-tracker.js status task-123
  node task-tracker.js update --id task-123 --status completed
  node task-tracker.js list --limit 5
  node task-tracker.js list --status running
  node task-tracker.js stats
`);
}

// 解析命令行参数
function parseArgs(args) {
  const parsed = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      parsed[key] = value;
      i++;
    }
  }
  
  return parsed;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    showHelp();
    return;
  }
  
  const command = args[0];
  const options = parseArgs(args.slice(1));
  
  switch (command) {
    case 'log':
      if (!options.agent || !options.desc) {
        console.log('❌ 缺少参数：--agent 和 --desc 是必需的');
        console.log('示例：node task-tracker.js log --agent brainstorm --desc "任务描述"');
        process.exit(1);
      }
      logTask(options.agent, options.desc);
      break;
      
    case 'status':
      if (!options.id) {
        console.log('❌ 缺少参数：--id 是必需的');
        console.log('示例：node task-tracker.js status --id task-123');
        process.exit(1);
      }
      getTaskStatus(options.id);
      break;
      
    case 'update':
      if (!options.id || !options.status) {
        console.log('❌ 缺少参数：--id 和 --status 是必需的');
        console.log('示例：node task-tracker.js update --id task-123 --status completed');
        process.exit(1);
      }
      updateTaskStatus(options.id, options.status);
      break;
      
    case 'list':
      listTasks({
        status: options.status,
        agent: options.agent,
        limit: parseInt(options.limit) || 10,
      });
      break;
      
    case 'stats':
      getAgentStats();
      break;
      
    default:
      console.log(`❌ 未知命令：${command}`);
      showHelp();
      process.exit(1);
  }
}

// 导出函数供其他模块使用
module.exports = {
  logTask,
  getTaskStatus,
  updateTaskStatus,
  listTasks,
  getAgentStats,
  readTaskLog,
};

// 运行主函数
if (require.main === module) {
  main();
}
