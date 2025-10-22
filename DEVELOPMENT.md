# 开发指南

## 项目结构

```
读弹幕/
├── README.md           # 项目说明
├── INSTALL.md          # 安装指南
├── DEVELOPMENT.md      # 开发指南（本文件）
└── 读弹幕.user.js      # 主脚本
```

## 快速开发循环

1. **修改脚本**
   - 在 Tampermonkey 中编辑脚本
   - 或直接编辑本地文件，复制到 Tampermonkey

2. **测试**
   - 打开 B 站视频页面
   - F12 打开控制台查看日志
   - 刷新页面 (Ctrl+R / Cmd+R)

3. **调试**
   ```javascript
   // 脚本中已有大量 console.log
   console.log('[读弹幕] ...');
   ```

## 核心概念

### 1. 弹幕检测
- 监听 DOM 变化
- 识别弹幕元素
- 提取文本内容

### 2. 语音合成
- 使用 `SpeechSynthesisUtterance` API
- 支持语速、音调、音量调节
- 自动取消之前的语音

### 3. 去重机制
- 2秒内相同弹幕不重复播放
- 使用 `lastSpokenTexts` 对象记录

## 可能的改进方向

### 短期（v0.2）
- [ ] 改进弹幕 DOM 选择器识别（目前可能识别不准）
- [ ] 添加黑名单/过滤功能（过滤刷屏、广告等）
- [ ] 本地化语言支持（目前仅中文）
- [ ] 添加暂停/继续功能

### 中期（v0.3）
- [ ] 支持多种语言声音选择
- [ ] 记录弹幕历史
- [ ] 添加统计信息（播放多少条弹幕等）
- [ ] 支持自定义 CSS 样式

### 长期（v1.0）
- [ ] 转换为 Firefox 扩展
- [ ] 上传到 GreasyFork
- [ ] 添加配置云同步
- [ ] 支持其他网站（YouTube Live、Twitch 等）

## 调试技巧

### 查看弹幕结构
```javascript
// 在 F12 控制台中运行
document.querySelectorAll('[class*="danmaku"]').forEach(el => console.log(el));
```

### 测试语音
```javascript
let utterance = new SpeechSynthesisUtterance("测试语音");
speechSynthesis.speak(utterance);
```

### 查看当前配置
```javascript
// 脚本中已记录 CONFIG 对象
console.log(CONFIG);
```

## 常见 Bug 修复

### 问题：脚本未运行
**原因**：页面 URL 不匹配 `@match` 规则
**解决**：确保 URL 为 `https://www.bilibili.com/video/BV...`

### 问题：弹幕未被识别
**原因**：B 站 DOM 结构变化
**解决**：
1. 打开 B 站视频
2. F12 查看弹幕的实际 class 名
3. 更新脚本中的选择器

```javascript
const selectors = [
  '.bili-live-chat-item',
  '.danmaku-item',
  '.bili-danmaku-item',
  '[class*="chat-item"]',  // 添加新的选择器
];
```

### 问题：连续播放多条弹幕时卡顿
**原因**：`synth.cancel()` 过于频繁
**解决**：添加队列机制（v0.2 计划）

## 贡献指南

欢迎提交 Issue 或 Pull Request！

### 报告 Bug
1. 提供 B 站视频链接
2. 说明问题现象
3. 提供浏览器版本和控制台错误信息

### 提交功能建议
1. 说明想要的功能
2. 解释为什么有用
3. 提供实现思路

## 参考资源

- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Tampermonkey Documentation](https://www.tampermonkey.net/documentation.php)
- [B 站 API 文档](https://github.com/SocialSisterYi/bilibili-API-collect)
- [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
