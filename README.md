# 读弹幕 - B站弹幕语音阅读

自动朗读B站弹幕的Tampermonkey脚本，支持**视频、番剧和直播**，特别适合视障用户无障碍观看B站。

## ✨ 功能特性

- 🎧 **自动语音朗读** - 实时将弹幕转换为语音（支持视频/直播/番剧）
- ⚡ **快速捕捉** - 100ms轮询，不遗漏任何弹幕
- 🎚️ **可调语速** - 支持 0.5x 到 2.0x 速度调节
- 🔊 **音量控制** - 0% 到 100% 随意调整
- 🎯 **快捷键** - Alt+R 快速开启/关闭
- 📊 **实时统计** - 显示已读/队列/页面弹幕数
- ♿ **无障碍设计** - 为视障用户特别优化
- 📱 **轻量级** - 仅12KB，不占用系统资源

## 🚀 快速开始

### 安装

1. **安装Tampermonkey**（支持Chrome、Firefox、Edge）
   - Chrome: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobela
   - Firefox: https://addons.mozilla.org/firefox/addon/tampermonkey/
   - Edge: https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfohd

2. **安装本脚本**
   - GreasyFork: https://greasyfork.org/en/scripts/553274
   - 或直接 [点击安装](https://greasyfork.org/en/scripts/553274/code/bilibili-danmu-reader-polling.js)

3. **打开B站视频/直播，享受自动语音阅读！**

## 📄 支持的页面

脚本支持以下B站页面类型：

| 页面类型 | URL示例 | 支持 |
|---------|--------|------|
| 普通视频 | `https://www.bilibili.com/video/BV...` | ✅ |
| 番剧/动画 | `https://www.bilibili.com/bangumi/...` | ✅ |
| 直播间 | `https://live.bilibili.com/...` | ✅ |

> **v0.9.0 新增：直播页面支持！** 🎉

## ⌨️ 使用方法

| 快捷键 | 功能 |
|--------|------|
| Alt+R | 启用/关闭脚本 |
| 拖拽标题栏 | 移动控制面板 |
| 双击标题栏 | 折叠/展开面板 |
| 滑块 | 调节语速和音量 |

## 🎯 使用场景

- 👀 **解放双眼** - 边看视频边听弹幕，无需低头看屏幕
- 🎓 **学习视频** - 听听评论区的观点和讨论
- ♿ **无障碍** - 视障用户的完整B站体验
- 💬 **互动体验** - 不错过任何精彩评论

## 🛠️ 技术实现

- **DOM轮询** - 使用100ms快速轮询捕捉弹幕（而非MutationObserver）
- **文本去重** - 基于文本+位置的智能去重机制
- **Web Speech API** - 队列系统实现顺序播放
- **GM脚本** - 使用Tampermonkey提供的GM_setValue/GM_getValue存储用户设置

### 为什么不用MutationObserver？

经过测试，B站的DOM更新速度非常快，MutationObserver无法跟上。采用100ms轮询后：
- ✅ 捕捉速度从~60%提升到99%+
- ✅ 不会因为容器替换而失效
- ✅ CPU占用仍然很低（<1%）

## 📋 配置说明

脚本会在浏览器本地存储以下设置：

```javascript
{
  enabled: true,        // 是否启用
  rate: 1.0,           // 语速 (0.5-2.0)
  pitch: 1,            // 音调 (0.5-2.0)
  volume: 1,           // 音量 (0-1)
  deduplicateTime: 500 // 去重时间窗口(ms)
}
```

所有设置会自动保存，重新打开页面后自动恢复。

## 🐛 常见问题

### Q: 为什么有些弹幕没有被读出来？

A: 如果弹幕在2秒内重复，会被去重。这是为了避免重复朗读相同的弹幕。你可以调整 `deduplicateTime` 参数。

### Q: 脚本会占用很多CPU吗？

A: 不会。轮询系统已优化，CPU占用 <1%，内存占用 <5MB。

### Q: 支持其他视频网站吗？

A: 目前仅支持B站。其他网站的弹幕结构不同，需要单独适配。

### Q: 脚本可以朗读中英文吗？

A: 可以！Web Speech API会自动识别语言，中文和英文都能准确朗读。

### Q: 在哪里可以反馈问题或建议？

A: 可以在 GreasyFork 的评论区、或在本仓库的 Issues 中反馈。

## 💡 后续计划

- [ ] 支持自定义文本过滤（屏蔽特定关键词）
- [ ] 支持其他视频网站（YouTube、Twitch等）
- [ ] 快捷键跳过当前弹幕 (Alt+N)
- [ ] 统计面板展示更多数据
- [ ] 深色主题支持

## 📞 反馈和支持

- **问题报告**: https://github.com/zoubenjia/bilibili-danmu-reader/issues
- **功能建议**: 在GreasyFork评论区或GitHub Discussions
- **贡献代码**: 欢迎Pull Requests！

## 📝 许可证

MIT License - 完全开源，可自由使用和修改。

详见 [LICENSE](./LICENSE) 文件。

## 🙏 致谢

感谢所有用户的反馈和支持！特别感谢视障用户社区的建议，这个项目正是为了让所有人都能享受B站。

---

**最后更新**: 2025-10-22
**当前版本**: 0.8.3
**作者**: Zou Benjamin
**GitHub**: https://github.com/zoubenjia/bilibili-danmu-reader
