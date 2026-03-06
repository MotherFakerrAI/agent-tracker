# 🤖 Agent 任务追踪器

追踪 MotherFaker Studio 各 Agent 的任务执行进度。

## 快速开始

### 记录新任务
```bash
node scripts/task-tracker.js log --agent brainstorm --desc "生成项目创意"
```

### 查询任务状态
```bash
node scripts/task-tracker.js status --id task-123
```

### 更新任务状态
```bash
node scripts/task-tracker.js update --id task-123 --status completed
```

### 列出任务
```bash
# 最近 10 条
node scripts/task-tracker.js list

# 运行中的任务
node scripts/task-tracker.js list --status running

# 特定 Agent 的任务
node scripts/task-tracker.js list --agent coder --limit 5
```

### Agent 统计
```bash
node scripts/task-tracker.js stats
```

## 任务状态

| 状态 | 说明 |
|------|------|
| `pending` | 待处理 |
| `running` | 进行中 |
| `completed` | 已完成 |
| `failed` | 失败 |

## 数据结构

任务日志保存在 `memory/task-log.json`：

```json
{
  "tasks": [
    {
      "id": "task-123",
      "assignedTo": "coder",
      "assignedAt": "2026-03-06T12:54:00.000Z",
      "description": "开发进度追踪工具",
      "status": "running",
      "completedAt": null
    }
  ],
  "lastUpdated": "2026-03-06T12:54:00.000Z"
}
```

## 集成到工作流

### 派单前记录
```bash
# CEO 派单给 coder
node scripts/task-tracker.js log --agent coder --desc "开发键盘钢琴项目"
```

### 完成后更新
```bash
# coder 完成任务后
node scripts/task-tracker.js update --id task-123 --status completed
```

### 查询当前状态
```bash
# 查看所有运行中的任务
node scripts/task-tracker.js list --status running
```

## 📢 Feishu 推送通知

任务状态变更时自动推送 Feishu 群聊！

### 配置 Webhook

1. **复制示例配置**
   ```bash
   cp .env.example .env
   ```

2. **获取 Feishu Webhook URL**
   - 在 Feishu 群聊中添加「自定义机器人」
   - 复制 Webhook 地址
   - 粘贴到 `.env` 文件中

3. **编辑 .env 文件**
   ```bash
   FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxx
   ```

### 自动通知

完成任务时自动发送通知（默认开启）：

```bash
# 自动发送 Feishu 通知
node scripts/task-tracker.js update --id task-123 --status completed

# 关闭通知
node scripts/task-tracker.js update --id task-123 --status completed --notify false

# 带 GitHub 链接
node scripts/task-tracker.js update --id task-123 --status completed --github-url https://github.com/...
```

### 通知卡片示例

```
📊 Agent 任务通知

任务：开发键盘钢琴项目
Agent: coder
状态：✅ completed
耗时：5m 32s

[🔗 查看 GitHub]
```

---

Made with ❤️ by MotherFaker Studio
