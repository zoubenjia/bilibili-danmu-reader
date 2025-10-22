/**
 * 实时调试工具 - 持续监听并诊断问题
 * 复制到控制台运行
 */

console.log('%c=== 实时诊断工具已启动 ===', 'color: blue; font-size: 16px; font-weight: bold;');

// 全局诊断对象
window.DEBUG_INFO = {
  lastLogTime: Date.now(),
  logCount: 0,
  errorCount: 0,
  observerActive: false,
  containerExists: false,
  speechWorking: true,
  logs: [],
};

// 捕获所有控制台输出
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
  const msg = args.join(' ');
  window.DEBUG_INFO.logs.push({
    type: 'log',
    time: Date.now(),
    msg: msg.substring(0, 100),
  });
  window.DEBUG_INFO.logCount++;
  window.DEBUG_INFO.lastLogTime = Date.now();
  originalLog.apply(console, args);
};

console.error = function(...args) {
  const msg = args.join(' ');
  window.DEBUG_INFO.logs.push({
    type: 'error',
    time: Date.now(),
    msg: msg.substring(0, 100),
  });
  window.DEBUG_INFO.errorCount++;
  originalError.apply(console, args);
};

// 每 5 秒检查一次状态
setInterval(() => {
  const info = window.DEBUG_INFO;
  const now = Date.now();
  const timeSinceLastLog = now - info.lastLogTime;

  // 检查容器
  const container = document.querySelector('.bpx-player-row-dm-wrap');
  info.containerExists = !!container;

  // 检查弹幕
  const danmu = document.querySelectorAll('.bili-danmaku-x-dm');

  // 检查是否有新日志
  const hasNewLogs = timeSinceLastLog < 3000;

  console.log(`%c[诊断] ${new Date().toLocaleTimeString()}`, 'color: green; font-weight: bold;');
  console.log(`  容器: ${info.containerExists ? '✓' : '✗'}`);
  console.log(`  弹幕: ${danmu.length} 条`);
  console.log(`  日志: ${info.logCount} 条 (${timeSinceLastLog}ms 前)`);
  console.log(`  错误: ${info.errorCount} 条`);
  console.log(`  状态: ${hasNewLogs ? '✓ 正常工作' : '⚠️ 无输出'}`);

  if (!hasNewLogs) {
    console.warn('%c⚠️ 脚本已停止输出！', 'color: red; font-weight: bold;');
    console.warn('可能原因:');
    console.warn('  1. MutationObserver 被破坏');
    console.warn('  2. 语音 API 出错');
    console.warn('  3. 弹幕容器被替换');

    // 尝试重启
    console.log('尝试诊断...');
    if (document.querySelector('[class*="danmaku"]')) {
      console.log('  ✓ 弹幕元素存在');
    }
    if (window.speechSynthesis?.speaking) {
      console.log('  ⚠️ 语音还在播放中');
    }
  }
}, 5000);

console.log('%c监听已启动，5秒后开始定期诊断...', 'color: orange;');
console.log('使用 window.DEBUG_INFO 查看诊断数据');
