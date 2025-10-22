/**
 * 性能诊断 - 找出为什么逐渐不读弹幕
 * 在控制台运行此脚本
 */

console.log('%c=== 性能诊断工具 ===', 'color: blue; font-size: 16px; font-weight: bold;');

// 监听控制台日志
const logs = [];
const originalLog = console.log;
console.log = function(...args) {
  logs.push(args.join(' '));
  originalLog.apply(console, args);
};

console.log('\n监听中... 请等待 20 秒后收集数据\n');

// 20 秒后分析
setTimeout(() => {
  const speakLogs = logs.filter(l => l.includes('[读弹幕] 播放:'));
  const skipLogs = logs.filter(l => l.includes('[读弹幕] 去重跳过:'));
  const errorLogs = logs.filter(l => l.includes('[读弹幕] 错误') || l.includes('Error'));

  console.log('%c\n=== 统计结果 ===', 'color: green; font-weight: bold;');
  console.log(`📊 20秒内统计:`);
  console.log(`  ✓ 成功读的: ${speakLogs.length} 条`);
  console.log(`  ⊘ 被去重跳过: ${skipLogs.length} 条`);
  console.log(`  ✗ 错误: ${errorLogs.length} 条`);
  console.log(`  📈 成功率: ${(speakLogs.length / (speakLogs.length + skipLogs.length) * 100).toFixed(1)}%`);

  if (skipLogs.length > speakLogs.length * 2) {
    console.log('\n⚠️ 问题: 去重跳过太多！建议:');
    console.log('  1. 降低去重时间 (从2000ms改为500ms)');
    console.log('  2. 或关闭去重功能');
  }

  if (errorLogs.length > 0) {
    console.log('\n⚠️ 发现错误:');
    errorLogs.forEach(e => console.log(`  - ${e}`));
  }

  // 查看 lastSpokenTexts 大小
  console.log('\n%c检查内存占用', 'color: orange; font-weight: bold;');
  try {
    // 这需要在脚本加载后运行
    console.log('如果你看到下面的行，说明脚本在运行:');
    console.log('  (内存数据需要脚本本身暴露)');
  } catch (e) {
    console.log('无法检查脚本内部变量');
  }

  console.log('\n%c建议方案', 'color: purple; font-weight: bold;');
  console.log('1️⃣ 减少去重时间 - 让相同弹幕能重复读');
  console.log('2️⃣ 限制去重历史 - 防止内存堆积');
  console.log('3️⃣ 改进语音队列 - 避免播放中断');

}, 20000);
