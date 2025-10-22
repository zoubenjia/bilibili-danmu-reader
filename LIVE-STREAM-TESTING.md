# 读弹幕 - 直播功能测试指南 (v0.9.0)

## 🎬 功能更新

**版本 0.9.0 新增：直播页面支持**

脚本现在支持以下B站页面：
- ✅ 普通视频页面 (`https://www.bilibili.com/video/*`)
- ✅ 番剧页面 (`https://www.bilibili.com/bangumi/*`)
- ✅ **直播页面** (`https://live.bilibili.com/*`) - NEW!

---

## 📋 测试清单

### 1. 安装/更新脚本

#### 如果您已安装脚本：
- Tampermonkey 会自动检查更新（通常24小时内）
- 或手动点击 Tampermonkey → 脚本 → 右击脚本 → "检查更新"

#### 如果您未安装脚本：
- 访问 [GreasyFork 页面](https://greasyfork.org) 搜索"读弹幕"
- 点击 "安装此脚本"

---

### 2. 测试直播弹幕功能

#### **测试步骤：**

1. **打开一个正在直播的直播间**
   - 示例：https://live.bilibili.com/1 (官方直播间)
   - 或找一个有活跃弹幕的直播间

2. **确认脚本已加载**
   - 右上角应该出现 "🎤 读弹幕 v0.9.0" 面板
   - 打开浏览器开发者工具 (F12 → Console)
   - 应该看到日志：`[读弹幕] 脚本已加载 v0.9.0 - 轮询模式`

3. **确认面板功能**
   - 面板显示 "✓ 已启用" 按钮（绿色）
   - 面板显示实时统计信息：
     - ✓已读: 0（弹幕计数）
     - ⏳队列: 0（待处理队列）
     - 📊页面: N（页面上的弹幕数）
     - 🔍过滤: 2字+（当前过滤长度）

4. **观看直播并监听弹幕语音阅读**
   - 有新弹幕出现时，脚本应自动朗读
   - 语音应通过浏览器扬声器播放
   - 计数器应增加（✓已读的数字增加）

5. **测试控制面板**
   - **双击标题** "🎤 读弹幕 v0.9.0" 展开/收起面板
   - **语速滑块**：拖动改变语音速度（0.5x - 2.0x）
   - **音量滑块**：拖动改变语音音量（0% - 100%）
   - **启用/禁用按钮**：切换脚本开关
   - **智能过滤**：在弹幕多时自动过滤短弹幕
   - **自动加速**：在队列堆积时自动加快语速

---

### 3. 与视频页面功能对比

#### **期望行为差异：**

| 功能 | 视频页面 | 直播页面 |
|------|--------|--------|
| **弹幕位置** | 画面上滚动 | 右侧聊天区 |
| **弹幕加载** | 预加载完整列表 | 实时流式加载 |
| **语音阅读** | 按视频进度播放 | 实时阅读 |
| **过滤长度** | 开始时较短 | 可能更短（流式） |

#### **都应该有的功能：**
- ✅ 自动阅读弹幕
- ✅ 语速/音量调整
- ✅ 智能过滤（过滤重复、无意义弹幕）
- ✅ 自动加速（队列堆积时）
- ✅ Alt+R 快捷键切换启用/禁用

---

### 4. 故障排查

#### **症状：面板没有出现**

```javascript
// 在控制台检查脚本是否加载
// 按 F12 打开开发者工具 → Console 标签页
// 输入：
console.log('脚本测试')
```

**解决方案：**
- 刷新页面 (Ctrl+R 或 Cmd+R)
- 确保 Tampermonkey 已启用
- 确保脚本已启用（检查 Tampermonkey 菜单）
- 清除浏览器缓存

#### **症状：面板出现但没有读出弹幕**

```javascript
// 在控制台检查弹幕是否检测到
// 直播页面应该有这样的元素：
document.querySelectorAll('.bili-live-chat-item').length
// 如果返回 > 0，说明弹幕已检测到
```

**解决方案：**
- 检查浏览器是否支持 Web Speech API（大多数现代浏览器支持）
- 检查系统音量是否静音
- 检查浏览器音量是否静音（标签页音量）
- 尝试在控制台手动播放：
  ```javascript
  const utterance = new SpeechSynthesisUtterance('测试');
  speechSynthesis.speak(utterance);
  ```

#### **症状：直播弹幕没有被检测到**

```javascript
// 检查直播弹幕的DOM结构
document.querySelectorAll('.bili-live-chat-item').forEach(el => {
  console.log(el.querySelector('.bili-live-chat-item__content')?.textContent);
});
```

**解决方案：**
- B站可能更新了DOM结构（该情况很少见）
- 在 GitHub Issues 中报告，附上 F12 中的DOM截图

---

### 5. 调试模式（高级）

#### **启用详细日志：**

```javascript
// 在浏览器控制台执行：
CONFIG.debug = true;
```

**会看到的日志：**
```
[读弹幕] 轮询检测到弹幕: "这是一条弹幕"
[读弹幕] ▶ 开始: 这是一条弹幕
[读弹幕] ■ 停止: 这是一条弹幕
```

#### **检查选择器效果：**

```javascript
// 在直播页面控制台执行，查看弹幕元素
const items = document.querySelectorAll('.bili-live-chat-item');
console.log(`检测到 ${items.length} 条弹幕`);

items.forEach((item, index) => {
  const content = item.querySelector('.bili-live-chat-item__content');
  console.log(`弹幕${index + 1}: ${content?.textContent || '无内容'}`);
});
```

---

### 6. 预期的选择器验证

#### **检查脚本能否找到直播弹幕容器：**

```javascript
// 这些选择器应该都有结果：
console.log('容器 1:', document.querySelector('.bili-live-chat-item-list') ? '✓ 找到' : '✗ 未找到');
console.log('弹幕项:', document.querySelectorAll('.bili-live-chat-item').length, '条');
console.log('内容选择器:', document.querySelectorAll('.bili-live-chat-item__content').length, '条');
```

---

## 📝 测试报告模板

如果遇到问题，请按以下格式报告：

```
## 问题描述
[描述问题现象]

## 测试环境
- 浏览器: Chrome / Firefox / Edge / Safari
- 浏览器版本:
- 操作系统: Windows / macOS / Linux
- Tampermonkey 版本:

## 复现步骤
1. [步骤1]
2. [步骤2]

## 预期结果
[应该发生什么]

## 实际结果
[实际发生了什么]

## 控制台日志
[粘贴 F12 → Console 的相关日志]

## DOM检查结果
[粘贴上述检查命令的结果]
```

---

## 🎉 测试成功标志

✅ 脚本在直播页面加载
✅ 面板显示在右上角
✅ 直播弹幕被自动读出
✅ 统计数据实时更新
✅ 语速/音量控制正常工作
✅ 过滤功能正常工作

---

## 🔗 相关链接

- GitHub Issues: https://github.com/zoubenjia/bilibili-danmu-reader/issues
- GreasyFork 脚本页面: https://greasyfork.org
- Web Speech API 文档: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

## 📊 版本历史

### v0.9.0 (2025-10-22)
- ✨ **新增直播页面支持**
- 🎤 直播间弹幕实时语音阅读
- 🔧 所有过滤和优化功能继续支持直播

### v0.8.9 (2025-10-22)
- 🔄 无意义弹幕过滤（纯重复字符）
- 📊 动态过滤长度计算

### v0.8.8
- 🎯 重复内容过滤

### v0.8.7
- 📈 动态过滤长度（基于队列长度）

### v0.8.6
- 🚀 智能过滤 + 自动加速

### v0.8.5
- 📦 默认收起面板

---

**祝您测试愉快！🎬**

如有问题，欢迎在 GitHub Issues 中反馈！
