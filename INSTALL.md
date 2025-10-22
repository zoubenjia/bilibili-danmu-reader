# 安装指南

## 第一步：安装 Tampermonkey

### Chrome/Edge
1. 访问 [Chrome Web Store - Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejbbpdnlmnpgje)
2. 点击"添加至 Chrome"
3. 确认权限

### Firefox
1. 访问 [Firefox Add-ons - Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/)
2. 点击"添加到 Firefox"
3. 确认权限

## 第二步：安装脚本

### 方法 1：直接导入（推荐）
1. 打开 Tampermonkey 扩展
2. 点击"创建新脚本"
3. 删除默认内容，复制 `读弹幕.user.js` 的全部内容
4. 按 `Ctrl+S` (或 `Cmd+S` on Mac) 保存
5. 脚本会自动启用

### 方法 2：从在线源安装
1. 等待上传到 GreasyFork（URL 待更新）
2. 访问脚本页面
3. 点击"安装脚本"

## 第三步：验证安装

1. 打开 B 站任意视频页面：https://www.bilibili.com/video/BVxxxx
2. 右上角应该出现紫色的"🎤 读弹幕"面板
3. 如果看不到，检查：
   - Tampermonkey 已启用
   - 脚本已启用
   - 页面是否为 bilibili.com/video/*

## 使用

### 控制面板
- **启用/禁用按钮**：切换语音播放功能
- **语速滑块**：调节播放速度（0.5x - 2x）
- **音量滑块**：调节音量（0% - 100%）
- **点击标题**：收起/展开面板

### 快捷键
- `Alt + R`：快速启用/禁用语音播放

## 常见问题

### Q: 没有声音？
A: 检查以下几点：
1. 确认系统音量未静音
2. 确认脚本已启用
3. 尝试调整音量滑块
4. 检查浏览器是否支持 Web Speech API

### Q: 弹幕没有被读出来？
A: 可能是 B 站 DOM 结构发生了变化，建议：
1. 打开浏览器控制台（F12）查看是否有错误
2. 检查弹幕元素的 HTML 结构
3. 联系开发者更新脚本

### Q: 如何卸载？
A: 在 Tampermonkey 扩展中找到脚本，点击删除即可

### Q: 支持其他直播/视频网站吗？
A: 目前只支持 B 站，其他网站可能需要修改选择器
