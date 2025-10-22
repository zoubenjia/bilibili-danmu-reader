# 更新 GreasyFork 脚本到 v0.9.0

## 📋 更新清单

脚本已在 GitHub 上更新到 v0.9.0，现在需要同步到 GreasyFork。

### ✅ 已完成的更改

- [x] 脚本代码添加直播支持 (`@match https://live.bilibili.com/*`)
- [x] 版本号更新到 0.9.0
- [x] GitHub 代码已推送
- [x] README 已更新说明直播支持
- [x] 测试指南已创建
- [x] ⏳ **待做：更新 GreasyFork 脚本**

---

## 🔄 如何更新 GreasyFork

### 第一步：访问 GreasyFork 编辑页面

1. 打开 https://greasyfork.org/en/scripts/553274
2. 点击右侧菜单 "Edit" 或 "更新此脚本"

### 第二步：更新脚本代码

1. 进入编辑页面后，找到代码编辑框
2. **清空全部代码**（Ctrl+A → Delete）
3. 从以下位置复制最新代码：
   - **GitHub Raw**: https://raw.githubusercontent.com/zoubenjia/bilibili-danmu-reader/main/bilibili-danmu-reader-polling.js
   - 或从本地文件复制：`/Users/zoubenjia/personal-projects/web-development/dudanmu/bilibili-danmu-reader-polling.js`
4. **粘贴新代码** (Ctrl+V)

### 第三步：更新脚本说明

1. 找到 "Additional info (for compatibility)" / "详细说明" 字段
2. 更新内容为以下内容：

```markdown
## ✨ 功能特性

### 支持的页面
- 🎥 普通视频页面
- 🎬 番剧/动画页面
- 🔴 **直播间页面** (v0.9.0新增)

### 核心功能
- 🎧 自动语音朗读弹幕
- ⚡ 快速捕捉 - 100ms轮询，99%+捕捉率
- 🎚️ 可调语速 - 0.5x 到 2.0x
- 🔊 音量控制 - 0% 到 100%
- 🎯 快捷键 - Alt+R 快速开启/关闭
- 📊 实时统计 - 显示已读/队列/页面弹幕数
- 🎯 智能过滤 - 过滤重复和无意义弹幕
- ⚙️ 自动加速 - 队列堆积时自动加速

### 使用场景
- 👀 解放双眼 - 边看视频边听弹幕
- 🎓 学习视频 - 听听评论区的观点
- ♿ 无障碍 - 视障用户的完整B站体验
- 💬 互动体验 - 不错过任何精彩评论

## 📝 更新日志

### v0.9.0 (2025-10-22)
- ✨ 新增直播页面支持！
- 🔴 直播间弹幕实时语音阅读
- 🔧 所有优化功能同步支持直播

### v0.8.9
- 无意义弹幕过滤（纯重复字符）
- 动态过滤长度计算

### v0.8.8
- 重复内容过滤

### v0.8.7
- 动态过滤长度（基于队列长度）

### v0.8.6
- 智能过滤 + 自动加速

### v0.8.5
- 默认收起面板
- 面板宽度优化

## 🔗 相关链接

- GitHub: https://github.com/zoubenjia/bilibili-danmu-reader
- 使用说明: https://github.com/zoubenjia/bilibili-danmu-reader/blob/main/README.md
- 测试指南: https://github.com/zoubenjia/bilibili-danmu-reader/blob/main/LIVE-STREAM-TESTING.md

## 🐛 反馈与支持

- GitHub Issues: https://github.com/zoubenjia/bilibili-danmu-reader/issues
- 在此评论区反馈

---

**祝您观看愉快！🎬**
```

### 第四步：提交更新

1. 页面底部点击 "Update" / "保存" 按钮
2. GreasyFork 会提示更新成功
3. 脚本会在您的 GreasyFork 记录中显示新版本

---

## ⏲️ 用户端自动更新

更新提交后：

- **Tampermonkey 用户**: 会在 24 小时内自动检查更新
  - 或手动点击 Tampermonkey → 脚本 → "检查更新"
- **GreasyFork 用户**: 点击脚本页面的更新按钮

---

## 📊 版本信息

| 版本 | 日期 | 主要更新 |
|------|------|--------|
| v0.9.0 | 2025-10-22 | 直播页面支持 |
| v0.8.9 | 2025-10-22 | 无意义弹幕过滤 |
| v0.8.8 | 2025-10-22 | 重复过滤 |
| v0.8.7 | 2025-10-22 | 动态过滤长度 |
| v0.8.6 | 2025-10-22 | 智能过滤+加速 |
| v0.8.5 | 2025-10-22 | 默认收起 |

---

## 🚀 下一步

一旦 GreasyFork 更新完成：

1. ✅ 所有平台同步到 v0.9.0
2. ✅ 用户可在直播间使用语音阅读
3. ✅ GitHub 和 GreasyFork 保持同步

---

**感谢您使用 读弹幕！** 💖
