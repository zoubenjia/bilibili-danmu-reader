/**
 * 实时诊断工具 - 检查是否真的有新弹幕在产生
 * 在控制台运行此脚本
 */

console.log('%c=== 实时诊断工具 ===', 'color: blue; font-size: 16px; font-weight: bold;');

const diagnosis = {
  lastCount: 0,
  observerTriggered: 0,
  startTime: Date.now(),
};

// 1. 监听 MutationObserver 是否被触发
const testObserver = new MutationObserver((mutations) => {
  diagnosis.observerTriggered++;
  console.log(`[MutationObserver] 触发 #${diagnosis.observerTriggered}`);
});

const container = document.querySelector('.bpx-player-row-dm-wrap');
if (container) {
  testObserver.observe(container, {
    childList: true,
    subtree: true,
  });
  console.log('✓ 已连接测试观察者');
} else {
  console.log('✗ 找不到容器');
}

// 2. 每秒检查弹幕数量和日志输出
console.log('\n%c开始监听 (10秒内)', 'color: green;');
console.log('请稍候...\n');

setInterval(() => {
  const now = Date.now();
  const elapsed = Math.floor((now - diagnosis.startTime) / 1000);

  const allDanmu = document.querySelectorAll('.bili-danmaku-x-dm');
  const currentCount = allDanmu.length;
  const diff = currentCount - diagnosis.lastCount;

  console.log(`[${elapsed}s] 弹幕数: ${currentCount} (新增: ${diff}) | MutationObserver触发: ${diagnosis.observerTriggered} 次`);

  if (diff > 0) {
    console.log(`  ✓ 检测到 ${diff} 条新弹幕！`);
  }

  diagnosis.lastCount = currentCount;

  if (elapsed >= 10) {
    console.log('\n%c=== 诊断完成 ===', 'color: blue; font-size: 14px;');
    console.log(`总弹幕: ${currentCount}`);
    console.log(`MutationObserver触发: ${diagnosis.observerTriggered} 次`);
    console.log(`新增弹幕: ${currentCount - 0}`);

    if (diagnosis.observerTriggered === 0) {
      console.warn('\n⚠️ 问题: MutationObserver 一次都没触发！');
      console.warn('可能是:');
      console.warn('  1. 容器被监听后没有新弹幕加入');
      console.warn('  2. 你停止了看视频');
      console.warn('  3. 弹幕已经全部显示了');
    } else if (currentCount > 0 && diagnosis.observerTriggered > 0) {
      console.log('\n✓ 看起来一切正常！MutationObserver 在工作');
    }

    testObserver.disconnect();
    clearInterval(this);
  }
}, 1000);
